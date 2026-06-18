import type { ProblemType, ConstructionPhase } from './index';

export interface UnlockCondition {
  type: 'phase' | 'clue' | 'action' | 'score';
  targetId: string;
  value?: string | number;
}

export type ProblemSeverity = 'low' | 'medium' | 'high';

export interface ProblemArea {
  /** 问题区域唯一标识 */
  id: string;
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 问题类型 */
  problemType: ProblemType;
  /** 问题描述 */
  description: string;
  /** 关联线索ID */
  clueId: string;
  /** 严重程度 */
  severity?: ProblemSeverity;
}

export interface InspectionPhoto {
  /** 照片唯一标识 */
  id: string;
  /** 所属关卡ID */
  levelId: string;
  /** 所属施工阶段 */
  phase: ConstructionPhase;
  /** 照片标题 */
  title: string;
  /** 照片描述 */
  description: string;
  /** 照片图片URL */
  imageUrl: string;
  /** 标准对比照片URL */
  standardImageUrl: string;
  /** 问题区域列表 */
  problemAreas: ProblemArea[];
  /** 是否已解锁 */
  isUnlocked: boolean;
  /** 解锁条件 */
  unlockCondition: UnlockCondition;
}
