export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  batchId: number;
  price: number;
  quantity: number;
  tagColor: string;
  isDefective: boolean;
  defectType?: 'shortage' | 'damaged' | 'wrong_item' | 'expired';
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  isWarning?: boolean;
  isProcessed?: boolean;
}

export interface Settlement {
  id: string;
  batchId: number;
  productIds: string[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed';
  customerName: string;
  pickupCode: string;
}

export interface Batch {
  id: number;
  name: string;
  deliveryTime: string;
  totalProducts: number;
  defectRate: number;
  color: string;
}

export interface ReplayFrame {
  time: number;
  action: 'pick' | 'place' | 'submit' | 'error' | 'warning';
  productId: string;
  settlementId?: string;
  isCorrect: boolean;
  position_x: number;
  position_y: number;
  position_z: number;
  errorType?: string;
}

export interface ProductError {
  productId: string;
  productName: string;
  errorType: string;
  expectedSettlement: string;
  actualSettlement?: string;
}

export interface GameRecord {
  id: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  onTimeRate: number;
  errors: string[];
  timestamp: number;
  difficulty: 'easy' | 'normal' | 'hard';
  replayData: ReplayFrame[];
  productErrors: ProductError[];
  totalTime: number;
  timeUsed: number;
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'finished';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface WarningState {
  active: boolean;
  productIds: string[];
  intensity: number;
  message: string;
}
