import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    vin: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    plateNumber: String,
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: Number,
    mileage: Number,
    color: String,
    displacement: String,
    transmission: {
      type: String,
      enum: ["manual", "automatic", "cvt", "dual-clutch", "electric"],
    },
    fuelType: {
      type: String,
      enum: ["gasoline", "diesel", "hybrid", "electric", "pnev"],
    },
    purchasePrice: Number,
    sellingPrice: Number,
    status: {
      type: String,
      enum: ["in-stock", "preparing", "test-driving", "negotiating", "transferring", "sold", "transferred"],
      default: "in-stock",
      index: true,
    },
    inStockDate: Date,
    soldDate: Date,
    transferredDate: Date,
    handlerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remark: String,
    images: [String],
  },
  {
    timestamps: true,
  }
);

carSchema.index({ status: 1, inStockDate: -1 });

export default mongoose.model("Car", carSchema);
