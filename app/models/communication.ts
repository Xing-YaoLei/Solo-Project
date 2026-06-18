import { Schema, model, Document, Types } from "mongoose";

export type CommunicationType = "phone" | "email" | "chat" | "meeting" | "other";
export type CommunicationCategory = "info_request" | "price_negotiation" | "document_missing" | "review" | "general";

export interface ICommunication {
  vehicleId: Types.ObjectId;
  createdById: Types.ObjectId;
  type: CommunicationType;
  category: CommunicationCategory;
  participantName: string;
  participantPhone?: string;
  participantEmail?: string;
  content: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  reviewedById?: Types.ObjectId;
  reviewNotes?: string;
  reviewedAt?: Date;
  files?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationDocument extends ICommunication, Document {}

const communicationSchema = new Schema<CommunicationDocument>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["phone", "email", "chat", "meeting", "other"],
    },
    category: {
      type: String,
      required: true,
      enum: ["info_request", "price_negotiation", "document_missing", "review", "general"],
    },
    participantName: { type: String, required: true, trim: true },
    participantPhone: { type: String, trim: true },
    participantEmail: { type: String, trim: true, lowercase: true },
    content: { type: String, required: true, trim: true },
    followUpRequired: { type: Boolean, required: true, default: false },
    followUpDate: { type: Date },
    isCompleted: { type: Boolean, required: true, default: true },
    completedAt: { type: Date },
    reviewedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: { type: String, trim: true },
    reviewedAt: { type: Date },
    files: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

communicationSchema.index({ vehicleId: 1, createdAt: -1 });
communicationSchema.index({ createdById: 1, createdAt: -1 });
communicationSchema.index({ category: 1, createdAt: -1 });
communicationSchema.index({ followUpRequired: 1, followUpDate: 1 });

communicationSchema.pre("save", function (next) {
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (!this.isCompleted && this.completedAt) {
    this.completedAt = undefined;
  }
  next();
});

export const Communication = model<CommunicationDocument>(
  "Communication",
  communicationSchema
);
