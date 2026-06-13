export interface Supplier {
  id: string;
  name: string;
  leadTime: number;
  minOrderQty: number;
  reliability: number;
  priceMultiplier: number;
  categories: string[];
}

export interface Consumable {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  safetyStock: number;
  maxStock: number;
  currentStock: number;
  dailyUsage: number;
  supplierIds: string[];
  batchNo: string;
  expiryDays: number;
  receivedDate: number;
}

export interface RequisitionRecord {
  id: string;
  consumableId: string;
  supplierId: string;
  qty: number;
  timestamp: number;
  gameDay: number;
  stepIndex: number;
  isCorrect: boolean;
  arrived: boolean;
  errorType?: ErrorType;
}

export interface InventoryCheck {
  id: string;
  consumableId: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  gameDay: number;
  stepIndex: number;
  isCorrect: boolean;
  errorType?: ErrorType;
}

export type ErrorType =
  | 'WRONG_SUPPLIER'
  | 'OVER_ORDER'
  | 'UNDER_ORDER'
  | 'SAFETY_STOCK_BREACH'
  | 'EXPIRED_BATCH'
  | 'STOCKOUT'
  | 'INVENTORY_MISMATCH'
  | 'LEAD_TIME_MISJUDGMENT';

export interface GameStep {
  type: 'SUPPLIER_SELECT' | 'REQUISITION' | 'INVENTORY_CHECK' | 'STOCK_REVIEW';
  gameDay: number;
  timestamp: number;
  stepIndex: number;
  data: SupplierSelectData | RequisitionData | InventoryCheckData | StockReviewData;
  isCorrect: boolean;
  errorType?: ErrorType;
  timeSpent: number;
}

export interface SupplierSelectData {
  consumableId: string;
  chosenSupplierId: string;
  correctSupplierId: string;
}

export interface RequisitionData {
  consumableId: string;
  supplierId: string;
  orderQty: number;
  correctQty: number;
}

export interface InventoryCheckData {
  consumableId: string;
  reportedQty: number;
  actualQty: number;
}

export interface StockReviewData {
  itemsBelowSafety: string[];
  itemsNearExpiry: string[];
  actionTaken: string;
  correctAction: string;
}

export interface GameSession {
  id: string;
  startTime: number;
  endTime?: number;
  totalDays: number;
  steps: GameStep[];
  finalScore: number;
  errorSummary: ErrorSummary[];
  turnoverDays: number;
  completed: boolean;
}

export interface ErrorSummary {
  errorType: ErrorType;
  count: number;
  relatedSafetyStock: boolean;
  description: string;
}

export interface ReplayRecord {
  sessionId: string;
  steps: GameStep[];
  failedAtStep: number;
  failureReason: ErrorType;
  timestamp: number;
}

export interface TutorialState {
  completed: boolean;
  currentStep: number;
  supplierIntroDone: boolean;
  firstRequisitionDone: boolean;
  firstInventoryDone: boolean;
  firstWarningHandled: boolean;
}
