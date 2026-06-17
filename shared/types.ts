export type UserRole = 'operation_manager' | 'area_manager' | 'repair_manager' | 'service_manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  area?: string;
  permissions: string[];
}

export interface DashboardMetrics {
  moveOutRate: number;
  inspectionPassRate: number;
  avgRepairDuration: number;
  complaintRate: number;
  updateTime: string;
}

export interface MeterReading {
  id: string;
  propertyId: string;
  propertyName: string;
  date: string;
  waterReading: number;
  electricityReading: number;
  waterUsage: number;
  electricityUsage: number;
  isAnomaly: boolean;
  updateTime: string;
}

export interface InspectionItem {
  id: string;
  category: string;
  itemName: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high';
  updateTime: string;
}

export interface PaymentFlow {
  id: string;
  flowNo: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  amount: number;
  paymentType: string;
  paymentTime: string;
  source: string;
  updateTime: string;
}

export interface ComplaintTag {
  id: string;
  tagName: string;
  count: number;
  amount: number;
  isAbnormal: boolean;
  x: number;
  y: number;
  updateTime: string;
}

export interface PropertyRanking {
  id: string;
  propertyName: string;
  area: string;
  repairCount: number;
  complaintCount: number;
  repairRate: number;
  complaintRate: number;
  photoUrl: string;
  updateTime: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DataScope {
  areas: string[];
  roles: UserRole[];
}

export interface ShareLink {
  shareUrl: string;
  token: string;
  expireAt: string;
}

export const maintenanceCaliber = `
## 维修时长口径说明

1. **维修时长定义**：从租客报修登记时间起，至维修完成且租客确认签字的时间间隔，以自然日为单位。

2. **计时规则**：
   - 当日18:00前报修的，从报修时刻开始计算
   - 当日18:00后报修的，从次日08:00开始计算
   - 法定节假日期间报修的，从节假日后第一个工作日08:00开始计算

3. **暂停情形**：
   - 因租客原因无法入户维修的，期间不计入维修时长
   - 需等待配件采购的，配件在途时间不计入维修时长（需有采购记录证明）
   - 因不可抗力因素导致维修延误的，期间不计入维修时长

4. **统计范围**：
   - 包含所有已完成的维修工单
   - 不包含已取消的工单
   - 不包含超过30天仍未完成的工单（单独统计）

5. **数据来源**：
   - 报修时间：CRM系统工单创建时间
   - 完成时间：维修人员APP提交完成时间
   - 确认时间：租客签字确认时间（无签字则以维修完成时间为准）

6. **异常处理**：
   - 维修时长超过15天的工单标记为异常
   - 同一问题30天内重复报修的标记为返修
   - 异常工单需人工复核后计入统计

---
数据更新时间：${new Date().toLocaleString('zh-CN')}
`;

