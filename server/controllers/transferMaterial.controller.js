import { TransferMaterial, Car, User } from "../models/index.js";
import { createOperationLog } from "../utils/operationLog.js";
import { notifyMaterialMissing } from "../utils/notification.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

const DEFAULT_MATERIALS = [
  { name: "机动车登记证书", category: "vehicle-docs", required: true },
  { name: "机动车行驶证", category: "vehicle-docs", required: true },
  { name: "车辆购置税完税证明", category: "vehicle-docs", required: true },
  { name: "交强险保单", category: "insurance-docs", required: true },
  { name: "商业险保单", category: "insurance-docs", required: false },
  { name: "原车主身份证", category: "owner-docs", required: true },
  { name: "新车主身份证", category: "buyer-docs", required: true },
  { name: "二手车交易发票", category: "transaction-docs", required: true },
  { name: "二手车买卖合同", category: "transaction-docs", required: true },
  { name: "车辆年检合格标志", category: "vehicle-docs", required: true },
];

export const listTransferMaterials = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, overallStatus, keyword } = req.query;
    const query = {};
    if (overallStatus) query.overallStatus = overallStatus;

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
      TransferMaterial.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("carId", "vin brand model plateNumber status"),
      TransferMaterial.countDocuments(query),
    ]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransferMaterial = async (req, res) => {
  try {
    const material = await TransferMaterial.findOne({
      carId: req.params.carId,
    }).populate("carId", "vin brand model plateNumber status");
    if (!material) {
      return res.status(404).json({ error: "过户材料不存在" });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransferMaterial = async (req, res) => {
  try {
    const { carId, materials, assignedTo } = req.body;

    const existing = await TransferMaterial.findOne({ carId });
    if (existing) {
      return res.status(400).json({ error: "该车辆过户材料已存在" });
    }

    const finalMaterials =
      materials?.length > 0
        ? materials
        : DEFAULT_MATERIALS.map((m) => ({ ...m, status: "missing" }));

    const missingMaterials = finalMaterials
      .filter((m) => m.required && m.status === "missing")
      .map((m) => m.name);

    const overallStatus =
      missingMaterials.length > 0 ? "incomplete" : "submitting";

    const transferMaterial = new TransferMaterial({
      carId,
      materials: finalMaterials,
      overallStatus,
      missingMaterials,
      assignedTo: assignedTo || MOCK_USER_ID,
      createdBy: MOCK_USER_ID,
    });

    await transferMaterial.save();
    await transferMaterial.populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "create",
      module: "transfer-material",
      targetType: "TransferMaterial",
      targetId: transferMaterial._id,
      targetName: `${transferMaterial.carId?.brand} ${transferMaterial.carId?.model} 过户材料`,
      newValue: transferMaterial.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    if (missingMaterials.length > 0) {
      const car = await Car.findById(carId);
      const handlerIds = assignedTo ? [assignedTo] : [MOCK_USER_ID];
      await notifyMaterialMissing(carId, missingMaterials, car, handlerIds);

      await createOperationLog({
        action: "notify-missing",
        module: "transfer-material",
        targetType: "TransferMaterial",
        targetId: transferMaterial._id,
        reason: `缺少资料：${missingMaterials.join("、")}`,
        operatorId: MOCK_USER_ID,
        operatorName: MOCK_USER_NAME,
      });
    }

    res.status(201).json(transferMaterial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTransferMaterial = async (req, res) => {
  try {
    const oldMaterial = await TransferMaterial.findOne({ carId: req.params.carId });
    if (!oldMaterial) {
      return res.status(404).json({ error: "过户材料不存在" });
    }

    const { materials, overallStatus, assignedTo, remark } = req.body;
    const updateData = {};

    if (materials !== undefined) {
      updateData.materials = materials;
      const missingMaterials = materials
        .filter((m) => m.required && m.status === "missing")
        .map((m) => m.name);
      updateData.missingMaterials = missingMaterials;

      if (!overallStatus) {
        const allVerified = materials.every((m) => !m.required || m.status === "verified" || m.status === "waived");
        const anyMissing = materials.some((m) => m.required && m.status === "missing");
        if (allVerified) updateData.overallStatus = "approved";
        else if (anyMissing) updateData.overallStatus = "incomplete";
        else updateData.overallStatus = "reviewing";

        if (updateData.overallStatus === "approved") {
          updateData.approvedDate = new Date();
        }
      }

      updateData.lastSubmittedDate = new Date();
      if (!oldMaterial.firstSubmittedDate && materials.some((m) => m.status === "submitted")) {
        updateData.firstSubmittedDate = new Date();
      }
    }
    if (overallStatus !== undefined) {
      updateData.overallStatus = overallStatus;
      if (overallStatus === "approved") updateData.approvedDate = new Date();
      if (overallStatus === "rejected") updateData.rejectedDate = new Date();
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (remark !== undefined) updateData.remark = remark;

    const updated = await TransferMaterial.findOneAndUpdate(
      { carId: req.params.carId },
      updateData,
      { new: true }
    ).populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "update",
      module: "transfer-material",
      targetType: "TransferMaterial",
      targetId: oldMaterial._id,
      targetName: `${updated.carId?.brand} ${updated.carId?.model} 过户材料`,
      oldValue: oldMaterial.toObject(),
      newValue: updated.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    if (updateData.missingMaterials?.length > 0 && updateData.assignedTo) {
      const car = await Car.findById(req.params.carId);
      const handlerIds = [updateData.assignedTo];
      await notifyMaterialMissing(
        req.params.carId,
        updateData.missingMaterials,
        car,
        handlerIds
      );
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMaterialItem = async (req, res) => {
  try {
    const { carId, itemIndex } = req.params;
    const transferMaterial = await TransferMaterial.findOne({ carId });

    if (!transferMaterial) {
      return res.status(404).json({ error: "过户材料不存在" });
    }

    const index = parseInt(itemIndex);
    if (isNaN(index) || index < 0 || index >= transferMaterial.materials.length) {
      return res.status(400).json({ error: "无效的材料索引" });
    }

    const oldMaterial = transferMaterial.toObject();
    const oldItem = { ...transferMaterial.materials[index] };

    transferMaterial.materials[index] = {
      ...transferMaterial.materials[index],
      ...req.body,
    };

    if (req.body.status === "submitted") {
      transferMaterial.materials[index].submittedDate = new Date();
    } else if (req.body.status === "verified") {
      transferMaterial.materials[index].verifiedDate = new Date();
    } else if (req.body.status === "rejected") {
      transferMaterial.materials[index].rejectedDate = new Date();
    }

    const missingMaterials = transferMaterial.materials
      .filter((m) => m.required && m.status === "missing")
      .map((m) => m.name);
    transferMaterial.missingMaterials = missingMaterials;

    const materials = transferMaterial.materials;
    const allVerified = materials.every((m) => !m.required || m.status === "verified" || m.status === "waived");
    const anyMissing = materials.some((m) => m.required && m.status === "missing");
    if (allVerified) {
      transferMaterial.overallStatus = "approved";
      transferMaterial.approvedDate = new Date();
    } else if (anyMissing) {
      transferMaterial.overallStatus = "incomplete";
    } else {
      transferMaterial.overallStatus = "reviewing";
    }

    if (!transferMaterial.firstSubmittedDate && req.body.status === "submitted") {
      transferMaterial.firstSubmittedDate = new Date();
    }
    transferMaterial.lastSubmittedDate = new Date();

    await transferMaterial.save();
    await transferMaterial.populate("carId", "vin brand model plateNumber");

    await createOperationLog({
      action: "update-item",
      module: "transfer-material",
      targetType: "TransferMaterial",
      targetId: transferMaterial._id,
      targetName: `材料：${oldItem.name}`,
      oldValue: oldItem,
      newValue: transferMaterial.materials[index].toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    if (missingMaterials.length > 0 && transferMaterial.assignedTo) {
      const car = transferMaterial.carId;
      await notifyMaterialMissing(carId, missingMaterials, car, [transferMaterial.assignedTo]);
    }

    res.json(transferMaterial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkMissingMaterials = async (req, res) => {
  try {
    const transferMaterial = await TransferMaterial.findOne({
      carId: req.params.carId,
    }).populate("carId", "vin brand model plateNumber");

    if (!transferMaterial) {
      return res.status(404).json({ error: "过户材料不存在" });
    }

    const missingMaterials = transferMaterial.materials
      .filter((m) => m.required && m.status === "missing")
      .map((m) => m.name);

    if (missingMaterials.length > 0 && transferMaterial.assignedTo) {
      const handlerIds = [transferMaterial.assignedTo];
      await notifyMaterialMissing(
        req.params.carId,
        missingMaterials,
        transferMaterial.carId,
        handlerIds
      );
    }

    res.json({
      missingCount: missingMaterials.length,
      missingMaterials,
      totalRequired: transferMaterial.materials.filter((m) => m.required).length,
      notified: missingMaterials.length > 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
