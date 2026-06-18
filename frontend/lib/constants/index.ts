import { TaskType, TaskStatus, UserRole } from "@/lib/types";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.NODE_ACCEPTANCE]: "节点验收",
  [TaskType.DESIGN_CHANGE]: "设计变更",
  [TaskType.MATERIAL_REPLACEMENT]: "材料替换",
  [TaskType.ADDITIONAL_QUOTE]: "增项报价",
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  [TaskType.NODE_ACCEPTANCE]: "bg-blue-100 text-blue-700",
  [TaskType.DESIGN_CHANGE]: "bg-purple-100 text-purple-700",
  [TaskType.MATERIAL_REPLACEMENT]: "bg-orange-100 text-orange-700",
  [TaskType.ADDITIONAL_QUOTE]: "bg-green-100 text-green-700",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: "待确认",
  [TaskStatus.APPROVED]: "已确认",
  [TaskStatus.REJECTED]: "已拒绝",
  [TaskStatus.DISPUTED]: "有争议",
  [TaskStatus.OVERDUE]: "逾期",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [TaskStatus.APPROVED]: "bg-green-100 text-green-700",
  [TaskStatus.REJECTED]: "bg-red-100 text-red-700",
  [TaskStatus.DISPUTED]: "bg-orange-100 text-orange-700",
  [TaskStatus.OVERDUE]: "bg-gray-100 text-gray-700",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.OWNER]: "业主",
  [UserRole.FOREMAN]: "工长",
  [UserRole.DESIGNER]: "设计师",
  [UserRole.SUPERVISOR]: "监理",
  [UserRole.PROJECT_MANAGER]: "项目经理",
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.OWNER]: "bg-blue-100 text-blue-700",
  [UserRole.FOREMAN]: "bg-green-100 text-green-700",
  [UserRole.DESIGNER]: "bg-purple-100 text-purple-700",
  [UserRole.SUPERVISOR]: "bg-orange-100 text-orange-700",
  [UserRole.PROJECT_MANAGER]: "bg-indigo-100 text-indigo-700",
};

export const KANBAN_COLUMNS = [
  { status: TaskStatus.PENDING, label: "待确认", color: "yellow" },
  { status: TaskStatus.APPROVED, label: "已确认", color: "green" },
  { status: TaskStatus.REJECTED, label: "已拒绝", color: "red" },
  { status: TaskStatus.DISPUTED, label: "有争议", color: "orange" },
  { status: TaskStatus.OVERDUE, label: "逾期", color: "gray" },
];
