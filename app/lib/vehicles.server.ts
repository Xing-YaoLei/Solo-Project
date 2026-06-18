import { Vehicle, VehicleDocument, AcquisitionStage, RiskLevel } from "~/models/vehicle";
import { InspectionReport } from "~/models/inspectionReport";
import { PreparationList } from "~/models/preparationList";
import { TestDriveRecord } from "~/models/testDriveRecord";
import { PriceQuote } from "~/models/priceQuote";
import { Communication } from "~/models/communication";
import { connectToMongo } from "~/lib/db";
import { UserDocument } from "~/models/user";
import { Types } from "mongoose";

const STAGE_PRIORITY: Record<AcquisitionStage, number> = {
  archive: 1,
  inspection: 2,
  preparation: 3,
  testdrive: 4,
  quoting: 5,
  completed: 7,
  cancelled: 6,
};

const RISK_PRIORITY: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function getStagePriority(stage: AcquisitionStage): number {
  return STAGE_PRIORITY[stage] ?? 99;
}

export function getRiskPriority(riskLevel: RiskLevel): number {
  return RISK_PRIORITY[riskLevel] ?? 99;
}

export interface VehicleListParams {
  stage?: string;
  riskLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
  user?: UserDocument;
}

export async function getVehicleList(params: VehicleListParams) {
  const connected = await connectToMongo();
  if (!connected) {
    return {
      vehicles: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    };
  }

  const filter: Record<string, any> = { isActive: true };
  const { stage, riskLevel, search, page = 1, limit = 20, user } = params;

  if (user?.role === "executive") {
    filter.assignedTo = user._id;
  }

  if (stage) filter.stage = stage;
  if (riskLevel) filter.riskLevel = riskLevel;

  if (search) {
    filter.$text = { $search: search };
  }

  const vehicles = await Vehicle.find(filter)
    .populate("assignedTo", "name role")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const sortedVehicles = vehicles.sort((a: any, b: any) => {
    const riskDiff = getRiskPriority(a.riskLevel as RiskLevel) - getRiskPriority(b.riskLevel as RiskLevel);
    if (riskDiff !== 0) return riskDiff;
    return getStagePriority(a.stage as AcquisitionStage) - getStagePriority(b.stage as AcquisitionStage);
  });

  const total = await Vehicle.countDocuments(filter);

  return {
    vehicles: sortedVehicles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getVehicleById(id: string, user?: UserDocument) {
  const connected = await connectToMongo();
  if (!connected) {
    return null;
  }

  const filter: Record<string, any> = { _id: new Types.ObjectId(id), isActive: true };
  if (user?.role === "executive") {
    filter.assignedTo = user._id;
  }

  const vehicle = await Vehicle.findOne(filter)
    .populate("assignedTo", "name role")
    .populate("createdBy", "name")
    .lean();

  if (!vehicle) return null;

  const [inspectionReport, preparationList, testDriveRecords, priceQuotes, communications] =
    await Promise.all([
      InspectionReport.findOne({ vehicleId: vehicle._id }).lean(),
      PreparationList.findOne({ vehicleId: vehicle._id }).lean(),
      TestDriveRecord.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 }).lean(),
      PriceQuote.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 }).lean(),
      Communication.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 }).lean(),
    ]);

  return {
    ...vehicle,
    inspectionReport,
    preparationList,
    testDriveRecords,
    priceQuotes,
    communications,
  };
}

export interface CreateVehicleData {
  plateNumber: string;
  vin: string;
  brand: string;
  vehicleModel: string;
  year: number;
  color: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  displacement?: string;
  registerDate?: string;
  firstOwnerName?: string;
  firstOwnerPhone?: string;
  documentCheck?: {
    registration?: boolean;
    drivingLicense?: boolean;
    insurance?: boolean;
    maintenanceRecord?: boolean;
    accidentRecord?: boolean;
    emissionTest?: boolean;
  };
  assignedTo?: string;
  notes?: string;
  createdBy?: string;
}

export async function createVehicle(data: CreateVehicleData, createdBy?: string) {
  const connected = await connectToMongo();
  if (!connected) {
    throw new Error("数据库连接失败");
  }

  const vehicle = new Vehicle({
    ...data,
    stage: "archive",
    createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : undefined,
    documentCheck: {
      registration: false,
      drivingLicense: false,
      insurance: false,
      maintenanceRecord: false,
      accidentRecord: false,
      emissionTest: false,
      ...data.documentCheck,
    },
  });

  await vehicle.save();

  return vehicle.toObject();
}

