import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "material-missing",
        "material-urgent",
        "finance-change",
        "transfer-status",
        "system-alert",
        "task-assign",
        "other",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    recipientIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    relatedType: String,
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedType",
    },
    status: {
      type: String,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
      index: true,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedRemark: String,
    pushChannels: [
      {
        type: String,
        enum: ["in-app", "sms", "email", "wechat"],
      },
    ],
    pushedChannels: [
      {
        channel: String,
        pushedAt: Date,
        result: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientIds: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
