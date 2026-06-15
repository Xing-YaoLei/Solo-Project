import type {
  RoleType, SemesterType, WeekDay, RoomType, ConflictLevel,
  ConflictStatus, ApprovalStatus, CourseStatus, ConflictType
} from '../types';

export const roleLabels: Record<RoleType, string> = {
  Administrator: '系统管理员',
  Teacher: '教师',
  Student: '学生',
  DepartmentHead: '系主任',
  AcademicAffairs: '教务处',
  Dean: '院长',
};

export const semesterTypeLabels: Record<SemesterType, string> = {
  Spring: '春季学期',
  Autumn: '秋季学期',
  Summer: '夏季学期',
};

export const weekDayLabels: Record<WeekDay, string> = {
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
  7: '星期日',
};

export const roomTypeLabels: Record<RoomType, string> = {
  GeneralClassroom: '普通教室',
  MultimediaClassroom: '多媒体教室',
  Laboratory: '实验室',
  ComputerLab: '计算机房',
  Gymnasium: '体育馆',
  Auditorium: '礼堂',
  MeetingRoom: '会议室',
};

export const conflictLevelLabels: Record<ConflictLevel, string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Critical: '严重',
};

export const conflictLevelColors: Record<ConflictLevel, string> = {
  Low: 'green',
  Medium: 'gold',
  High: 'orange',
  Critical: 'red',
};

export const conflictStatusLabels: Record<ConflictStatus, string> = {
  Pending: '待处理',
  UnderReview: '处理中',
  Resolved: '已解决',
  Escalated: '已升级',
  Rejected: '已驳回',
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  Draft: '草稿',
  Pending: '待审核',
  Approved: '已通过',
  Rejected: '已拒绝',
  NeedsRevision: '需修改',
};

export const approvalStatusColors: Record<ApprovalStatus, string> = {
  Draft: 'default',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  NeedsRevision: 'processing',
};

export const courseStatusLabels: Record<CourseStatus, string> = {
  Draft: '草稿',
  Published: '已发布',
  Scheduled: '已排课',
  InProgress: '进行中',
  Completed: '已完成',
  Cancelled: '已取消',
};

export const conflictTypeLabels: Record<ConflictType, string> = {
  ClassroomConflict: '教室冲突',
  TeacherConflict: '教师冲突',
  StudentConflict: '学生冲突',
  TimeSlotOverlap: '时段重叠',
  EquipmentShortage: '设备不足',
  CapacityExceeded: '容量超限',
};

export const priorityLabels: Record<string, string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Urgent: '紧急',
};

export const priorityColors: Record<string, string> = {
  Low: 'green',
  Medium: 'blue',
  High: 'orange',
  Urgent: 'red',
};

export const todoTypeLabels: Record<string, string> = {
  ConflictResolution: '冲突处理',
  ScheduleApproval: '排课审核',
  ApplicationReview: '申请审核',
  GradeEntry: '成绩录入',
  Other: '其他',
};
