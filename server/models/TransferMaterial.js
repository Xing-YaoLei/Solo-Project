import mongoose from "mongoose";

const transferMaterialItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "vehicle-docs",
      "owner-docs",
      "buyer-docs",
      "transaction-docs",
      "insurance-docs",
      "other",
    ],
  },
  required: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["missing", "submitted", "verified", "rejected", "waived"],
    default: "missing",
    index: true,
  },
  submittedDate: Date,
  verifiedDate: Date,
  rejectedDate: Date,
  rejectedReason: String,
  waivedReason: String,
  fileUrls: [String],
  remark: String,
  handlerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const transferMaterialSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      unique: true,
      index: true,
    },
    materials: [transferMaterialItemSchema],
    overallStatus: {
      type: String,
      enum: ["incomplete", "submitting", "reviewing", "approved", "rejected"],
      default: "incomplete",
      index: true,
    },
    missingMaterials: [String],
    firstSubmittedDate: Date,
    lastSubmittedDate: Date,
    approvedDate: Date,
    rejectedDate: Date,
    rejectedReason: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remark: String,
  },
  {
    timestamps: true,
  }
);

transferMaterialSchema.index({ carId: 1, updatedAt: -1 });
transferMaterialSchema.index({ overallStatus: 1, createdAt: -1 });

export default mongoose.model("TransferMaterial", transferMaterialSchema);
