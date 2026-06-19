import { MaterialType } from './Material';

export type GamePhase = 'menu' | 'level_select' | 'briefing' | 'playing' | 'result' | 'replay';

export enum ActionType {
  COLLECT_MATERIAL = 'collect_material',
  VERIFY_MATERIAL = 'verify_material',
  REQUEST_MISSING = 'request_missing',
  CONFIRM_OWNERSHIP = 'confirm_ownership',
  CHECK_ENCUMBRANCE = 'check_encumbrance',
  REVIEW_FINANCE = 'review_finance',
  SIGN_CONTRACT = 'sign_contract',
  SUBMIT_TRANSFER = 'submit_transfer',
  CONFIRM_PAYMENT = 'confirm_payment',
  COMPLETE_TRANSFER = 'complete_transfer',
  REVIEW_VEHICLE_CONDITION = 'review_vehicle_condition',
  CHECK_INSURANCE = 'check_insurance',
  CHECK_TAX = 'check_tax',
  REJECT_MATERIAL = 'reject_material'
}

export const ActionTypeNames: Record<ActionType, string> = {
  [ActionType.COLLECT_MATERIAL]: '收集材料',
  [ActionType.VERIFY_MATERIAL]: '核验材料',
  [ActionType.REQUEST_MISSING]: '补充材料',
  [ActionType.CONFIRM_OWNERSHIP]: '确认产权',
  [ActionType.CHECK_ENCUMBRANCE]: '检查抵押',
  [ActionType.REVIEW_FINANCE]: '审查金融',
  [ActionType.SIGN_CONTRACT]: '签署合同',
  [ActionType.SUBMIT_TRANSFER]: '提交过户',
  [ActionType.CONFIRM_PAYMENT]: '确认款项',
  [ActionType.COMPLETE_TRANSFER]: '完成过户',
  [ActionType.REVIEW_VEHICLE_CONDITION]: '验车',
  [ActionType.CHECK_INSURANCE]: '核查保险',
  [ActionType.CHECK_TAX]: '核查税务',
  [ActionType.REJECT_MATERIAL]: '退回材料'
};

export interface ActionOption {
  id: string;
  type: ActionType;
  targetMaterial?: MaterialType;
  label: string;
  description: string;
  isCorrect: boolean;
  feedbackCorrect: string;
  feedbackWrong: string;
  penaltyPoints: number;
}

export interface TaskStep {
  id: string;
  stepNumber: number;
  prompt: string;
  description: string;
  availableActions: ActionOption[];
  correctActionId: string;
  hint?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  steps: TaskStep[];
  vehicleId: string;
  expectedDurationSeconds: number;
  maxErrorTolerance: number;
}

export interface PlayerAction {
  stepId: string;
  actionId: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpentMs: number;
  pointsEarned: number;
  pointsDeducted: number;
}
