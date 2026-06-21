import mongoose from "mongoose";

const quoteHistorySchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    customerName: String,
    customerPhone: String,
    quotePrice: {
      type: Number,
      required: true,
    },
    originalPrice: Number,
    discountAmount: Number,
    discountReason: String,
    quoteStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "counter-offered", "expired"],
      default: "pending",
    },
    validUntil: Date,
    negotiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentMethod: {
      type: String,
      enum: ["full", "installment", "loan", "trade-in"],
    },
    tradeInCarInfo: {
      brand: String,
      model: String,
      year: Number,
      vin: String,
      estimatedPrice: Number,
    },
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

quoteHistorySchema.index({ carId: 1, createdAt: -1 });
quoteHistorySchema.index({ quoteStatus: 1, createdAt: -1 });

export default mongoose.model("QuoteHistory", quoteHistorySchema);