export async function getStatistics() {
  const connected = await connectToMongo();
  if (!connected) {
    return {
      stageStats: [],
      riskStats: [],
      stockTrend: [],
      soldStats: [],
      avgDaysInStock: 0,
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [stageStats, riskStats, stockTrend, soldStats, avgDaysResult] = await Promise.all([
    Vehicle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]),
    Vehicle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
    ]),
    Vehicle.aggregate([
      {
        $match: {
          isActive: true,
          stockInDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$stockInDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
    Vehicle.aggregate([
      {
        $match: { isActive: true, soldDate: { $exists: true, $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$soldDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Vehicle.aggregate([
      {
        $match: {
          isActive: true,
          stockInDate: { $exists: true },
          soldDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: "$daysInStock" },
        },
      },
    ]),
  ]);

  const turnoverData = stockTrend.map((item) => ({
    date: item._id,
    stockIn: item.count,
  }));

  return {
    stageStats,
    riskStats,
    stockTrend: turnoverData,
    soldStats,
    avgDaysInStock: avgDaysResult[0]?.avgDays || 0,
  };
}

export interface AddInspectionData {
  overallGrade: "A" | "B" | "C" | "D";
  inspectionDate?: string;
  totalEstimatedCost: number;
  status?: "pending" | "in_progress" | "completed" | "rejected";
  notes?: string;
  accidentHistory: {
    hasAccident: boolean;
    description?: string;
  };
  testResult: {
    brakeTest: boolean;
    emissionTest: boolean;
    suspensionTest: boolean;
  };
  exteriorItems: Array<{ name: string; condition: "excellent" | "good" | "fair" | "poor"; estimatedCost?: number }>;
  interiorItems: Array<{ name: string; condition: "excellent" | "good" | "fair" | "poor"; estimatedCost?: number }>;
  mechanicalItems: Array<{ name: string; condition: "excellent" | "good" | "fair" | "poor"; estimatedCost?: number }>;
  electricalItems: Array<{ name: string; condition: "excellent" | "good" | "fair" | "poor"; estimatedCost?: number }>;
}

export async function addInspection(
  vehicleId: string,
  data: AddInspectionData,
  inspectorId: string,
  user?: UserDocument
) {
  const connected = await connectToMongo();
  if (!connected) {
    throw new Error("数据库连接失败");
  }

  const filter: Record<string, any> = { _id: new Types.ObjectId(vehicleId), isActive: true };
  if (user?.role === "executive") {
    filter.assignedTo = user._id;
  }

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    throw new Error("车辆不存在或无权限访问");
  }

  const existing = await InspectionReport.findOne({ vehicleId: vehicle._id });
  if (existing) {
    throw new Error("该车辆已有检测报告");
  }

  const inspection = new InspectionReport({
    ...data,
    vehicleId: vehicle._id,
    inspectorId: new Types.ObjectId(inspectorId),
    inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : new Date(),
  });
  await inspection.save();

  if (vehicle.stage === "archive") {
    vehicle.stage = "inspection";
    await vehicle.save();
  }

  return inspection.toObject();
}

export interface AddPreparationData {
  items: Array<{
    name: string;
    category: string;
    priority: "low" | "medium" | "high";
    estimatedCost: number;
  }>;
  totalEstimatedCost: number;
  notes?: string;
}

export async function addPreparation(
  vehicleId: string,
  data: AddPreparationData,
  preparedBy: string,
  user?: UserDocument
) {
  const connected = await connectToMongo();
  if (!connected) {
    throw new Error("数据库连接失败");
  }

  const filter: Record<string, any> = { _id: new Types.ObjectId(vehicleId), isActive: true };
  if (user?.role === "executive") {
    filter.assignedTo = user._id;
  }

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    throw new Error("车辆不存在或无权限访问");
  }

  const existing = await PreparationList.findOne({ vehicleId: vehicle._id });
  if (existing) {
    throw new Error("该车辆已有整备清单");
  }

  const preparation = new PreparationList({
    ...data,
    vehicleId: vehicle._id,
    preparedBy: new Types.ObjectId(preparedBy),
    startDate: new Date(),
    items: data.items.map((item) => ({
      ...item,
      status: "pending",
      actualCost: 0,
    })),
  });
  await preparation.save();

  if (vehicle.stage === "inspection") {
    vehicle.stage = "preparation";
    await vehicle.save();
  }

  return preparation.toObject();
}

export interface AddTestDriveData {
  date?: string;
  startTime: string;
  endTime: string;
  startMileage: number;
  endMileage: number;
  route: string;
  clientName?: string;
  clientPhone?: string;
  clientInterest?: "low" | "medium" | "high";
  overallRating: number;
  issuesFound?: string;
  clientNotes?: string;
  feedback: {
    engine: number;
    transmission: number;
    suspension: number;
    brake: number;
    steering: number;
    noise: number;
  };
}

export async function addTestDrive(
  vehicleId: string,
  data: AddTestDriveData,
  driverId: string,
  user?: UserDocument
) {
  const connected = await connectToMongo();
  if (!connected) {
    throw new Error("数据库连接失败");
  }

  const filter: Record<string, any> = { _id: new Types.ObjectId(vehicleId), isActive: true };
  if (user?.role === "executive") {
    filter.assignedTo = user._id;
  }

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    throw new Error("车辆不存在或无权限访问");
  }

  const testDrive = new TestDriveRecord({
    ...data,
    vehicleId: vehicle._id,
    driverId: new Types.ObjectId(driverId),
    date: data.date ? new Date(data.date) : new Date(),
  });
  await testDrive.save();

  if (vehicle.stage === "preparation") {
    vehicle.stage = "testdrive";
    await vehicle.save();
  }

  return testDrive.toObject();
}

export interface AddQuoteData {
  price: number;
  offeredToName?: string;
  offeredToPhone?: string;
  validUntil?: string;
  conditions?: string;
  status?: "proposed" | "negotiating" | "accepted" | "rejected" | "expired";
}

export async function addQuote(
  vehicleId: string,
  data: AddQuoteData,
  offeredById: string,
  user?: UserDocument
) {
  const connected = await connectToMongo();
  if (!connected) {
    throw new Error("数据库连接失败");
  }

  const filter: Record<string, any> = { _id: new Types.ObjectId(vehicleId), isActive: true };
  if (user?.role === "executive") {
    filter.assignedTo = user._id;
  }

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    throw new Error("车辆不存在或无权限访问");
  }

  const quote = new PriceQuote({
    ...data,
    vehicleId: vehicle._id,
    offeredById: new Types.ObjectId(offeredById),
    validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
  });
  await quote.save();

  if (vehicle.stage === "testdrive") {
    vehicle.stage = "quoting";
    await vehicle.save();
  }

  return quote.toObject();
}
