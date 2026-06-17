export type DispatchTrendPoint = {
  date: string;
  totalOrders: number;
  onTimeOrders: number;
  delayedOrders: number;
  onTimeRate: number;
  anomalyOrders: number;
};

export type KPIData = {
  todayOrders: number;
  todayOrdersYoY: number;
  todayOrdersMoM: number;
  onTimeRate: number;
  onTimeRateYoY: number;
  onTimeRateMoM: number;
  delayedCount: number;
  anomalyCount: number;
};

export type AnomalyDistribution = {
  name: string;
  value: number;
  color: string;
};

export type DataDifference = {
  id: string;
  orderId: string;
  orderNo: string;
  crmValue: Record<string, unknown>;
  meterValue: Record<string, unknown>;
  diffFields: string[];
  diffAmount?: number;
  createdAt: string;
};

export type PaymentVersion = {
  id: string;
  orderId: string;
  orderNo: string;
  version: number;
  amount: number;
  status: string;
  operator: string;
  changedAt: string;
  changeReason: string;
};

export type RoutePlanType = {
  id: string;
  routeName: string;
  driverName: string;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  plannedOrderCount: number;
  completedOrderCount: number;
  status: "pending" | "in_progress" | "completed" | "delayed";
  delayMinutes?: number;
};

export type RouteSampleDetail = {
  orderId: string;
  orderNo: string;
  apartmentId: string;
  repairType: string;
  plannedTime: string;
  actualTime?: string;
  isOnTime: boolean;
  delayMinutes?: number;
  status: string;
};

export type DriverCheckinType = {
  id: string;
  driverId: string;
  driverName: string;
  vehicleNo: string;
  routeId: string;
  routeName: string;
  checkinTime: string;
  checkinLocation: { lat: number; lng: number };
  status: "checked_in" | "not_checked_in" | "abnormal";
};

export type TrackPointType = {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  orderId?: string;
};

export type LoadingItemType = {
  id: string;
  routeId: string;
  routeName: string;
  orderId: string;
  orderNo: string;
  materialName: string;
  quantity: number;
  unit: string;
  loadedQuantity?: number;
  status: "normal" | "abnormal" | "missing";
  originalRecordId: string;
  remark?: string;
};

export type OriginalRecordType = {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  enteredBy: string;
  enteredAt: string;
  source: string;
  rawData: Record<string, unknown>;
};
