import { OperationLog } from "../models/index.js";

export const createOperationLog = async (params) => {
  const {
    action,
    module,
    targetType = null,
    targetId = null,
    targetName = null,
    reason = null,
    oldValue = null,
    newValue = null,
    changedFields = [],
    operatorId,
    operatorName = null,
    operatorRole = null,
    ip = null,
    userAgent = null,
  } = params;

  const log = new OperationLog({
    action,
    module,
    targetType,
    targetId,
    targetName,
    reason,
    oldValue,
    newValue,
    changedFields,
    status: "open",
    operatorId,
    operatorName,
    operatorRole,
    ip,
    userAgent,
  });

  await log.save();
  return log;
};

export const closeOperationLog = async (logId, closeBy, closeRemark = null) => {
  return await OperationLog.findByIdAndUpdate(
    logId,
    {
      status: "closed",
      closedAt: new Date(),
      closedBy: closeBy,
      closeRemark,
    },
    { new: true }
  );
};

export const listOperationLogs = async (query = {}, page = 1, pageSize = 20) => {
  const skip = (page - 1) * pageSize;
  const [list, total] = await Promise.all([
    OperationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("operatorId", "name role")
      .populate("closedBy", "name"),
    OperationLog.countDocuments(query),
  ]);
  return { list, total, page, pageSize };
};
