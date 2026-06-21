import * as React from 'react';
import { cn } from '@/lib/utils';
import { getAttendanceStatusLabel, getConflictStatusLabel, getReminderStatusLabel, getReminderTypeLabel } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary-100 text-primary-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      danger: 'bg-red-100 text-red-700',
      info: 'bg-teal-100 text-teal-700',
      secondary: 'bg-slate-100 text-slate-700',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

function AttendanceBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    ATTENDED: 'success',
    ABSENT: 'danger',
    POSTPONED: 'warning',
    CANCELLED: 'secondary',
  };

  return (
    <Badge variant={variantMap[status] || 'default'}>
      {getAttendanceStatusLabel(status)}
    </Badge>
  );
}

function ConflictBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    PENDING: 'warning',
    RESOLVED: 'success',
    ESCALATED: 'danger',
  };

  return (
    <Badge variant={variantMap[status] || 'default'}>
      {getConflictStatusLabel(status)}
    </Badge>
  );
}

function ReminderStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    SENT: 'info',
    OPENED: 'success',
    FAILED: 'danger',
  };

  return (
    <Badge variant={variantMap[status] || 'default'}>
      {getReminderStatusLabel(status)}
    </Badge>
  );
}

function ReminderTypeBadge({ type }: { type: string }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    EMAIL: 'default',
    SMS: 'secondary',
    CALENDAR: 'info',
  };

  return (
    <Badge variant={variantMap[type] || 'default'}>
      {getReminderTypeLabel(type)}
    </Badge>
  );
}

export { Badge, AttendanceBadge, ConflictBadge, ReminderStatusBadge, ReminderTypeBadge };
