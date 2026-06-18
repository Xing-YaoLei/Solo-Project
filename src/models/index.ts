export const TaskStatus = {
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export type Difficulty = 'easy' | 'medium' | 'hard';

export const ClueType = {
  VISUAL: 'visual',
  PHOTO: 'photo',
  DOCUMENT: 'document',
  MEASUREMENT: 'measurement',
} as const;
export type ClueType = typeof ClueType[keyof typeof ClueType];

export const ActionType = {
  REPAIR: 'repair',
  REPLACE: 'replace',
  REDESIGN: 'redesign',
  IGNORE: 'ignore',
  REPORT: 'report',
} as const;
export type ActionType = typeof ActionType[keyof typeof ActionType];

export const InspectionStatus = {
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
  REWORK: 'rework',
} as const;
export type InspectionStatus = typeof InspectionStatus[keyof typeof InspectionStatus];

export const ChangeOrderStatus = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
} as const;
export type ChangeOrderStatus = typeof ChangeOrderStatus[keyof typeof ChangeOrderStatus];

export const ConstructionPhase = {
  PREPARATION: 'preparation',
  DEMOLITION: 'demolition',
  WATER_ELECTRIC: 'water_electric',
  MASONRY: 'masonry',
  WOODWORK: 'woodwork',
  PAINTING: 'painting',
  INSTALLATION: 'installation',
  INSPECTION: 'inspection',
  FINAL: 'final',
} as const;
export type ConstructionPhase = typeof ConstructionPhase[keyof typeof ConstructionPhase];

export const ProblemType = {
  QUALITY: 'quality',
  SAFETY: 'safety',
  DESIGN: 'design',
  MATERIAL: 'material',
  SCHEDULE: 'schedule',
  COST: 'cost',
} as const;
export type ProblemType = typeof ProblemType[keyof typeof ProblemType];

export const MistakeReason = {
  MISSED_CLUE: 'missed_clue',
  WRONG_ACTION: 'wrong_action',
  DELAYED_MATERIAL: 'delayed_material',
  POOR_QUALITY: 'poor_quality',
  OVER_BUDGET: 'over_budget',
  OVER_TIME: 'over_time',
} as const;
export type MistakeReason = typeof MistakeReason[keyof typeof MistakeReason];

export const Rating = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const;
export type Rating = typeof Rating[keyof typeof Rating];

export const DecisionOutcome = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
} as const;
export type DecisionOutcome = typeof DecisionOutcome[keyof typeof DecisionOutcome];

export * from './Task';
export * from './Level';
export * from './Clue';
export * from './Action';
export * from './Photo';
export * from './ChangeOrder';
export * from './Player';
export * from './TrainingRecord';
