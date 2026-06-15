import mongoose, { Schema, model, type Document, type Types } from "mongoose";

export interface IConflictRecord extends Document {
  type: "time_overlap" | "teacher_conflict" | "classroom_conflict" | "overcapacity";
  timeSlotId: Types.ObjectId;
  affectedAppointmentIds: Types.ObjectId[];
  affectedTimeSlotIds: Types.ObjectId[];
  description: string;
  status: "detected" | "forwarded" | "supplemented" | "resolved";
  assignedTo?: string;
  assignedRole: "admin" | "coordinator" | "teacher";
  supplementNote?: string;
  supplementedBy?: string;
  supplementedAt?: Date;
  forwardedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConflictRecordSchema = new Schema<IConflictRecord>(
  {
    type: {
      type: String,
      enum: ["time_overlap", "teacher_conflict", "classroom_conflict", "overcapacity"],
      required: true,
    },
    timeSlotId: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    affectedAppointmentIds: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    affectedTimeSlotIds: [{ type: Schema.Types.ObjectId, ref: "TimeSlot" }],
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["detected", "forwarded", "supplemented", "resolved"],
      default: "detected",
    },
    assignedTo: { type: String, trim: true },
    assignedRole: {
      type: String,
      enum: ["admin", "coordinator", "teacher"],
      default: "coordinator",
    },
    supplementNote: { type: String, trim: true },
    supplementedBy: { type: String, trim: true },
    supplementedAt: { type: Date },
    forwardedAt: { type: Date },
    resolvedBy: { type: String, trim: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

ConflictRecordSchema.index({ status: 1 });
ConflictRecordSchema.index({ assignedRole: 1, status: 1 });

export const ConflictRecord = mongoose.models.ConflictRecord || model<IConflictRecord>("ConflictRecord", ConflictRecordSchema);
