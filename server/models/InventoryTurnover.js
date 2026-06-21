import mongoose from "mongoose";

const inventoryTurnoverSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      unique: true,
    },
    vin: String,
    brand: String,
    model: String,
    year: Number,
    inStockDate: {
      type: Date,
      required: true,
      index: true,
    },
    soldDate: Date,
    transferredDate: Date,
    daysInStock: Number,
    daysToSell: Number,
    daysToTransfer: Number,
    purchasePrice: Number,
    sellingPrice: Number,
    profit: Number,
    profitMargin: Number,
    preparationCost: Number,
    totalCost: Number,
    month: {
      type: String,
      index: true,
    },
    quarter: {
      type: String,
      index: true,
    },
    year: {
      type: Number,
      index: true,
    },
    status: {
      type: String,
      enum: ["in-stock", "sold", "transferred"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryTurnoverSchema.index({ month: 1, status: 1 });
inventoryTurnoverSchema.index({ year: 1, quarter: 1 });

export default mongoose.model("InventoryTurnover", inventoryTurnoverSchema);
