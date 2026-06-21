import mongoose from "mongoose";

const financeChangeLogSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  changeReason: String,
});

const financeDataSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      unique: true,
      index: true,
    },
    purchasePrice: Number,
    purchaseDate: Date,
    purchaseChannel: String,
    sellerName: String,
    sellerIdCard: String,
    sellerPhone: String,
    
    preparationCost: Number,
    otherCosts: [
      {
        name: String,
        amount: Number,
        remark: String,
      },
    ],
    totalCost: Number,
    
    loanInfo: {
      hasLoan: {
        type: Boolean,
        default: false,
      },
      bankName: String,
      loanAmount: Number,
      downPayment: Number,
      loanTerm: Number,
      interestRate: Number,
      monthlyPayment: Number,
      loanStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "disbursed", "settled"],
      },
    },
    
    insuranceInfo: {
      hasInsurance: Boolean,
      insuranceCompany: String,
      policyNumber: String,
      coverage: String,
      premium: Number,
      startDate: Date,
      endDate: Date,
    },
    
    buyerName: String,
    buyerIdCard: String,
    buyerPhone: String,
    buyerAddress: String,
    
    sellingPrice: Number,
    dealDate: Date,
    paymentMethod: String,
    actualReceived: Number,
    receiptDate: Date,
    
    profit: Number,
    profitMargin: Number,
    
    settlementStatus: {
      type: String,
      enum: ["pending", "in-progress", "completed", "on-hold"],
      default: "pending",
      index: true,
    },
    
    remark: String,
    
    changeLogs: [financeChangeLogSchema],
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

financeDataSchema.index({ carId: 1, updatedAt: -1 });
financeDataSchema.index({ settlementStatus: 1 });

export default mongoose.model("FinanceData", financeDataSchema);
