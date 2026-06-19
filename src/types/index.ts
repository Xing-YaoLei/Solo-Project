export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  faultCodes: string[];
  customerDescription: string;
  color: string;
}

export interface DiagnosisItem {
  id: string;
  name: string;
  confirmed: boolean;
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
  relatedFaultCode?: string;
}

export type RepairCategory = 'engine' | 'brake' | 'electrical' | 'body' | 'suspension' | 'transmission';

export interface RepairItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  laborHours: number;
  partsCost: number;
  required: boolean;
  relatedFaultId: string | null;
  category: RepairCategory;
}

export interface WorkOrderResult {
  success: boolean;
  score: number;
  isRework: boolean;
  isComplaint: boolean;
  missingItems: string[];
  unnecessaryItems: string[];
  priceAccuracy: number;
  message: string;
  stars: number;
}

export interface LeaderboardEntry {
  playerName: string;
  reworkRate: number;
  avgCompletionTime: number;
  totalScore: number;
  gamesPlayed: number;
  timestamp: number;
}

export interface GameState {
  currentScene: string;
  currentLevel: number;
  currentVehicle: Vehicle | null;
  diagnosisResults: DiagnosisItem[];
  selectedRepairItems: string[];
  availableRepairItems: RepairItem[];
  startTime: number;
  isFirstPlay: boolean;
  tutorialStep: number;
  levelStartTime: number;
}

export type SceneKey = 'Boot' | 'Menu' | 'Game' | 'Tutorial' | 'Leaderboard' | 'Result';
