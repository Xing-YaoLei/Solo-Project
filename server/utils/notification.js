import { Notification } from "../models/index.js";
import { getRedisClient } from "../redis.js";

export const createNotification = async (params) => {
  const {
    type,
    title,
    content,
    priority = "medium",
    recipientIds = [],
    relatedType = null,
    relatedId = null,
    pushChannels = ["in-app"],
    createdBy = null,
  } = params;

  const notification = new Notification({
    type,
    title,
    content,
    priority,
    recipientIds,
    relatedType,
    relatedId,
    pushChannels,
    status: "active",
    createdBy,
  });

  await notification.save();

  const redisClient = getRedisClient();
  if (redisClient) {
    for (const recipientId of recipientIds) {
      const channel = `notifications:${recipientId}`;
      await redisClient.publish(channel, JSON.stringify(notification));
    }
  }

  return notification;
};

export const notifyMaterialMissing = async (
  carId,
  missingMaterials,
  carInfo,
  recipientIds
) => {
  const title = `过户资料缺失提醒 - ${carInfo?.brand} ${carInfo?.model}`;
  const content = `车辆 ${carInfo?.plateNumber || carInfo?.vin} 缺少以下过户资料：${missingMaterials.join("、")}，请尽快补交。`;

  return await createNotification({
    type: "material-missing",
    title,
    content,
    priority: "high",
    recipientIds,
    relatedType: "Car",
    relatedId: carId,
    pushChannels: ["in-app", "sms"],
  });
};

export const markNotificationRead = async (notificationId, userId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    {
      $addToSet: {
        readBy: {
          userId,
          readAt: new Date(),
        },
      },
    },
    { new: true }
  );
};

export const getUserNotifications = async (
  userId,
  status = "active",
  page = 1,
  pageSize = 20
) => {
  const skip = (page - 1) * pageSize;
  const query = {
    recipientIds: userId,
  };
  if (status !== "all") {
    query.status = status;
  }

  const [list, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1, priority: -1 })
      .skip(skip)
      .limit(pageSize),
    Notification.countDocuments(query),
    Notification.countDocuments({
      recipientIds: userId,
      status: "active",
      "readBy.userId": { $ne: userId },
    }),
  ]);

  return { list, total, unreadCount, page, pageSize };
};

export const resolveNotification = async (notificationId, userId, remark = null) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    {
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolvedRemark: remark,
    },
    { new: true }
  );
};
