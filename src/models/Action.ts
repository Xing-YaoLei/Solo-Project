import type { ActionType } from './index';

export interface ActionConsequence {
  /** 后果类型 */
  type: 'cost' | 'time' | 'quality' | 'material' | 'clue';
  /** 影响数值 */
  value: number;
  /** 后果描述 */
  description: string;
  /** 发生概率 */
  probability: number;
}

export interface Action {
  /** 动作唯一标识 */
  id: string;
  /** 所属关卡ID */
  levelId: string;
  /** 动作类型 */
  type: ActionType;
  /** 动作标题 */
  title: string;
  /** 动作描述 */
  description: string;
  /** 执行成本 */
  cost: number;
  /** 所需工期（天） */
  duration: number;
  /** 风险等级（1-5） */
  risk: number;
  /** 对质量的影响（-10 ~ +10） */
  qualityImpact: number;
  /** 适用线索ID列表 */
  applicableClueIds: string[];
  /** 前置必需线索ID列表 */
  requiredClueIds: string[];
  /** 动作后果列表 */
  consequences: ActionConsequence[];
}
