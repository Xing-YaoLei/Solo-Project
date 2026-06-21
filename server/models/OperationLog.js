import mongoose from "mongoose";

const operationLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: [
        "transfer-material",
        "finance-data",
        "preparation",
        "test-drive",
        "quote",
        "car",
        "notification",
        "export",
        "system",
        "other",
      ],
      required: true,
      index: true,
    },
    targetType: String,
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetType",
    },
    targetName: String,
    reason: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedFields: [String],
    status: {
      type: String,
      enum: ["open", "closed", "failed"],
      default: "open",
      index: true,
    },
    closedAt: Date,
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closeRemark: String,
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    operatorName: String,
    operatorRole: String,
    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

operationLogSchema.index({ module: 1, createdAt: -1 });
operationLogSchema.index({ operatorId: 1, createdAt: -1 });
operationLogSchema.index({ status: 1, createdAt: -1 });
operationLogSchema.index({ targetId: 1, createdAt: -1 });

export default mongoose.model("OperationLog", operationLogSchema);
