import { Schema, model, type Document, type Types } from "mongoose";

export interface ITimelineEvent extends Document {
  appointmentId: Types.ObjectId;
  eventType: "created" | "status_changed" | "remark_added" | "attachment_added" | "conflict_detected" | "conflict_resolved" | "handler_changed";
  handler: string;
  handlerRole: "admin" | "coordinator" | "teacher" | "system";
  content?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    eventType: {
      type: String,
      enum: ["created", "status_changed", "remark_added", "attachment_added", "conflict_detected", "conflict_resolved", "handler_changed"],
      required: true,
    },
    handler: { type: String, required: true, trim: true },
    handlerRole: {
      type: String,
      enum: ["admin", "coordinator", "teacher", "system"],
      default: "system",
    },
    content: { type: String, trim: true },
    attachmentUrl: { type: String, trim: true },
    attachmentName: { type: String, trim: true },
    previousValue: { type: String, trim: true },
    newValue: { type: String, trim: true },
  },
  { timestamps: true }
);

TimelineEventSchema.index({ appointmentId: 1, createdAt: -1 });

export const TimelineEvent = model<ITimelineEvent>("TimelineEvent", TimelineEventSchema);
