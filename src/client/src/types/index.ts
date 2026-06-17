export enum ScheduleStatus {
  Draft = 0,
  Submitted = 10,
  UnderReview = 20,
  ReviewApproved = 30,
  ReviewRejected = 35,
  InProgress = 40,
  Processing = 45,
  ExceptionOccurred = 50,
  Completed = 60,
  UnderReviewPost = 70,
  Reviewed = 80,
  Closed = 90,
  Archived = 100,
}

export enum CareLevelType {
  Independent = 1,
  SemiAssisted = 2,
  FullAssisted = 3,
  Intensive = 4,
  Special = 5,
}

export enum ShiftType {
  Morning = 1,
  Afternoon = 2,
  Night = 3,
  FullDay = 4,
}

export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
}

export enum BedStatus {
  Available = 0,
  Occupied = 1,
  Reserved = 2,
  Maintenance = 3,
  Cleaning = 4,
}

export enum ExceptionType {
  Fall = 1,
  MedicationError = 2,
  Missing = 3,
  PhysicalDiscomfort = 4,
  EquipmentFailure = 5,
  Other = 99,
}

export enum ExceptionSeverity {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum ExceptionCloseType {
  NormalClose = 1,
  SupplementRequired = 2,
  Escalation = 3,
}

export enum ExceptionStatus {
  Reported = 0,
  Investigating = 10,
  Handling = 20,
  PendingSupplement = 25,
  Escalated = 30,
  Resolved = 50,
  ClosedNormal = 60,
  ClosedWithSupplement = 65,
  ClosedEscalated = 70,
}

export enum ReviewType {
  ScheduleReview = 1,
  ExceptionReview = 2,
  PostProcessReview = 3,
}

export enum ReviewResult {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  ConditionalApproved = 3,
}

export enum SourceType {
  SelfRegistration = 1,
  HospitalReferral = 2,
  CommunityReferral = 3,
  FamilyIntroduction = 4,
  OnlineBooking = 5,
  Other = 99,
}

export enum CareStandard {
  NotEvaluated = 0,
  BelowStandard = 1,
  MeetsStandard = 2,
  ExceedsStandard = 3,
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface CareLevelDto {
  id: string;
  levelType: CareLevelType;
  levelTypeText: string;
  levelName: string;
  description?: string;
  careItems?: string;
  serviceStandards?: string;
  dailyCareHours: number;
  nurseRatio: number;
  monthlyFee?: number;
}

export interface BedDto {
  id: string;
  bedNumber: string;
  roomNumber?: string;
  floor?: string;
  building?: string;
  description?: string;
  status: BedStatus;
  statusText: string;
  equipmentInfo?: string;
}

export interface MedicationDto {
  id: string;
  elderId: string;
  drugName: string;
  genericName?: string;
  specification?: string;
  dosage?: string;
  frequency?: string;
  administrationRoute?: string;
  usageInstructions?: string;
  startDate?: string;
  endDate?: string;
  prescribingDoctor?: string;
  precautions?: string;
  sideEffects?: string;
  remainingQuantity?: number;
  storageConditions?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateMedicationDto {
  elderId: string;
  drugName: string;
  genericName?: string;
  specification?: string;
  dosage?: string;
  frequency?: string;
  administrationRoute?: string;
  usageInstructions?: string;
  startDate?: string;
  endDate?: string;
  prescribingDoctor?: string;
  precautions?: string;
  sideEffects?: string;
  remainingQuantity?: number;
  storageConditions?: string;
  createdBy: string;
}

export interface ReviewRecordDto {
  id: string;
  reviewType: ReviewType;
  reviewTypeText: string;
  scheduleId?: string;
  exceptionRecordId?: string;
  reviewResult: ReviewResult;
  reviewResultText: string;
  reviewComment?: string;
  improvementSuggestions?: string;
  careStandardRating?: CareStandard;
  careStandardRatingText?: string;
  reviewer: string;
  reviewerDepartment?: string;
  reviewDueDate?: string;
  reviewedAt: string;
  isFollowUpRequired: boolean;
  followUpDueDate?: string;
  followUpRequirements?: string;
  followUpCompleted: boolean;
}

export interface ElderListDto {
  id: string;
  name: string;
  gender: Gender;
  genderText: string;
  dateOfBirth: string;
  age: number;
  idCardNumber?: string;
  phoneNumber?: string;
  careLevelName?: string;
  careLevelType?: CareLevelType;
  sourceType: SourceType;
  sourceTypeText: string;
  isActive: boolean;
  createdAt: string;
}

export interface ElderDetailDto {
  id: string;
  name: string;
  gender: Gender;
  genderText: string;
  dateOfBirth: string;
  age: number;
  idCardNumber?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  medicalHistory?: string;
  allergyInfo?: string;
  dietaryRequirements?: string;
  notes?: string;
  sourceType: SourceType;
  sourceTypeText: string;
  sourceDetail?: string;
  careLevelId?: string;
  careLevel?: CareLevelDto;
  medications: MedicationDto[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateElderDto {
  name: string;
  gender: Gender;
  dateOfBirth: string;
  idCardNumber?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  medicalHistory?: string;
  allergyInfo?: string;
  dietaryRequirements?: string;
  notes?: string;
  sourceType: SourceType;
  sourceDetail?: string;
  careLevelId?: string;
  createdBy: string;
}

export interface UpdateElderDto {
  name?: string;
  gender?: Gender;
  dateOfBirth?: string;
  idCardNumber?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  medicalHistory?: string;
  allergyInfo?: string;
  dietaryRequirements?: string;
  notes?: string;
  sourceType?: SourceType;
  sourceDetail?: string;
  careLevelId?: string;
  isActive?: boolean;
  updatedBy: string;
}

export interface ElderQueryDto {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
  gender?: Gender;
  careLevelType?: CareLevelType;
  sourceType?: SourceType;
  isActive?: boolean;
}

export interface ScheduleStatusHistoryDto {
  id: string;
  previousStatus: ScheduleStatus;
  previousStatusText: string;
  newStatus: ScheduleStatus;
  newStatusText: string;
  changeReason?: string;
  changedAt: string;
  changedBy: string;
}

export interface ScheduleListDto {
  id: string;
  scheduleNo: string;
  elderId: string;
  elderName: string;
  elderAge: number;
  careLevelName?: string;
  bedNumber?: string;
  startDate: string;
  endDate: string;
  shiftType: ShiftType;
  primaryNurse?: string;
  status: ScheduleStatus;
  statusText: string;
  careStandard: CareStandard;
  createdAt: string;
  createdBy: string;
  hasExceptions: boolean;
  exceptionCount: number;
}

export interface ScheduleDetailDto {
  id: string;
  scheduleNo: string;
  elderId: string;
  elder: ElderDetailDto;
  bedId?: string;
  bed?: BedDto;
  careLevelId?: string;
  careLevel?: CareLevelDto;
  startDate: string;
  endDate: string;
  shiftType: ShiftType;
  primaryNurse?: string;
  secondaryNurse?: string;
  doctorOnDuty?: string;
  carePlan?: string;
  specialRequirements?: string;
  nutritionPlan?: string;
  rehabilitationPlan?: string;
  dailySchedule?: string;
  status: ScheduleStatus;
  statusText: string;
  processingNotes?: string;
  reviewComments?: string;
  postReviewSummary?: string;
  careStandard: CareStandard;
  medications: MedicationDto[];
  reviewRecords: ReviewRecordDto[];
  exceptionRecords: ExceptionRecordListDto[];
  statusHistories: ScheduleStatusHistoryDto[];
  createdAt: string;
  createdBy: string;
  submittedAt?: string;
  submittedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  startedAt?: string;
  startedBy?: string;
  completedAt?: string;
  completedBy?: string;
  postReviewedAt?: string;
  postReviewedBy?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface CreateScheduleDto {
  elderId: string;
  bedId?: string;
  careLevelId?: string;
  startDate: string;
  endDate: string;
  shiftType: ShiftType;
  primaryNurse?: string;
  secondaryNurse?: string;
  doctorOnDuty?: string;
  carePlan?: string;
  specialRequirements?: string;
  nutritionPlan?: string;
  rehabilitationPlan?: string;
  dailySchedule?: string;
  createdBy: string;
}

export interface UpdateScheduleDto {
  bedId?: string;
  careLevelId?: string;
  startDate?: string;
  endDate?: string;
  shiftType?: ShiftType;
  primaryNurse?: string;
  secondaryNurse?: string;
  doctorOnDuty?: string;
  carePlan?: string;
  specialRequirements?: string;
  nutritionPlan?: string;
  rehabilitationPlan?: string;
  dailySchedule?: string;
  processingNotes?: string;
  updatedBy: string;
}

export interface ScheduleStatusChangeDto {
  newStatus?: ScheduleStatus;
  changeReason?: string;
  reviewComments?: string;
  reviewResult?: ReviewResult;
  careStandard?: CareStandard;
  postReviewSummary?: string;
  operator: string;
}

export interface ScheduleQueryDto {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
  status?: ScheduleStatus;
  elderId?: string;
  careLevelId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  primaryNurse?: string;
  hasExceptions?: boolean;
  careStandard?: CareStandard;
}

export interface ExceptionStatusHistoryDto {
  id: string;
  previousStatus: ExceptionStatus;
  previousStatusText: string;
  newStatus: ExceptionStatus;
  newStatusText: string;
  changeReason?: string;
  changedAt: string;
  changedBy: string;
}

export interface ExceptionAttachmentDto {
  id: string;
  exceptionRecordId: string;
  fileName: string;
  fileType?: string;
  filePath?: string;
  fileSize?: number;
  description?: string;
  attachmentCategory?: string;
  createdAt: string;
  createdBy: string;
}

export interface ExceptionRecordListDto {
  id: string;
  exceptionNo: string;
  scheduleId: string;
  scheduleNo?: string;
  elderId: string;
  elderName: string;
  exceptionType: ExceptionType;
  exceptionTypeText: string;
  severity: ExceptionSeverity;
  severityText: string;
  status: ExceptionStatus;
  statusText: string;
  closeType?: ExceptionCloseType;
  closeTypeText?: string;
  occurredAt: string;
  occurredLocation?: string;
  description: string;
  assignedTo?: string;
  createdAt: string;
  createdBy: string;
  closedAt?: string;
  closedBy?: string;
}

export interface ExceptionRecordDetailDto {
  id: string;
  exceptionNo: string;
  scheduleId: string;
  scheduleNo?: string;
  elderId: string;
  elder?: ElderDetailDto;
  exceptionType: ExceptionType;
  exceptionTypeText: string;
  severity: ExceptionSeverity;
  severityText: string;
  status: ExceptionStatus;
  statusText: string;
  closeType?: ExceptionCloseType;
  closeTypeText?: string;
  occurredAt: string;
  occurredLocation?: string;
  description: string;
  fallSceneDescription?: string;
  fallCause?: string;
  fallHeight?: string;
  injuredPart?: string;
  initialSymptoms?: string;
  onSiteMeasures?: string;
  investigationResult?: string;
  handlingMeasures?: string;
  treatmentResult?: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  preventiveMeasures?: string;
  supplementMaterialDescription?: string;
  supplementRequirement?: string;
  supplementDueDate?: string;
  supplementReceived: boolean;
  supplementReceivedAt?: string;
  supplementReceivedBy?: string;
  escalationReason?: string;
  escalatedAt?: string;
  escalatedBy?: string;
  escalatedTo?: string;
  escalationResponse?: string;
  finalConclusion?: string;
  lessonsLearned?: string;
  reviewRecords: ReviewRecordDto[];
  attachments: ExceptionAttachmentDto[];
  statusHistories: ExceptionStatusHistoryDto[];
  createdAt: string;
  createdBy: string;
  reportedAt?: string;
  reportedBy?: string;
  assignedAt?: string;
  assignedTo?: string;
  assignedBy?: string;
  investigationStartedAt?: string;
  investigator?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface CreateExceptionRecordDto {
  scheduleId: string;
  elderId: string;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  occurredAt: string;
  occurredLocation?: string;
  description: string;
  fallSceneDescription?: string;
  fallCause?: string;
  fallHeight?: string;
  injuredPart?: string;
  initialSymptoms?: string;
  onSiteMeasures?: string;
  createdBy: string;
}

export interface UpdateExceptionRecordDto {
  severity?: ExceptionSeverity;
  occurredAt?: string;
  occurredLocation?: string;
  description?: string;
  fallSceneDescription?: string;
  fallCause?: string;
  fallHeight?: string;
  injuredPart?: string;
  initialSymptoms?: string;
  onSiteMeasures?: string;
  investigationResult?: string;
  handlingMeasures?: string;
  treatmentResult?: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  preventiveMeasures?: string;
  finalConclusion?: string;
  lessonsLearned?: string;
  updatedBy: string;
}

export interface ExceptionStatusChangeDto {
  newStatus?: ExceptionStatus;
  changeReason?: string;
  closeType?: ExceptionCloseType;
  supplementRequirement?: string;
  supplementDueDate?: string;
  supplementMaterialDescription?: string;
  supplementReceived?: boolean;
  escalationReason?: string;
  escalatedTo?: string;
  escalationResponse?: string;
  assignedTo?: string;
  investigator?: string;
  operator: string;
}

export interface ExceptionQueryDto {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
  exceptionType?: ExceptionType;
  severity?: ExceptionSeverity;
  status?: ExceptionStatus;
  closeType?: ExceptionCloseType;
  elderId?: string;
  scheduleId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  assignedTo?: string;
  includeClosed?: boolean;
}

export interface ScheduleStatusCountItem {
  status: ScheduleStatus;
  statusText: string;
  count: number;
  percentage: number;
}

export interface DailyScheduleCountItem {
  date: string;
  count: number;
}

export interface ScheduleStatisticsDto {
  totalCount: number;
  draftCount: number;
  underReviewCount: number;
  inProgressCount: number;
  exceptionOccurredCount: number;
  completedCount: number;
  closedCount: number;
  statusBreakdown: ScheduleStatusCountItem[];
  dailyTrend: DailyScheduleCountItem[];
}

export interface ExceptionSeverityCountItem {
  severity: ExceptionSeverity;
  severityText: string;
  count: number;
  percentage: number;
}

export interface ExceptionTypeCountItem {
  type: ExceptionType;
  typeText: string;
  count: number;
  percentage: number;
}

export interface DailyExceptionCountItem {
  date: string;
  count: number;
}

export interface ExceptionStatisticsDto {
  totalCount: number;
  fallCount: number;
  openCount: number;
  closedNormalCount: number;
  closedWithSupplementCount: number;
  closedEscalatedCount: number;
  severityBreakdown: ExceptionSeverityCountItem[];
  typeBreakdown: ExceptionTypeCountItem[];
  dailyTrend: DailyExceptionCountItem[];
}

export interface CareStandardCountItem {
  standard: CareStandard;
  standardText: string;
  count: number;
  percentage: number;
}

export interface CareStandardStatisticsDto {
  totalEvaluated: number;
  belowStandardCount: number;
  meetsStandardCount: number;
  exceedsStandardCount: number;
  breakdown: CareStandardCountItem[];
}

export interface SourceCountItem {
  source: SourceType;
  sourceText: string;
  count: number;
  percentage: number;
}

export interface SourceStatisticsDto {
  totalElders: number;
  breakdown: SourceCountItem[];
}

export interface HandlerCountItem {
  handlerName: string;
  totalProcessed: number;
  exceptionHandled: number;
}

export interface HandlerEfficiencyItem {
  handlerName: string;
  totalCases: number;
  closedCases: number;
  averageHandlingHours: number;
  closureRate: number;
}

export interface HandlerStatisticsDto {
  topHandlers: HandlerCountItem[];
  handlerEfficiency: HandlerEfficiencyItem[];
}

export interface FallCauseCountItem {
  cause: string;
  count: number;
  percentage: number;
}

export interface FallLocationCountItem {
  location: string;
  count: number;
  percentage: number;
}

export interface FallInjuryCountItem {
  bodyPart: string;
  count: number;
  percentage: number;
}

export interface ExceptionCauseStatisticsDto {
  topFallCauses: FallCauseCountItem[];
  fallLocationBreakdown: FallLocationCountItem[];
  injuryPartBreakdown: FallInjuryCountItem[];
}

export interface StatisticsDto {
  scheduleStatistics: ScheduleStatisticsDto;
  exceptionStatistics: ExceptionStatisticsDto;
  careStandardStatistics: CareStandardStatisticsDto;
  sourceStatistics: SourceStatisticsDto;
  handlerStatistics: HandlerStatisticsDto;
  exceptionCauseStatistics: ExceptionCauseStatisticsDto;
}

export interface StatisticsQueryDto {
  startDate?: string;
  endDate?: string;
  careLevelId?: string;
  handlerName?: string;
}
