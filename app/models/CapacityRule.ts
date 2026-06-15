import { Schema, model, type Document } from "mongoose";

export interface ICapacityRule extends Document {
  name: string;
  courseType: string;
  maxCapacity: number;
  overbookLimit: number;
  reminderThreshold: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CapacityRuleSchema = new Schema<ICapacityRule>(
  {
    name: { type: String, required: true, trim: true },
    courseType: { type: String, required: true, trim: true, unique: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    overbookLimit: { type: Number, default: 0, min: 0 },
    reminderThreshold: { type: Number, default: 80, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

CapacityRuleSchema.index({ courseType: 1 });

export const CapacityRule = model<ICapacityRule>("CapacityRule", CapacityRuleSchema);
