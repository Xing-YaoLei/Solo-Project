export interface Task {
  id: string;
  title: string;
  description: string;
  clientName: string;
  houseType: string;
  houseArea: number;
  difficulty: number;
  baseReward: number;
  timeLimit: number;
  clueIds: string[];
  documentId: string;
  approvalNodeIds: string[];
  unlocked: boolean;
}

export interface Clue {
  id: string;
  title: string;
  content: string;
  clueType: 'room' | 'material' | 'process' | 'price' | 'risk';
  isKey: boolean;
  relatedDocumentItemIds?: string[];
}

export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  scoreDelta: number;
  moneyDelta: number;
  nextNodeId?: string;
  triggerMismatch?: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  correctQuantity?: number;
  correctUnitPrice?: number;
  tolerance: number;
  isEditable: boolean;
  description?: string;
}

export interface Document {
  id: string;
  title: string;
  items: DocumentItem[];
  totalAmount: number;
  correctTotalAmount?: number;
}

export interface ApprovalNode {
  id: string;
  title: string;
  description: string;
  nodeType: 'quantity' | 'price' | 'process' | 'final';
  choices: Choice[];
  requiresDocumentReview: boolean;
  minScoreToPass: number;
}
