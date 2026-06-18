import type { ChangeOrderStatus } from './index';

export interface ChangeOrder {
  /** 变更单唯一标识 */
  id: string;
  /** 所属任务ID */
  taskId: string;
  /** 所属关卡ID */
  levelId: string;
  /** 变更单标题 */
  title: string;
  /** 变更单描述 */
  description: string;
  /** 变更原因 */
  reason: string;
  /** 原始方案 */
  originalPlan: string;
  /** 新方案 */
  newPlan: string;
  /** 成本增加额 */
  costIncrease: number;
  /** 工期延长天数 */
  timeExtension: number;
  /** 对质量的影响 */
  qualityImpact: number;
  /** 变更单状态 */
  status: ChangeOrderStatus;
  /** 创建时间戳 */
  createdAt: number;
  /** 批准时间戳（可选） */
  approvedAt?: number;
  /** 拒绝原因（可选） */
  rejectionReason?: string;
  /** 关联动作ID列表 */
  relatedActionIds: string[];
  /** 额外成本 */
  additionalCost: number;
  /** 额外工期 */
  additionalDuration: number;
  /** 关联线索ID列表 */
  relatedClueIds: string[];
}
