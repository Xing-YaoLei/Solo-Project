export enum AppointmentStatus {
  Scheduled = 0,
  Confirmed = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
  NoShow = 5,
}

export enum RiskLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum Gender {
  Male = 0,
  Female = 1,
  Other = 2,
}

export enum FollowUpStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum FollowUpType {
  Phone = 0,
  SMS = 1,
  WeChat = 2,
  Email = 3,
  InPerson = 4,
}

export enum TreatmentStatus {
  Planned = 0,
  InProgress = 1,
  Completed = 2,
  Suspended = 3,
}

export enum BillingStatus {
  Unpaid = 0,
  PartialPaid = 1,
  Paid = 2,
  Refunded = 3,
}

export enum MemberLevel {
  Regular = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3,
}

export interface PatientSummary {
  id: number;
  patientNo: string;
  name: string;
  phone?: string;
  memberLevel: MemberLevel;
  noShowCount: number;
  totalAppointments: number;
  riskLevel: RiskLevel;
}

export interface Patient {
  id: number;
  patientNo: string;
  name: string;
  phone?: string;
  email?: string;
  gender: Gender;
  dateOfBirth?: string;
  address?: string;
  memberLevel: MemberLevel;
  medicalHistory?: string;
  allergyHistory?: string;
  remarks?: string;
  createdAt: string;
  noShowCount: number;
  totalAppointments: number;
}

export interface AppointmentList {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  memberLevel: MemberLevel;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  subject?: string;
  status: AppointmentStatus;
  riskLevel: RiskLevel;
  doctorName?: string;
  chairNumber?: string;
  patientNoShowCount: number;
  hasTreatmentPlan: boolean;
  hasFollowUpTasks: boolean;
  hasImages: boolean;
  hasBilling: boolean;
}

export interface AppointmentDetail {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientGender: Gender;
  memberLevel: MemberLevel;
  patientNoShowCount: number;
  patientTotalAppointments: number;
  treatmentPlanId?: number;
  treatmentPlanName?: string;
  treatmentPlanStatus?: TreatmentStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  subject?: string;
  description?: string;
  status: AppointmentStatus;
  doctorName?: string;
  assistantName?: string;
  chairNumber?: string;
  riskLevel: RiskLevel;
  communicationNotes?: string;
  reviewComments?: string;
  planItems?: TreatmentPlanItem[];
  followUpTasks?: FollowUpTask[];
  imageAttachments?: ImageAttachment[];
  billingRecords?: BillingRecord[];
}

export interface TreatmentPlanItem {
  id: number;
  itemName: string;
  description?: string;
  sequence: number;
  price: number;
  quantity: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface TreatmentPlan {
  id: number;
  patientId: number;
  patientName: string;
  planName: string;
  description?: string;
  status: TreatmentStatus;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  estimatedCost: number;
  actualCost: number;
  doctorName?: string;
  assistantName?: string;
  totalVisits?: number;
  completedVisits: number;
  notes?: string;
  createdAt: string;
  planItems: TreatmentPlanItem[];
}

export interface FollowUpTask {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  appointmentId?: number;
  treatmentPlanId?: number;
  type: FollowUpType;
  status: FollowUpStatus;
  title: string;
  content?: string;
  result?: string;
  scheduledDate?: string;
  completedAt?: string;
  assignedTo?: string;
  completedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface ImageAttachment {
  id: number;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  treatmentPlanId?: number;
  fileName: string;
  filePath?: string;
  fileType?: string;
  fileSize: number;
  description?: string;
  category?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface BillingItem {
  id: number;
  itemName: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface BillingRecord {
  id: number;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  treatmentPlanId?: number;
  invoiceNo: string;
  billingDate: string;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BillingStatus;
  paymentMethod?: string;
  remarks?: string;
  cashier?: string;
  createdAt: string;
  billingItems: BillingItem[];
}

export interface NoShowAppointment {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  memberLevel: MemberLevel;
  appointmentDate: string;
  startTime: string;
  riskLevel: RiskLevel;
  patientNoShowCount: number;
  communicationNotes?: string;
  reviewComments?: string;
  hasFollowUp: boolean;
}

export interface AppointmentRate {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  noShowAppointments: number;
  cancelledAppointments: number;
  attendanceRate: number;
  noShowRate: number;
  reAppointmentRate: number;
}

export interface ReAppointmentTrend {
  period: string;
  startDate: string;
  endDate: string;
  totalPatients: number;
  reAppointmentPatients: number;
  reAppointmentRate: number;
  newPatients: number;
  totalAppointments: number;
}

export interface DashboardStats {
  todayAppointments: number;
  todayCompleted: number;
  todayNoShow: number;
  pendingFollowUps: number;
  totalPatients: number;
  activeTreatmentPlans: number;
  todayRevenue: number;
  monthlyReAppointmentRate: number;
  weeklyTrend?: AppointmentRate[];
  highRiskNoShows?: NoShowAppointment[];
}
