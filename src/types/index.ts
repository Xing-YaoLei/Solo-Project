export type UserRole = 'admin' | 'dispatcher' | 'inspector' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface DashboardData {
  lastRefreshedAt: string;
  warnings: {
    overloadedStations: number;
    inventoryGaps: number;
    qualityAnomalies: number;
    reworkRateAlert: boolean;
    insuranceRejectRate?: number;
    cashierAnomalyCount?: number;
  };
  reworkRate: {
    value: number;
    threshold: number;
    calculation: string;
    insuranceReworkShare?: number;
    insuranceReworkedCount?: number;
  };
}

export interface WorkorderTrendPoint {
  date: string;
  total: number;
  completed: number;
  reworked: number;
  reworkRate: number;
  revenue?: number;
  revenueBreakdown?: {
    cash: number;
    card: number;
    insurance: number;
  };
  insurance?: {
    filed: number;
    settled: number;
    rejected: number;
  };
  partsFromInsurance?: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  isGap: boolean;
  value: number;
}

export interface InventoryCategoryData {
  name: string;
  value: number;
  isGap?: boolean;
  count: number;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  partId?: string;
  partSku?: string;
}

export interface PartTraceItem {
  quoteItemId: string;
  description: string;
  partId: string;
  partSku: string;
  partName: string;
  category?: string;
  unitValue: number;
  quoteUnitPrice: number;
  markup: number;
  inStock: number;
  minThreshold: number;
  isGap: boolean;
}

export interface CashierTxn {
  id: string;
  amount: number;
  type: string;
  reference?: string;
  createdAt: string;
}

export interface InsuranceClaimData {
  id: string;
  policyNo: string;
  claimAmount: number;
  approvedAmount: number;
  status: string;
  materials?: any[];
}

export interface Quote {
  id: string;
  quoteNo: string;
  customerName: string;
  vehiclePlate: string;
  workorderId?: string;
  totalAmount: number;
  totalPaid?: number;
  balance?: number;
  createdAt: string;
  status: 'draft' | 'approved' | 'completed';
  items: QuoteItem[];
  cashier?: {
    transactions: CashierTxn[];
    totalPaid: number;
  };
  insurance?: {
    claims: InsuranceClaimData[];
    totalClaim: number;
    settledAmount: number;
  };
  partTraceability?: PartTraceItem[];
  insuranceMaterialsUsed?: any[];
}

export type AnnotationType = 'scratch' | 'dent' | 'missing_part' | 'other';

export interface Annotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  remark: string;
}

export interface InspectionPartUsed {
  partId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  inStock: number;
  minThreshold: number;
  isStockGap: boolean;
}

export interface Inspection {
  id: string;
  workorderId: string;
  vehiclePlate: string;
  photoUrl: string;
  hasAnomaly: boolean;
  anomalySources?: string[];
  annotations: Annotation[];
  createdAt: string;
  inspectorId: string;
  isReworked?: boolean;
  insurance?: {
    claims: InsuranceClaimData[];
    rejectedMaterials?: any[];
    hasRejection: boolean;
  };
  partsUsed?: InspectionPartUsed[];
  hasStockGapParts?: boolean;
  cashier?: {
    totalPaid: number;
    txCount: number;
  };
}

export const REWORK_RATE_CALCULATION = `返修率计算口径说明：
1. 计算公式：返修率 = 返修工单数 / 完工总工单数 × 100%
2. 统计范围：当月已完工且已结算的工单
3. 返修定义：同一车辆30天内因相同故障再次入场维修
4. 排除项：正常保养、召回维修、保险理赔二次维修不计入返修
5. 数据来源：收银流水系统 + 工单系统交叉校验
`;

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  scratch: '划痕',
  dent: '凹陷',
  missing_part: '配件缺失',
  other: '其他',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  dispatcher: '调度员',
  inspector: '质检员',
  viewer: '只读用户',
};
