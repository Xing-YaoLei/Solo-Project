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
  };
  reworkRate: {
    value: number;
    threshold: number;
    calculation: string;
  };
}

export interface WorkorderTrendPoint {
  date: string;
  total: number;
  completed: number;
  reworked: number;
  reworkRate: number;
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

export interface Quote {
  id: string;
  quoteNo: string;
  customerName: string;
  vehiclePlate: string;
  totalAmount: number;
  createdAt: string;
  status: 'draft' | 'approved' | 'completed';
  items: QuoteItem[];
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

export interface Inspection {
  id: string;
  workorderId: string;
  vehiclePlate: string;
  photoUrl: string;
  hasAnomaly: boolean;
  annotations: Annotation[];
  createdAt: string;
  inspectorId: string;
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
