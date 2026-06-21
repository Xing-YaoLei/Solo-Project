import {
  InventoryTurnover,
  Car,
  FinanceData,
  PreparationList,
} from "../models/index.js";
import {
  getMonthStr,
  getQuarterStr,
  calculateDaysDiff,
  formatDate,
} from "../utils/common.js";
import { createOperationLog } from "../utils/operationLog.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

export const getInventoryTurnoverStats = async (req, res) => {
  try {
    const {
      month,
      quarter,
      year,
      status,
      page = 1,
      pageSize = 20,
    } = req.query;

    const query = {};
    if (month) query.month = month;
    if (quarter) query.quarter = quarter;
    if (year) query.year = Number(year);
    if (status) query.status = status;

    const skip = (page - 1) * pageSize;

    const [list, total, allRecords] = await Promise.all([
      InventoryTurnover.find(query)
        .sort({ inStockDate: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      InventoryTurnover.countDocuments(query),
      InventoryTurnover.find(query),
    ]);

    const stats = calculateTurnoverStats(allRecords);

    res.json({
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateTurnoverStats = (records) => {
  const soldRecords = records.filter((r) => r.status !== "in-stock");
  const inStockRecords = records.filter((r) => r.status === "in-stock");

  const totalCars = records.length;
  const soldCount = soldRecords.length;
  const inStockCount = inStockRecords.length;
  const soldRate = totalCars > 0 ? (soldCount / totalCars) * 100 : 0;

  const avgDaysInStock =
    soldRecords.length > 0
      ? soldRecords.reduce((sum, r) => sum + (r.daysInStock || 0), 0) / soldRecords.length
      : 0;

  const avgDaysToSell =
    soldRecords.filter((r) => r.daysToSell).length > 0
      ? soldRecords
          .filter((r) => r.daysToSell)
          .reduce((sum, r) => sum + r.daysToSell, 0) /
        soldRecords.filter((r) => r.daysToSell).length
      : 0;

  const totalRevenue = soldRecords.reduce((sum, r) => sum + (r.sellingPrice || 0), 0);
  const totalCost = soldRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalProfit = soldRecords.reduce((sum, r) => sum + (r.profit || 0), 0);
  const avgProfitMargin =
    soldRecords.length > 0
      ? soldRecords.reduce((sum, r) => sum + (r.profitMargin || 0), 0) / soldRecords.length
      : 0;

  const currentlyOver30 = inStockRecords.filter((r) => {
    const days = calculateDaysDiff(r.inStockDate, new Date());
    return days && days > 30;
  }).length;

  const currentlyOver60 = inStockRecords.filter((r) => {
    const days = calculateDaysDiff(r.inStockDate, new Date());
    return days && days > 60;
  }).length;

  return {
    totalCars,
    soldCount,
    inStockCount,
    soldRate: soldRate.toFixed(2),
    avgDaysInStock: avgDaysInStock.toFixed(1),
    avgDaysToSell: avgDaysToSell.toFixed(1),
    totalRevenue,
    totalCost,
    totalProfit,
    avgProfitMargin: avgProfitMargin.toFixed(2),
    currentlyOver30,
    currentlyOver60,
  };
};

export const getMonthlyReview = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month
      ? Number(month)
      : new Date().getMonth() + 1;

    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const monthRecords = await InventoryTurnover.find({ month: monthStr });
    const monthStats = calculateTurnoverStats(monthRecords);

    const quarterlyMonths = [];
    const quarterStart = Math.floor((currentMonth - 1) / 3) * 3 + 1;
    for (let i = quarterStart; i < quarterStart + 3; i++) {
      quarterlyMonths.push(`${currentYear}-${String(i).padStart(2, "0")}`);
    }
    const quarterRecords = await InventoryTurnover.find({
      month: { $in: quarterlyMonths },
    });
    const quarterStats = calculateTurnoverStats(quarterRecords);

    const monthlyTrend = [];
    for (let i = 1; i <= 12; i++) {
      const m = `${currentYear}-${String(i).padStart(2, "0")}`;
      const monthData = await InventoryTurnover.find({ month: m });
      const stats = calculateTurnoverStats(monthData);
      monthlyTrend.push({
        month: `${i}月`,
        soldCount: stats.soldCount,
        inStockCount: stats.inStockCount,
        totalRevenue: stats.totalRevenue,
        totalProfit: stats.totalProfit,
        avgDaysInStock: stats.avgDaysInStock,
      });
    }

    const slowMovingCars = await InventoryTurnover.find({
      status: "in-stock",
    })
      .sort({ inStockDate: 1 })
      .limit(10);

    res.json({
      period: {
        year: currentYear,
        month: currentMonth,
        monthStr,
      },
      monthStats,
      quarterStats,
      monthlyTrend,
      slowMovingCars,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCarTurnoverDetail = async (req, res) => {
  try {
    const { carId } = req.params;
    const [turnover, car, finance, preparations] = await Promise.all([
      InventoryTurnover.findOne({ carId }),
      Car.findById(carId),
      FinanceData.findOne({ carId }),
      PreparationList.find({ carId }).sort({ createdAt: -1 }),
    ]);

    if (!car) {
      return res.status(404).json({ error: "车辆不存在" });
    }

    const currentDaysInStock = calculateDaysDiff(car.inStockDate, new Date());

    res.json({
      car,
      turnover,
      finance,
      preparations,
      currentDaysInStock,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const syncInventoryTurnover = async (req, res) => {
  try {
    const cars = await Car.find({});
    let syncedCount = 0;

    for (const car of cars) {
      const [finance, preps] = await Promise.all([
        FinanceData.findOne({ carId: car._id }),
        PreparationList.findOne({ carId: car._id }),
      ]);

      const daysInStock = calculateDaysDiff(car.inStockDate, car.soldDate || new Date());
      const daysToSell = calculateDaysDiff(car.inStockDate, car.soldDate);
      const daysToTransfer = calculateDaysDiff(car.soldDate, car.transferredDate);

      const preparationCost =
        preps?.totalCost ||
        (preps?.items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0);

      const purchasePrice = finance?.purchasePrice || car.purchasePrice || 0;
      const sellingPrice = finance?.sellingPrice || car.sellingPrice || 0;
      const otherCosts =
        finance?.otherCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const totalCost = purchasePrice + preparationCost + otherCosts;
      const profit = sellingPrice - totalCost;
      const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      let status = "in-stock";
      if (car.status === "transferred") status = "transferred";
      else if (car.status === "sold") status = "sold";

      const month = car.inStockDate ? getMonthStr(car.inStockDate) : getMonthStr(new Date());
      const quarter = car.inStockDate ? getQuarterStr(car.inStockDate) : getQuarterStr(new Date());
      const yearNum = car.inStockDate
        ? new Date(car.inStockDate).getFullYear()
        : new Date().getFullYear();

      await InventoryTurnover.findOneAndUpdate(
        { carId: car._id },
        {
          carId: car._id,
          vin: car.vin,
          brand: car.brand,
          model: car.model,
          year: car.year,
          inStockDate: car.inStockDate,
          soldDate: car.soldDate,
          transferredDate: car.transferredDate,
          daysInStock,
          daysToSell,
          daysToTransfer,
          purchasePrice,
          sellingPrice,
          profit,
          profitMargin,
          preparationCost,
          totalCost,
          month,
          quarter,
          year: yearNum,
          status,
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    await createOperationLog({
      action: "sync",
      module: "system",
      targetType: "InventoryTurnover",
      targetName: "库存周转数据同步",
      reason: `同步了 ${syncedCount} 条车辆数据`,
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json({ message: "同步完成", syncedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
