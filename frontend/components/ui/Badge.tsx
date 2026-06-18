import { TaskStatus, TaskType, UserRole } from "@/lib/types";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("badge", TASK_STATUS_COLORS[status], className)}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

interface TaskTypeBadgeProps {
  type: TaskType;
  className?: string;
}

export function TaskTypeBadge({ type, className }: TaskTypeBadgeProps) {
  return (
    <span className={cn("badge", TASK_TYPE_COLORS[type], className)}>
      {TASK_TYPE_LABELS[type]}
    </span>
  );
}

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span className={cn("badge", USER_ROLE_COLORS[role], className)}>
      {USER_ROLE_LABELS[role]}
    </span>
  );
}
