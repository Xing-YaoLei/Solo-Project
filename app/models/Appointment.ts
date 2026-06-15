import mongoose, { Schema, model, type Document, type Types } from "mongoose";

export interface IAppointment extends Document {
  studentName: string;
  studentAge: number;
  guardianName: string;
  guardianPhone: string;
  courseType: string;
  timeSlotId: Types.ObjectId;
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show";
  source: "online" | "walk_in" | "referral";
  remark?: string;
  conflictId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    studentName: { type: String, required: true, trim: true },
    studentAge: { type: Number, required: true, min: 3, max: 18 },
    guardianName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, required: true, trim: true },
    courseType: { type: String, required: true, trim: true },
    timeSlotId: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"],
      default: "pending",
    },
    source: {
      type: String,
      enum: ["online", "walk_in", "referral"],
      default: "online",
    },
    remark: { type: String, trim: true },
    conflictId: { type: Schema.Types.ObjectId, ref: "ConflictRecord" },
  },
  { timestamps: true }
);

AppointmentSchema.index({ timeSlotId: 1, status: 1 });
AppointmentSchema.index({ guardianPhone: 1 });
AppointmentSchema.index({ status: 1 });

export const Appointment = mongoose.models.Appointment || model<IAppointment>("Appointment", AppointmentSchema);
