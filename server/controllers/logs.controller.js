import { listOperationLogs, closeOperationLog } from "../utils/operationLog.js";
import { OperationLog } from "../models/index.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

export const listLogs = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      module,
      action,
      status,
      targetId,
      operatorId,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (status) query.status = status;
    if (targetId) query.targetId = targetId;
    if (operatorId) query.operatorId = operatorId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const result = await listOperationLogs(query, Number(page), Number(pageSize));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLog = async (req, res) => {
  try {
    const log = await OperationLog.findById(req.params.id)
      .populate("operatorId", "name role")
      .populate("closedBy", "name");

    if (!log) {
      return res.status(404).json({ error: "日志不存在" });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const closeLog = async (req, res) => {
  try {
    const { remark } = req.body;
    const log = await closeOperationLog(req.params.id, MOCK_USER_ID, remark);

    if (!log) {
      return res.status(404).json({ error: "日志不存在" });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
