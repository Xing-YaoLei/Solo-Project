import { Schema, model, Document, Types } from "mongoose";

export type PreparationStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface IPreparationItem {
  name: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedCost: number;
  actualCost?: number;
  status: "pending" | "in_progress" | "completed";
  notes?: string;
  completedDate?: Date;
}

export interface IPreparationList {
  vehicleId: Types.ObjectId;
  preparedBy: Types.ObjectId;
  status: PreparationStatus;
  items: IPreparationItem[];
  totalEstimatedCost: number;
  totalActualCost?: number;
  startDate?: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreparationListDocument extends IPreparationList, Document {}

const preparationItemSchema = new Schema<IPreparationItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
    },
    estimatedCost: { type: Number, required: true, min: 0 },
    actualCost: { type: Number, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    notes: { type: String, trim: true },
    completedDate: { type: Date },
  },
  { _id: false }
);

const preparationListSchema = new Schema<PreparationListDocument>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    preparedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    items: [preparationItemSchema],
    totalEstimatedCost: { type: Number, required: true, default: 0, min: 0 },
    totalActualCost: { type: Number, min: 0 },
    startDate: { type: Date },
    completedDate: { type: Date },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

preparationListSchema.index({ vehicleId: 1, createdAt: -1 });

preparationListSchema.pre("save", function (next) {
  this.totalEstimatedCost = this.items.reduce((sum, item) => {
    return sum + item.estimatedCost;
  }, 0);

  const completedItems = this.items.filter((item) => item.status === "completed");
  this.totalActualCost = completedItems.reduce((sum, item) => {
    return sum + (item.actualCost || 0);
  }, 0);

  if (this.items.length > 0 && this.items.every((item) => item.status === "completed")) {
    this.status = "completed";
    if (!this.completedDate) {
      this.completedDate = new Date();
    }
  }

  next();
});

export const PreparationList = model<PreparationListDocument>(
  "PreparationList",
  preparationListSchema
);
