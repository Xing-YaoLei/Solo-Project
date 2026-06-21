import mongoose from "mongoose";

const testDriveRecordSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: String,
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    startMileage: Number,
    endMileage: Number,
    route: String,
    carConditionBefore: String,
    carConditionAfter: String,
    customerFeedback: String,
    interestLevel: {
      type: String,
      enum: ["low", "medium", "high", "very-high"],
    },
    followUpNeeded: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    remark: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

testDriveRecordSchema.index({ carId: 1, createdAt: -1 });
testDriveRecordSchema.index({ driverId: 1, createdAt: -1 });

export default mongoose.model("TestDriveRecord", testDriveRecordSchema);
