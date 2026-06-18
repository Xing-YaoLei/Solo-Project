export enum TaskType {
  NODE_ACCEPTANCE = "NODE_ACCEPTANCE",
  DESIGN_CHANGE = "DESIGN_CHANGE",
  MATERIAL_REPLACEMENT = "MATERIAL_REPLACEMENT",
  ADDITIONAL_QUOTE = "ADDITIONAL_QUOTE",
}

export enum TaskStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISPUTED = "DISPUTED",
  OVERDUE = "OVERDUE",
}

export enum UserRole {
  OWNER = "OWNER",
  FOREMAN = "FOREMAN",
  DESIGNER = "DESIGNER",
  SUPERVISOR = "SUPERVISOR",
  PROJECT_MANAGER = "PROJECT_MANAGER",
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  phone?: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  status: "IN_PROGRESS" | "COMPLETED" | "PAUSED";
  startDate: string;
  expectedEndDate: string;
  totalBudget: number;
  currentBudget: number;
  foreman?: User;
  designer?: User;
  supervisor?: User;
  projectManager?: User;
}

export interface QuoteVersion {
  id: string;
  taskId: string;
  version: number;
  amount: number;
  description: string;
  items: QuoteItem[];
  createdAt: string;
  createdBy: User;
}

export interface QuoteItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface ChatMessage {
  id: string;
  taskId: string;
  sender: User;
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface TaskImage {
  id: string;
  url: string;
  type: "BEFORE" | "AFTER" | "REFERENCE";
  description?: string;
  uploadedAt: string;
  uploadedBy: User;
}

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description: string;
  projectId: string;
  project: Project;
  createdBy: User;
  assignees: User[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  images: TaskImage[];
  quoteVersions?: QuoteVersion[];
  chatMessages: ChatMessage[];
  reworkReason?: string;
  reworkCount: number;
  amount?: number;
  nodeName?: string;
  designChangeReason?: string;
  oldMaterial?: string;
  newMaterial?: string;
}

export interface Reminder {
  id: string;
  type: "OVERDUE" | "MISSING_DOCUMENTS" | "PENDING_TASK" | "DISPUTE";
  title: string;
  description: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  isRead: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface Statistics {
  totalTasks: number;
  pendingTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  disputedTasks: number;
  overdueTasks: number;
  averageConfirmationTime: number;
  totalUnconfirmedAmount: number;
  reworkReasons: { reason: string; count: number }[];
  confirmationTimeByType: { type: TaskType; averageDays: number }[];
}
