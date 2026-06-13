export enum UserRole {
  Client = 0,
  Coach = 1,
  Admin = 2
}

export enum MealType {
  Breakfast = 0,
  Lunch = 1,
  Dinner = 2,
  Snack = 3
}

export enum InterruptionStatus {
  Pending = 0,
  Processing = 1,
  Resolved = 2,
  Closed = 3
}

export enum ExportFormat {
  Csv = 0,
  Excel = 1
}

export enum NotificationType {
  CheckInInterruption = 0,
  CoachComment = 1,
  System = 2,
  Reminder = 3
}

export enum NotificationStatus {
  Unread = 0,
  Read = 1,
  Archived = 2
}

export interface User {
  id: number;
  userName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  coachId?: number;
  coachName?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: User;
}

export interface CheckInPhoto {
  id: number;
  photoUrl: string;
  description?: string;
  uploadedAt: string;
}

export interface CoachComment {
  id: number;
  coachId: number;
  coachName: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DietRecord {
  id: number;
  userId: number;
  userName: string;
  recordDate: string;
  mealType: MealType;
  foodItems: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  photos: CheckInPhoto[];
  coachComment?: CoachComment;
}

export interface BodyMeasurement {
  id: number;
  userId: number;
  userName: string;
  measureDate: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass?: number;
  bmi?: number;
  waist?: number;
  hip?: number;
  chest?: number;
  biceps?: number;
  thigh?: number;
  notes?: string;
}

export interface CoachCommentHistory {
  id: number;
  oldValue: string;
  newValue: string;
  changedBy: number;
  changedByName: string;
  changedAt: string;
}

export interface BodyFatChange {
  startBodyFat: number;
  endBodyFat: number;
  change: number;
  changePercentage: number;
  startWeight: number;
  endWeight: number;
  weightChange: number;
}

export interface MonthlyReview {
  userId: number;
  userName: string;
  year: number;
  month: number;
  bodyFatChange: BodyFatChange;
  monthlyMeasurements: BodyMeasurement[];
  checkInCount: number;
  missedDays: number;
  adherenceRate: number;
}

export interface InterruptionLog {
  id: number;
  actionType: string;
  reason?: string;
  actionTaken?: string;
  closedAt?: string;
  operatorId?: number;
  operatorName: string;
  createdAt: string;
  remarks?: string;
}

export interface CheckInInterruption {
  id: number;
  userId: number;
  userName: string;
  coachId?: number;
  coachName?: string;
  startDate: string;
  endDate?: string;
  missedDays: number;
  status: InterruptionStatus;
  reason?: string;
  actionTaken?: string;
  closedAt?: string;
  closedBy?: number;
  logs: InterruptionLog[];
}

export interface ExportRecord {
  id: number;
  format: ExportFormat;
  fileName: string;
  filterCriteria: string;
  generatedAt: string;
  operatorId: number;
  operatorName: string;
  fileSize: number;
}

export interface Notification {
  id: number;
  userId: number;
  userName: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: number;
  relatedType?: string;
  status: NotificationStatus;
  readAt?: string;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
}
