export type UserRole =
  | "director"
  | "advisor"
  | "technician"
  | "parts"
  | "external";

export interface OverviewData {
  totalWorkOrders: number;
  avgRepairDuration: number;
  reworkRate: number;
  stationUtilization: number;
  lastUpdated: string;
}

export interface QuotationTrendItem {
  date: string;
  orderCount: number;
  totalAmount: number;
  avgAmount: number;
}

export interface QuotationTrendResponse {
  data: QuotationTrendItem[];
  lastUpdated: string;
}

export interface InspectionSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface InspectionIssueItem {
  type: string;
  count: number;
  percentage: number;
}

export interface InspectionResponse {
  summary: InspectionSummary;
  issues: InspectionIssueItem[];
  lastUpdated: string;
}

export interface VehiclePart {
  partId: string;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  usedDate: string;
}

export interface InsuranceDoc {
  id: string;
  orderId: string;
  company: string;
  policyNumber: string;
  claimAmount: number;
  claimStatus: string;
  filedDate: string;
  settledDate?: string;
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  vehicleModel: string;
  ownerName: string;
  lastServiceDate: string;
  serviceCount: number;
  totalAmount: number;
  parts?: VehiclePart[];
  insuranceDocs?: InsuranceDoc[];
}

export interface InsuranceSummary {
  totalClaims: number;
  totalClaimAmount: number;
  pendingCount: number;
  approvedCount: number;
  settledCount: number;
  avgClaimAmount: number;
}

export interface InsuranceClaimItem {
  id: string;
  plateNumber: string;
  vehicleModel: string;
  company: string;
  policyNumber: string;
  claimAmount: number;
  claimStatus: string;
  filedDate: string;
  settledDate?: string;
}

export interface InsuranceResponse {
  summary: InsuranceSummary;
  claims: InsuranceClaimItem[];
  lastUpdated: string;
}

export interface VehicleResponse {
  data: VehicleRecord[];
  total: number;
  lastUpdated: string;
}

export interface DiagnosisAbnormalItem {
  id: string;
  date: string;
  vehiclePlate: string;
  diagnosisItem: string;
  severity: "low" | "medium" | "high";
  isRework: boolean;
  technician: string;
}

export interface DiagnosisTrendItem {
  date: string;
  abnormalCount: number;
  reworkCount: number;
}

export interface DiagnosisResponse {
  abnormalItems: DiagnosisAbnormalItem[];
  trend: DiagnosisTrendItem[];
  lastUpdated: string;
}

export interface ShareLinkRequest {
  role: UserRole;
  expiresIn?: number;
  scope?: string[];
}

export interface ShareLinkResponse {
  token: string;
  url: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
}

export interface RolePermissions {
  canViewOverview: boolean;
  canViewQuotation: boolean;
  canViewFullAmount: boolean;
  canViewInspection: boolean;
  canViewInspectionDetail: boolean;
  canViewVehicles: boolean;
  canViewAllVehicles: boolean;
  canViewParts: boolean;
  canViewInsurance: boolean;
  canViewDiagnosis: boolean;
  canExport: boolean;
  canExportFull: boolean;
}

export const roleNames: Record<UserRole, string> = {
  director: "厂长",
  advisor: "服务顾问",
  technician: "维修技师",
  parts: "配件管理员",
  external: "外部人员",
};

export function getRolePermissions(role: UserRole): RolePermissions {
  const permissions: Record<UserRole, RolePermissions> = {
    director: {
      canViewOverview: true,
      canViewQuotation: true,
      canViewFullAmount: true,
      canViewInspection: true,
      canViewInspectionDetail: true,
      canViewVehicles: true,
      canViewAllVehicles: true,
      canViewParts: true,
      canViewInsurance: true,
      canViewDiagnosis: true,
      canExport: true,
      canExportFull: true,
    },
    advisor: {
      canViewOverview: true,
      canViewQuotation: true,
      canViewFullAmount: true,
      canViewInspection: true,
      canViewInspectionDetail: false,
      canViewVehicles: true,
      canViewAllVehicles: true,
      canViewParts: false,
      canViewInsurance: true,
      canViewDiagnosis: true,
      canExport: true,
      canExportFull: false,
    },
    technician: {
      canViewOverview: true,
      canViewQuotation: true,
      canViewFullAmount: false,
      canViewInspection: true,
      canViewInspectionDetail: true,
      canViewVehicles: true,
      canViewAllVehicles: false,
      canViewParts: false,
      canViewInsurance: false,
      canViewDiagnosis: true,
      canExport: false,
      canExportFull: false,
    },
    parts: {
      canViewOverview: true,
      canViewQuotation: false,
      canViewFullAmount: false,
      canViewInspection: false,
      canViewInspectionDetail: false,
      canViewVehicles: true,
      canViewAllVehicles: true,
      canViewParts: true,
      canViewInsurance: false,
      canViewDiagnosis: false,
      canExport: true,
      canExportFull: false,
    },
    external: {
      canViewOverview: false,
      canViewQuotation: false,
      canViewFullAmount: false,
      canViewInspection: false,
      canViewInspectionDetail: false,
      canViewVehicles: false,
      canViewAllVehicles: false,
      canViewParts: false,
      canViewInsurance: false,
      canViewDiagnosis: false,
      canExport: false,
      canExportFull: false,
    },
  };

  return permissions[role] || permissions.external;
}
