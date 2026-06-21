import {
  PreparationList,
  TestDriveRecord,
  QuoteHistory,
  Car,
} from "../models/index.js";
import { createOperationLog } from "../utils/operationLog.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

export const getCarRecords = async (req, res) => {
  try {
    const { carId } = req.params;

    const [car, preparations, testDrives, quotes] = await Promise.all([
      Car.findById(carId),
      PreparationList.find({ carId }).sort({ createdAt: -1 }).populate("createdBy", "name"),
      TestDriveRecord.find({ carId })
        .sort({ createdAt: -1 })
        .populate("driverId", "name")
        .populate("createdBy", "name"),
      QuoteHistory.find({ carId }).sort({ createdAt: -1 }).populate("negotiatorId", "name"),
    ]);

    if (!car) {
      return res.status(404).json({ error: "车辆不存在" });
    }

    res.json({
      car,
      preparations,
      testDrives,
      quotes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listPreparationLists = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, carId, status } = req.query;
    const query = {};
    if (carId) query.carId = carId;
    if (status) query.status = status;

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      PreparationList.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("carId", "vin brand model plateNumber status")
        .populate("createdBy", "name"),
      PreparationList.countDocuments(query),
    ]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPreparationList = async (req, res) => {
  try {
    const { carId, items, remark } = req.body;
    const totalCost = items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
    const allCompleted = items?.every((item) => item.status === "completed");

    const prepList = new PreparationList({
      carId,
      items,
      totalCost,
      status: allCompleted ? "completed" : items?.some((i) => i.status === "in-progress") ? "in-progress" : "pending",
      createdBy: MOCK_USER_ID,
      remark,
    });
    await prepList.save();
    await prepList.populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "create",
      module: "preparation",
      targetType: "PreparationList",
      targetId: prepList._id,
      targetName: `${prepList.carId?.brand} ${prepList.carId?.model} 整备清单`,
      newValue: prepList.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.status(201).json(prepList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePreparationList = async (req, res) => {
  try {
    const oldPrep = await PreparationList.findById(req.params.id);
    if (!oldPrep) {
      return res.status(404).json({ error: "整备清单不存在" });
    }

    const { items, remark, status } = req.body;
    const updateData = {};
    if (items !== undefined) {
      updateData.items = items;
      updateData.totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
      if (!status) {
        updateData.status = items.every((item) => item.status === "completed")
          ? "completed"
          : items.some((i) => i.status === "in-progress")
          ? "in-progress"
          : "pending";
        if (updateData.status === "completed") {
          updateData.completedDate = new Date();
        }
      }
    }
    if (remark !== undefined) updateData.remark = remark;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") updateData.completedDate = new Date();
    }

    const updated = await PreparationList.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "update",
      module: "preparation",
      targetType: "PreparationList",
      targetId: oldPrep._id,
      oldValue: oldPrep.toObject(),
      newValue: updated.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listTestDriveRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, carId, driverId } = req.query;
    const query = {};
    if (carId) query.carId = carId;
    if (driverId) query.driverId = driverId;

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      TestDriveRecord.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("carId", "vin brand model plateNumber")
        .populate("driverId", "name")
        .populate("createdBy", "name"),
      TestDriveRecord.countDocuments(query),
    ]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTestDriveRecord = async (req, res) => {
  try {
    const record = new TestDriveRecord({
      ...req.body,
      driverId: req.body.driverId || MOCK_USER_ID,
      createdBy: MOCK_USER_ID,
    });
    await record.save();
    await record.populate("carId", "vin brand model plateNumber");
    await record.populate("driverId", "name");

    await createOperationLog({
      action: "create",
      module: "test-drive",
      targetType: "TestDriveRecord",
      targetId: record._id,
      targetName: `${record.carId?.brand} ${record.carId?.model} 试驾记录`,
      newValue: record.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTestDriveRecord = async (req, res) => {
  try {
    const oldRecord = await TestDriveRecord.findById(req.params.id);
    if (!oldRecord) {
      return res.status(404).json({ error: "试驾记录不存在" });
    }

    const updated = await TestDriveRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("carId", "vin brand model plateNumber")
      .populate("driverId", "name");

    await createOperationLog({
      action: "update",
      module: "test-drive",
      targetType: "TestDriveRecord",
      targetId: oldRecord._id,
      oldValue: oldRecord.toObject(),
      newValue: updated.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listQuoteHistories = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, carId, quoteStatus } = req.query;
    const query = {};
    if (carId) query.carId = carId;
    if (quoteStatus) query.quoteStatus = quoteStatus;

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      QuoteHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("carId", "vin brand model plateNumber sellingPrice")
        .populate("negotiatorId", "name"),
      QuoteHistory.countDocuments(query),
    ]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createQuoteHistory = async (req, res) => {
  try {
    const quote = new QuoteHistory({
      ...req.body,
      negotiatorId: req.body.negotiatorId || MOCK_USER_ID,
      createdBy: MOCK_USER_ID,
    });
    await quote.save();
    await quote.populate("carId", "vin brand model plateNumber");
    await quote.populate("negotiatorId", "name");

    await createOperationLog({
      action: "create",
      module: "quote",
      targetType: "QuoteHistory",
      targetId: quote._id,
      targetName: `${quote.carId?.brand} ${quote.carId?.model} 报价记录`,
      newValue: quote.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuoteHistory = async (req, res) => {
  try {
    const oldQuote = await QuoteHistory.findById(req.params.id);
    if (!oldQuote) {
      return res.status(404).json({ error: "报价记录不存在" });
    }

    const updated = await QuoteHistory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("carId", "vin brand model plateNumber")
      .populate("negotiatorId", "name");

    await createOperationLog({
      action: "update",
      module: "quote",
      targetType: "QuoteHistory",
      targetId: oldQuote._id,
      oldValue: oldQuote.toObject(),
      newValue: updated.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
