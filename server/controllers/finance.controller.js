import { FinanceData, Car } from "../models/index.js";
import { createOperationLog } from "../utils/operationLog.js";
import { getChangedFields, buildChangeLog } from "../utils/common.js";
import { createNotification } from "../utils/notification.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

const TRACKED_FIELDS = [
  "purchasePrice",
  "purchaseDate",
  "preparationCost",
  "totalCost",
  "sellingPrice",
  "dealDate",
  "actualReceived",
  "profit",
  "profitMargin",
  "settlementStatus",
  "loanInfo",
  "insuranceInfo",
];

export const listFinanceData = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, settlementStatus, keyword } = req.query;
    const query = {};
    if (settlementStatus) query.settlementStatus = settlementStatus;

    let carIds = null;
    if (keyword) {
      const cars = await Car.find({
        $or: [
          { vin: { $regex: keyword, $options: "i" } },
          { plateNumber: { $regex: keyword, $options: "i" } },
          { brand: { $regex: keyword, $options: "i" } },
          { model: { $regex: keyword, $options: "i" } },
        ],
      }).select("_id");
      carIds = cars.map((c) => c._id);
      query.carId = { $in: carIds };
    }

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      FinanceData.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("carId", "vin brand model plateNumber status"),
      FinanceData.countDocuments(query),
    ]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFinanceData = async (req, res) => {
  try {
    const finance = await FinanceData.findOne({ carId: req.params.carId }).populate(
      "carId",
      "vin brand model plateNumber status"
    );
    if (!finance) {
      return res.status(404).json({ error: "金融资料不存在" });
    }
    res.json(finance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFinanceData = async (req, res) => {
  try {
    const existing = await FinanceData.findOne({ carId: req.body.carId });
    if (existing) {
      return res.status(400).json({ error: "该车辆金融资料已存在" });
    }

    const { otherCosts, preparationCost, purchasePrice, sellingPrice } = req.body;
    const otherTotal = otherCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalCost = (purchasePrice || 0) + (preparationCost || 0) + otherTotal;
    const profit = (sellingPrice || 0) - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const finance = new FinanceData({
      ...req.body,
      totalCost,
      profit,
      profitMargin,
      createdBy: MOCK_USER_ID,
      updatedBy: MOCK_USER_ID,
    });
    await finance.save();
    await finance.populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "create",
      module: "finance-data",
      targetType: "FinanceData",
      targetId: finance._id,
      targetName: `${finance.carId?.brand} ${finance.carId?.model} 金融资料`,
      newValue: finance.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.status(201).json(finance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFinanceData = async (req, res) => {
  try {
    const oldFinance = await FinanceData.findOne({ carId: req.params.carId });
    if (!oldFinance) {
      return res.status(404).json({ error: "金融资料不存在" });
    }

    const oldData = oldFinance.toObject();
    const updateData = { ...req.body };
    updateData.updatedBy = MOCK_USER_ID;

    const { otherCosts, preparationCost, purchasePrice, sellingPrice } = {
      ...oldData,
      ...req.body,
    };
    const otherTotal = otherCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalCost = (purchasePrice || 0) + (preparationCost || 0) + otherTotal;
    const profit = (sellingPrice || 0) - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    updateData.totalCost = totalCost;
    updateData.profit = profit;
    updateData.profitMargin = profitMargin;

    const trackedOldData = {};
    const trackedNewData = {};
    for (const field of TRACKED_FIELDS) {
      trackedOldData[field] = oldData[field];
      trackedNewData[field] = updateData[field] !== undefined ? updateData[field] : oldData[field];
    }

    const changedFields = getChangedFields(trackedOldData, trackedNewData);
    const changeReason = req.body.changeReason || null;

    if (changedFields.length > 0) {
      const newLogs = buildChangeLog(
        trackedOldData,
        trackedNewData,
        changedFields,
        MOCK_USER_ID,
        changeReason
      );

      updateData.$push = {
        changeLogs: { $each: newLogs },
      };

      if (changedFields.includes("settlementStatus")) {
        await createNotification({
          type: "finance-change",
          title: "金融资料结算状态变更",
          content: `车辆金融资料结算状态变更为：${updateData.settlementStatus}${changeReason ? `，原因：${changeReason}` : ""}`,
          priority: "medium",
          recipientIds: [MOCK_USER_ID],
          relatedType: "FinanceData",
          relatedId: oldFinance._id,
        });
      }
    }

    const updated = await FinanceData.findOneAndUpdate(
      { carId: req.params.carId },
      updateData,
      { new: true }
    ).populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "update",
      module: "finance-data",
      targetType: "FinanceData",
      targetId: oldFinance._id,
      targetName: `${updated.carId?.brand} ${updated.carId?.model} 金融资料`,
      reason: changeReason,
      oldValue: trackedOldData,
      newValue: trackedNewData,
      changedFields,
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFinanceChangeLogs = async (req, res) => {
  try {
    const finance = await FinanceData.findOne({ carId: req.params.carId })
      .select("changeLogs")
      .populate("changeLogs.changedBy", "name role");

    if (!finance) {
      return res.status(404).json({ error: "金融资料不存在" });
    }

    res.json({ changeLogs: finance.changeLogs || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
