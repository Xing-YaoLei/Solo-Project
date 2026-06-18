import { Schema, model, Document, Types } from "mongoose";

export type InspectionStatus = "pending" | "in_progress" | "completed" | "rejected";

export interface IInspectionItem {
  category: string;
  name: string;
  condition: "excellent" | "good" | "fair" | "poor";
  description?: string;
  estimatedCost?: number;
}

export interface IInspectionReport {
  vehicleId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  status: InspectionStatus;
  overallGrade: "A" | "B" | "C" | "D";
  exteriorItems: IInspectionItem[];
  interiorItems: IInspectionItem[];
  mechanicalItems: IInspectionItem[];
  electricalItems: IInspectionItem[];
  accidentHistory: {
    hasAccident: boolean;
    description?: string;
    accidentDate?: Date;
  };
  testResult: {
    brakeTest: boolean;
    emissionTest: boolean;
    suspensionTest: boolean;
  };
  photos?: string[];
  notes?: string;
  totalEstimatedCost: number;
  inspectionDate: Date;
  nextInspectionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionReportDocument extends IInspectionReport, Document {}

const inspectionItemSchema = new Schema<IInspectionItem>(
  {
    category: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    condition: {
      type: String,
      required: true,
      enum: ["excellent", "good", "fair", "poor"],
    },
    description: { type: String, trim: true },
    estimatedCost: { type: Number, min: 0 },
  },
  { _id: false }
);

const inspectionReportSchema = new Schema<InspectionReportDocument>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    inspectorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    overallGrade: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
    },
    exteriorItems: [inspectionItemSchema],
    interiorItems: [inspectionItemSchema],
    mechanicalItems: [inspectionItemSchema],
    electricalItems: [inspectionItemSchema],
    accidentHistory: {
      hasAccident: { type: Boolean, required: true, default: false },
      description: { type: String, trim: true },
      accidentDate: { type: Date },
    },
    testResult: {
      brakeTest: { type: Boolean, required: true, default: false },
      emissionTest: { type: Boolean, required: true, default: false },
      suspensionTest: { type: Boolean, required: true, default: false },
    },
    photos: [{ type: String }],
    notes: { type: String, trim: true },
    totalEstimatedCost: { type: Number, required: true, default: 0, min: 0 },
    inspectionDate: { type: Date, required: true },
    nextInspectionDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

inspectionReportSchema.index({ vehicleId: 1, createdAt: -1 });

inspectionReportSchema.pre("save", function (next) {
  const allItems = [
    ...this.exteriorItems,
    ...this.interiorItems,
    ...this.mechanicalItems,
    ...this.electricalItems,
  ];

  this.totalEstimatedCost = allItems.reduce((sum, item) => {
    return sum + (item.estimatedCost || 0);
  }, 0);

  next();
});

export const InspectionReport = model<InspectionReportDocument>(
  "InspectionReport",
  inspectionReportSchema
);
