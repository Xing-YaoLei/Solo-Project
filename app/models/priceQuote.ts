import { Schema, model, Document, Types } from "mongoose";

export type QuoteStatus = "proposed" | "negotiating" | "accepted" | "rejected" | "expired";

export interface IPriceQuote {
  vehicleId: Types.ObjectId;
  offeredById: Types.ObjectId;
  offeredToName?: string;
  offeredToPhone?: string;
  price: number;
  previousPrice?: number;
  status: QuoteStatus;
  validUntil?: Date;
  negotiationHistory?: {
    price: number;
    date: Date;
    note?: string;
  }[];
  conditions?: string;
  rejectionReason?: string;
  acceptanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceQuoteDocument extends IPriceQuote, Document {}

const negotiationHistorySchema = new Schema(
  {
    price: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const priceQuoteSchema = new Schema<PriceQuoteDocument>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    offeredById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offeredToName: { type: String, trim: true },
    offeredToPhone: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    previousPrice: { type: Number, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ["proposed", "negotiating", "accepted", "rejected", "expired"],
      default: "proposed",
    },
    validUntil: { type: Date },
    negotiationHistory: [negotiationHistorySchema],
    conditions: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    acceptanceDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

priceQuoteSchema.index({ vehicleId: 1, createdAt: -1 });
priceQuoteSchema.index({ status: 1, createdAt: -1 });

priceQuoteSchema.pre("save", function (next) {
  if (this.status === "accepted" && !this.acceptanceDate) {
    this.acceptanceDate = new Date();
  }

  if (
    this.validUntil &&
    this.status === "proposed" &&
    new Date() > this.validUntil
  ) {
    this.status = "expired";
  }

  if (this.isModified("price") && this.previousPrice === undefined) {
    const original = (this as any).$original() as PriceQuoteDocument | undefined;
    if (original && original.price) {
      this.previousPrice = original.price;
      if (!this.negotiationHistory) {
        this.negotiationHistory = [];
      }
      this.negotiationHistory.push({
        price: this.price,
        date: new Date(),
      });
    }
  }

  next();
});

export const PriceQuote = model<PriceQuoteDocument>("PriceQuote", priceQuoteSchema);
