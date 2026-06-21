import mongoose from "mongoose";

const preparationItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["appearance", "interior", "mechanical", "documents", "other"],
  },
  description: String,
  cost: Number,
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  completedDate: Date,
  handlerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const preparationListSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    items: [preparationItemSchema],
    totalCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedDate: Date,
    remark: String,
  },
  {
    timestamps: true,
  }
);

preparationListSchema.index({ carId: 1, createdAt: -1 });

export default mongoose.model("PreparationList", preparationListSchema);
