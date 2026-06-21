import mongoose from "mongoose";

const exportRecordSchema = new mongoose.Schema(
  {
    exportType: {
      type: String,
      enum: [
        "inventory-turnover",
        "transfer-materials",
        "finance-data",
        "test-drives",
        "quotes",
        "operation-logs",
        "custom",
      ],
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: String,
    fileFormat: {
      type: String,
      enum: ["xlsx", "csv", "pdf"],
      default: "xlsx",
    },
    filterParams: mongoose.Schema.Types.Mixed,
    filterDisplay: String,
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    generatedByName: String,
    recordCount: Number,
    fileSize: Number,
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

exportRecordSchema.index({ exportType: 1, createdAt: -1 });
exportRecordSchema.index({ generatedBy: 1, createdAt: -1 });

export default mongoose.model("ExportRecord", exportRecordSchema);
