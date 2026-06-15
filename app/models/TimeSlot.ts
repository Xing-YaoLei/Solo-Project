import mongoose, { Schema, model, type Document, type Types } from "mongoose";

export interface ITimeSlot extends Document {
  date: string;
  startTime: string;
  endTime: string;
  courseType: string;
  teacher: string;
  classroom: string;
  capacityRuleId: Types.ObjectId;
  currentBookings: number;
  status: "available" | "full" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    courseType: { type: String, required: true, trim: true },
    teacher: { type: String, required: true, trim: true },
    classroom: { type: String, required: true, trim: true },
    capacityRuleId: { type: Schema.Types.ObjectId, ref: "CapacityRule", required: true },
    currentBookings: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["available", "full", "cancelled"],
      default: "available",
    },
  },
  { timestamps: true }
);

TimeSlotSchema.index({ date: 1, startTime: 1 });
TimeSlotSchema.index({ courseType: 1 });
TimeSlotSchema.index({ teacher: 1, date: 1 });

export const TimeSlot = mongoose.models.TimeSlot || model<ITimeSlot>("TimeSlot", TimeSlotSchema);
