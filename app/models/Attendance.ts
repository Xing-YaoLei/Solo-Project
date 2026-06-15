import mongoose, { Schema, model, type Document, type Types } from "mongoose";

export interface IAttendance extends Document {
  appointmentId: Types.ObjectId;
  timeSlotId: Types.ObjectId;
  status: "present" | "absent" | "late" | "excused";
  checkedInAt?: Date;
  checkedInBy: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    timeSlotId: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    checkedInAt: { type: Date },
    checkedInBy: { type: String, required: true, trim: true },
    remark: { type: String, trim: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ appointmentId: 1 });
AttendanceSchema.index({ timeSlotId: 1, status: 1 });

export const Attendance = mongoose.models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
