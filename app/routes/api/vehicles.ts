import { Router, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Vehicle, VehicleDocument, AcquisitionStage } from "~/models/vehicle";
import { InspectionReport } from "~/models/inspectionReport";
import { PreparationList } from "~/models/preparationList";
import { TestDriveRecord } from "~/models/testDriveRecord";
import { PriceQuote } from "~/models/priceQuote";
import { Communication } from "~/models/communication";
import { AuthRequest, requireManager } from "~/middleware/auth";
import { connectToMongo } from "~/lib/db";

export const vehiclesRouter = Router();

const vehicleSchema = z.object({
  plateNumber: z.string().min(1),
  vin: z.string().length(17),
  brand: z.string().min(1),
  vehicleModel: z.string().min(1),
  year: z.number().int().min(1990).max(new Date().getFullYear()),
  color: z.string().min(1),
  mileage: z.number().min(0),
  fuelType: z.enum(["gasoline", "diesel", "hybrid", "electric"]),
  transmission: z.enum(["manual", "automatic", "cvt"]),
  displacement: z.string().optional(),
  registerDate: z.string().optional(),
  firstOwnerName: z.string().optional(),
  firstOwnerPhone: z.string().optional(),
  documentCheck: z
    .object({
      registration: z.boolean().default(false),
      drivingLicense: z.boolean().default(false),
      insurance: z.boolean().default(false),
      maintenanceRecord: z.boolean().default(false),
      accidentRecord: z.boolean().default(false),
      emissionTest: z.boolean().default(false),
    })
    .optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  expectedPrice: z.number().min(0).optional(),
});

const vehicleStageUpdate = z.object({
  stage: z.enum(["archive", "inspection", "preparation", "testdrive", "quoting", "completed", "cancelled"]),
});

function getVehicleFilter(req: AuthRequest) {
  const filter: Record<string, any> = { isActive: true };
  if (req.user?.role === "executive") {
    filter.assignedTo = req.user._id;
  }
  return filter;
}

vehiclesRouter.get("/", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  const { stage, riskLevel, search, page = "1", limit = "20" } = req.query;

  if (stage) filter.stage = stage;
  if (riskLevel) filter.riskLevel = riskLevel;

  if (search) {
    filter.$text = { $search: search as string };
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const vehicles = await Vehicle.find(filter)
    .populate("assignedTo", "name role")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const stagePriority: Record<string, number> = {
    archive: 1,
    inspection: 2,
    preparation: 3,
    testdrive: 4,
    quoting: 5,
    completed: 7,
    cancelled: 6,
  };

  const riskPriority: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortedVehicles = (vehicles as any[]).sort((a, b) => {
    const aRisk = riskPriority[a.riskLevel as keyof typeof riskPriority] ?? 99;
    const bRisk = riskPriority[b.riskLevel as keyof typeof riskPriority] ?? 99;
    if (aRisk !== bRisk) return aRisk - bRisk;
    const aStage = stagePriority[a.stage as keyof typeof stagePriority] ?? 99;
    const bStage = stagePriority[b.stage as keyof typeof stagePriority] ?? 99;
    return aStage - bStage;
  });

  const total = await Vehicle.countDocuments(filter);

  res.json({
    vehicles: sortedVehicles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

vehiclesRouter.get("/statistics", requireManager, async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stageStats = await Vehicle.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$stage", count: { $sum: 1 } } },
  ]);

  const riskStats = await Vehicle.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
  ]);

  const stockTrend = await Vehicle.aggregate([
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
  ]);

  const turnoverData = stockTrend.map((item) => ({
    date: item._id,
    stockIn: item.count,
  }));

  const soldStats = await Vehicle.aggregate([
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
  ]);

  const avgDaysInStock = await Vehicle.aggregate([
    { $match: { isActive: true, daysInStock: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: "$daysInStock" } } },
  ]);

  res.json({
    stageStats,
    riskStats,
    stockTrend: turnoverData,
    soldStats,
    avgDaysInStock: avgDaysInStock[0]?.avg || 0,
  });
});

vehiclesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter)
    .populate("assignedTo", "name role")
    .populate("createdBy", "name")
    .populate("inspectionReport")
    .populate("preparationList")
    .populate({
      path: "testDriveRecords",
      populate: { path: "driverId", select: "name" },
      options: { sort: { date: -1 } },
    })
    .populate({
      path: "priceQuotes",
      populate: { path: "offeredById", select: "name" },
      options: { sort: { createdAt: -1 } },
    })
    .populate({
      path: "communications",
      populate: [
        { path: "createdById", select: "name" },
        { path: "reviewedById", select: "name" },
      ],
      options: { sort: { createdAt: -1 } },
    })
    .lean();

  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  res.json({ vehicle });
});

vehiclesRouter.post("/", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const validation = vehicleSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const data = validation.data;

  const existing = await Vehicle.findOne({
    $or: [{ plateNumber: data.plateNumber }, { vin: data.vin }],
  });
  if (existing) {
    res.status(400).json({ error: "车牌号或VIN码已存在" });
    return;
  }

  const vehicle = new Vehicle({
    ...data,
    registerDate: data.registerDate ? new Date(data.registerDate) : undefined,
    createdBy: req.user!._id,
    assignedTo: data.assignedTo
      ? new Types.ObjectId(data.assignedTo)
      : req.user!._id,
  });

  await vehicle.save();
  await vehicle.populate("assignedTo", "name role");
  await vehicle.populate("createdBy", "name");

  res.status(201).json({ vehicle });
});

vehiclesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const validation = vehicleSchema.partial().safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const data = validation.data;

  if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
    const existing = await Vehicle.findOne({
      plateNumber: data.plateNumber,
      _id: { $ne: vehicle._id },
    });
    if (existing) {
      res.status(400).json({ error: "车牌号已存在" });
      return;
    }
  }

  if (data.vin && data.vin !== vehicle.vin) {
    const existing = await Vehicle.findOne({
      vin: data.vin,
      _id: { $ne: vehicle._id },
    });
    if (existing) {
      res.status(400).json({ error: "VIN码已存在" });
      return;
    }
  }

  Object.assign(vehicle, {
    ...data,
    registerDate: data.registerDate ? new Date(data.registerDate) : vehicle.registerDate,
    assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : vehicle.assignedTo,
  });

  await vehicle.save();
  await vehicle.populate("assignedTo", "name role");
  await vehicle.populate("createdBy", "name");

  res.json({ vehicle });
});

vehiclesRouter.patch("/:id/stage", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const validation = vehicleStageUpdate.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  vehicle.stage = validation.data.stage;

  if (validation.data.stage === "completed" && !vehicle.stockInDate) {
    vehicle.stockInDate = new Date();
  }

  await vehicle.save();
  await vehicle.populate("assignedTo", "name role");

  res.json({ vehicle });
});

vehiclesRouter.delete("/:id", requireManager, async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在" });
    return;
  }

  vehicle.isActive = false;
  await vehicle.save();

  res.json({ message: "车辆已删除" });
});

vehiclesRouter.post("/:id/inspection", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const existing = await InspectionReport.findOne({ vehicleId: vehicle._id });
  if (existing) {
    res.status(400).json({ error: "该车辆已有检测报告" });
    return;
  }

  const inspectionData = {
    ...req.body,
    vehicleId: vehicle._id,
    inspectorId: req.user!._id,
    inspectionDate: req.body.inspectionDate
      ? new Date(req.body.inspectionDate)
      : new Date(),
  };

  const inspection = new InspectionReport(inspectionData);
  await inspection.save();

  if (vehicle.stage === "archive") {
    vehicle.stage = "inspection";
    await vehicle.save();
  }

  res.status(201).json({ inspection });
});

vehiclesRouter.put("/:id/inspection", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const inspection = await InspectionReport.findOne({ vehicleId: vehicle._id });
  if (!inspection) {
    res.status(404).json({ error: "检测报告不存在" });
    return;
  }

  Object.assign(inspection, req.body);
  await inspection.save();

  res.json({ inspection });
});

vehiclesRouter.post("/:id/preparation", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const existing = await PreparationList.findOne({ vehicleId: vehicle._id });
  if (existing) {
    res.status(400).json({ error: "该车辆已有整备清单" });
    return;
  }

  const preparation = new PreparationList({
    ...req.body,
    vehicleId: vehicle._id,
    preparedBy: req.user!._id,
    startDate: new Date(),
  });
  await preparation.save();

  if (vehicle.stage === "inspection") {
    vehicle.stage = "preparation";
    await vehicle.save();
  }

  res.status(201).json({ preparation });
});

vehiclesRouter.put("/:id/preparation", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const preparation = await PreparationList.findOne({ vehicleId: vehicle._id });
  if (!preparation) {
    res.status(404).json({ error: "整备清单不存在" });
    return;
  }

  Object.assign(preparation, req.body);
  await preparation.save();

  res.json({ preparation });
});

vehiclesRouter.post("/:id/testdrive", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const testDrive = new TestDriveRecord({
    ...req.body,
    vehicleId: vehicle._id,
    driverId: req.user!._id,
    date: req.body.date ? new Date(req.body.date) : new Date(),
  });
  await testDrive.save();

  if (vehicle.stage === "preparation") {
    vehicle.stage = "testdrive";
    await vehicle.save();
  }

  res.status(201).json({ testDrive });
});

vehiclesRouter.post("/:id/quote", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const quote = new PriceQuote({
    ...req.body,
    vehicleId: vehicle._id,
    offeredById: req.user!._id,
  });
  await quote.save();

  if (vehicle.stage === "testdrive") {
    vehicle.stage = "quoting";
    await vehicle.save();
  }

  res.status(201).json({ quote });
});

vehiclesRouter.post("/:id/communication", async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const filter = getVehicleFilter(req);
  filter._id = new Types.ObjectId(req.params.id);

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    res.status(404).json({ error: "车辆不存在或无权限访问" });
    return;
  }

  const communication = new Communication({
    ...req.body,
    vehicleId: vehicle._id,
    createdById: req.user!._id,
    followUpDate: req.body.followUpDate
      ? new Date(req.body.followUpDate)
      : undefined,
  });
  await communication.save();
  await communication.populate("createdById", "name");

  res.status(201).json({ communication });
});

vehiclesRouter.patch("/:id/communication/:commId/review", requireManager, async (req: AuthRequest, res: Response) => {
  await connectToMongo();

  const communication = await Communication.findById(req.params.commId);
  if (!communication) {
    res.status(404).json({ error: "沟通记录不存在" });
    return;
  }

  communication.reviewedById = req.user!._id;
  communication.reviewNotes = req.body.reviewNotes;
  communication.reviewedAt = new Date();
  await communication.save();
  await communication.populate("reviewedById", "name");

  res.json({ communication });
});
