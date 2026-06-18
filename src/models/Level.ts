import { Task } from './Task';
import { VehicleArchive } from './VehicleArchive';
import { QuoteHistory } from './QuoteHistory';
import { FinanceDocuments } from './FinanceDocuments';

export type Position = '过户专员' | '金融专员' | '评估师' | '综合岗位';
export type GameMode = 'training' | 'free_practice';

export interface Level {
  id: string;
  name: string;
  description: string;
  position: Position;
  difficulty: 1 | 2 | 3 | 4 | 5;
  hasMissingMaterials: boolean;
  missingMaterialsCount: number;
  estimatedTimeMinutes: number;
  task: Task;
  vehicleArchive: VehicleArchive;
  quoteHistory: QuoteHistory;
  financeDocuments: FinanceDocuments;
  unlockCondition?: string;
}

export interface LevelGroup {
  id: string;
  position: Position;
  name: string;
  description: string;
  levels: Level[];
}
