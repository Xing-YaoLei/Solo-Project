import { Schema, model, Document, Types } from "mongoose";

export type AcquisitionStage =
  | "archive"
  | "inspection"
  | "preparation"
  | "testdrive"
  | "quoting"
  | "completed"
  | "cancelled";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";

export type Transmission = "manual" | "automatic" | "cvt";

export interface IVehicleBasic {
  plateNumber: string;
  vin: string;
  brand: string;
  vehicleModel: string;
  year: number;
  color: string;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  displacement?: string;
  registerDate?: Date;
  firstOwnerName?: string;
  firstOwnerPhone?: string;
}

export interface IDocumentCheck {
  registration: boolean;
  drivingLicense: boolean;
  insurance: boolean;
  maintenanceRecord: boolean;
  accidentRecord: boolean;
  emissionTest: boolean;
}

export interface IVehicle extends IVehicleBasic {
  stage: AcquisitionStage;
  riskLevel: RiskLevel;
  documentCheck: IDocumentCheck;
  missingDocuments: string[];
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  purchasePrice?: number;
  expectedPrice?: number;
  soldPrice?: number;
  stockInDate?: Date;
  soldDate?: Date;
  daysInStock: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleDocument extends IVehicle, Document {
  calculateRiskLevel(): RiskLevel;
  updateMissingDocuments(): string[];
  getStagePriority(): number;
}

const documentCheckSchema = new Schema<IDocumentCheck>(
  {
    registration: { type: Boolean, default: false },
    drivingLicense: { type: Boolean, default: false },
    insurance: { type: Boolean, default: false },
    maintenanceRecord: { type: Boolean, default: false },
    accidentRecord: { type: Boolean, default: false },
    emissionTest: { type: Boolean, default: false },
  },
  { _id: false }
);

const vehicleSchema = new Schema<VehicleDocument>(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 17,
      minlength: 17,
    },
    brand: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1990, max: new Date().getFullYear() },
    color: { type: String, required: true, trim: true },
    mileage: { type: Number, required: true, min: 0 },
    fuelType: {
      type: String,
      required: true,
      enum: ["gasoline", "diesel", "hybrid", "electric"],
    },
    transmission: {
      type: String,
      required: true,
      enum: ["manual", "automatic", "cvt"],
    },
    displacement: { type: String, trim: true },
    registerDate: { type: Date },
    firstOwnerName: { type: String, trim: true },
    firstOwnerPhone: { type: String, trim: true },

    stage: {
      type: String,
      required: true,
      enum: ["archive", "inspection", "preparation", "testdrive", "quoting", "completed", "cancelled"],
      default: "archive",
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    documentCheck: {
      type: documentCheckSchema,
      default: () => ({}),
    },
    missingDocuments: [{ type: String }],

    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    purchasePrice: { type: Number, min: 0 },
    expectedPrice: { type: Number, min: 0 },
    soldPrice: { type: Number, min: 0 },
    stockInDate: { type: Date },
    soldDate: { type: Date },
    daysInStock: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

vehicleSchema.index({ stage: 1, riskLevel: 1, assignedTo: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ plateNumber: "text", vin: "text", brand: "text", vehicleModel: "text" });

vehicleSchema.virtual("inspectionReport", {
  ref: "InspectionReport",
  localField: "_id",
  foreignField: "vehicleId",
  justOne: true,
});

vehicleSchema.virtual("preparationList", {
  ref: "PreparationList",
  localField: "_id",
  foreignField: "vehicleId",
  justOne: true,
});

vehicleSchema.virtual("testDriveRecords", {
  ref: "TestDriveRecord",
  localField: "_id",
  foreignField: "vehicleId",
});

vehicleSchema.virtual("priceQuotes", {
  ref: "PriceQuote",
  localField: "_id",
  foreignField: "vehicleId",
});

vehicleSchema.virtual("communications", {
  ref: "Communication",
  localField: "_id",
  foreignField: "vehicleId",
});

vehicleSchema.methods.updateMissingDocuments = function (): string[] {
  const docNames: Record<keyof IDocumentCheck, string> = {
    registration: "机动车登记证书",
    drivingLicense: "行驶证",
    insurance: "保险单",
    maintenanceRecord: "保养记录",
    accidentRecord: "事故记录",
    emissionTest: "排放标准检测",
  };

  const missing: string[] = [];
  (Object.keys(this.documentCheck) as Array<keyof IDocumentCheck>).forEach((key) => {
    if (!this.documentCheck[key]) {
      missing.push(docNames[key]);
    }
  });

  this.missingDocuments = missing;
  return missing;
};

vehicleSchema.methods.calculateRiskLevel = function (): RiskLevel {
  const missingCount = this.missingDocuments.length;
  const currentStage = this.stage;

  if (missingCount >= 4) return "critical";
  if (missingCount >= 2) return "high";
  if (missingCount >= 1) return "medium";

  if (currentStage === "archive" || currentStage === "inspection") {
    return "low";
  }

  return "low";
};

vehicleSchema.methods.getStagePriority = function (): number {
  const priorities: Record<AcquisitionStage, number> = {
    archive: 1,
    inspection: 2,
    preparation: 3,
    testdrive: 4,
    quoting: 5,
    completed: 7,
    cancelled: 6,
  };
  return priorities[this.stage as keyof typeof priorities];
};

vehicleSchema.pre("save", function (next) {
  this.updateMissingDocuments();
  this.riskLevel = this.calculateRiskLevel();

  if (this.stockInDate && !this.soldDate) {
    const now = new Date();
    const diff = now.getTime() - this.stockInDate.getTime();
    this.daysInStock = Math.floor(diff / (1000 * 60 * 60 * 24));
  } else if (this.soldDate && this.stockInDate) {
    const diff = this.soldDate.getTime() - this.stockInDate.getTime();
    this.daysInStock = Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  next();
});

export const Vehicle = model<VehicleDocument>("Vehicle", vehicleSchema);
