import { Schema, model, Document, Types } from "mongoose";

export interface ITestDriveRecord {
  vehicleId: Types.ObjectId;
  driverId: Types.ObjectId;
  clientName?: string;
  clientPhone?: string;
  date: Date;
  startTime: string;
  endTime: string;
  startMileage: number;
  endMileage: number;
  route: string;
  feedback: {
    engine: number;
    transmission: number;
    suspension: number;
    brake: number;
    steering: number;
    noise: number;
  };
  overallRating: number;
  issuesFound?: string;
  clientInterest: "high" | "medium" | "low" | "none";
  clientNotes?: string;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestDriveRecordDocument extends ITestDriveRecord, Document {}

const feedbackSchema = new Schema(
  {
    engine: { type: Number, required: true, min: 1, max: 5 },
    transmission: { type: Number, required: true, min: 1, max: 5 },
    suspension: { type: Number, required: true, min: 1, max: 5 },
    brake: { type: Number, required: true, min: 1, max: 5 },
    steering: { type: Number, required: true, min: 1, max: 5 },
    noise: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const testDriveRecordSchema = new Schema<TestDriveRecordDocument>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: { type: String, trim: true },
    clientPhone: { type: String, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startMileage: { type: Number, required: true, min: 0 },
    endMileage: { type: Number, required: true, min: 0 },
    route: { type: String, required: true, trim: true },
    feedback: {
      type: feedbackSchema,
      required: true,
    },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    issuesFound: { type: String, trim: true },
    clientInterest: {
      type: String,
      required: true,
      enum: ["high", "medium", "low", "none"],
    },
    clientNotes: { type: String, trim: true },
    photos: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

testDriveRecordSchema.index({ vehicleId: 1, date: -1 });
testDriveRecordSchema.index({ driverId: 1, date: -1 });

testDriveRecordSchema.pre("save", function (next) {
  if (this.endMileage < this.startMileage) {
    next(new Error("结束里程不能小于开始里程"));
    return;
  }
  next();
});

export const TestDriveRecord = model<TestDriveRecordDocument>(
  "TestDriveRecord",
  testDriveRecordSchema
);
