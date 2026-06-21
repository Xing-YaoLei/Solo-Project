export type QuestionType = 'amount_verify' | 'payment_flow' | 'reconcile_sort' | 'contract_attach'

export interface QuoteItem {
  service: string
  unitPrice: number
  quantity: number
  amount: number
}

export interface ContractItem {
  service: string
  amount: number
}

export interface Inconsistency {
  index: number
  reason: string
}

export interface AmountVerifyData {
  quoteItems: QuoteItem[]
  contractItems: ContractItem[]
  inconsistencies: Inconsistency[]
}

export interface FlowEntry {
  id: string
  date: string
  amount: number
  summary: string
  status: string
}

export interface PaymentFlowData {
  targetAmount: number
  flows: FlowEntry[]
  correctFlowIds: string[]
}

export interface DiffEntry {
  id: string
  type: string
  amount: number
  project: string
  severity: number
}

export interface ReconcileSortData {
  differences: DiffEntry[]
  correctOrder: string[]
}

export interface ClauseEntry {
  id: string
  clause: string
  requiredAttachment: string
}

export interface AttachmentEntry {
  id: string
  name: string
  type: string
}

export interface ContractAttachData {
  contractClauses: ClauseEntry[]
  attachmentPool: AttachmentEntry[]
  correctMapping: Record<string, string>
}

export type QuestionData = AmountVerifyData | PaymentFlowData | ReconcileSortData | ContractAttachData

export interface QuestionItem {
  id: string
  type: QuestionType
  title: string
  description: string
  data: QuestionData
  reward: number
  timeLimit?: number
}

export interface MistakeEntry {
  description: string
  reason: string
}

export interface TrainingRecord {
  id: string
  userId: string
  questionId: string
  questionType: QuestionType
  score: number
  maxScore: number
  timeSpent: number
  mistakes: MistakeEntry[]
  completedAt: string
  paymentCycleDays?: number
}

export interface Reward {
  id: string
  name: string
  type: 'points' | 'badge' | 'title'
  threshold: number
}

export interface OpenSchedule {
  levelId: string
  openFrom: string
  openTo: string
}

export type TrainingMode = 'practice' | 'timed' | 'exam'

export interface GameConfig {
  questions: QuestionItem[]
  rewards: Reward[]
  openSchedule: OpenSchedule[]
  trainingMode: TrainingMode
}

export interface UserProgress {
  userId: string
  totalScore: number
  completedLevels: string[]
  tutorialDone: boolean
  stars: Record<string, number>
}

export const LEVEL_LABELS: Record<QuestionType, string> = {
  amount_verify: '金额校验识别',
  payment_flow: '支付流水选择',
  reconcile_sort: '对账差异排序',
  contract_attach: '合同附件处理',
}

export const LEVEL_ORDER: QuestionType[] = [
  'amount_verify',
  'payment_flow',
  'reconcile_sort',
  'contract_attach',
]

export const REASON_OPTIONS = [
  '计算错误',
  '税率错误',
  '折扣遗漏',
  '项目缺失',
  '金额四舍五入差异',
  '重复计费',
]
