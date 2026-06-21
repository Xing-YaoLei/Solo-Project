import {
  getUserNotifications,
  markNotificationRead,
  resolveNotification as resolve,
  createNotification as create,
} from "../utils/notification.js";
import { Notification } from "../models/index.js";
import { createOperationLog } from "../utils/operationLog.js";

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

export const listNotifications = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status = "active" } = req.query;
    const userId = req.query.userId || MOCK_USER_ID;

    const result = await getUserNotifications(
      userId,
      status,
      Number(page),
      Number(pageSize)
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "通知不存在" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const notification = await create({
      ...req.body,
      createdBy: MOCK_USER_ID,
    });

    await createOperationLog({
      action: "create",
      module: "notification",
      targetType: "Notification",
      targetId: notification._id,
      targetName: notification.title,
      newValue: notification.toObject(),
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.body.userId || MOCK_USER_ID;
    const notification = await markNotificationRead(req.params.id, userId);
    if (!notification) {
      return res.status(404).json({ error: "通知不存在" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveNotification = async (req, res) => {
  try {
    const userId = req.body.userId || MOCK_USER_ID;
    const remark = req.body.remark || null;

    const notification = await resolve(req.params.id, userId, remark);
    if (!notification) {
      return res.status(404).json({ error: "通知不存在" });
    }

    await createOperationLog({
      action: "resolve",
      module: "notification",
      targetType: "Notification",
      targetId: notification._id,
      targetName: notification.title,
      reason: remark,
      operatorId: userId,
      operatorName: MOCK_USER_NAME,
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
