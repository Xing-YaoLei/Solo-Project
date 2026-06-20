'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { STATUS_LABELS, STATUS_COLORS, type ComplaintStatus } from '@scenic/shared';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: ComplaintStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status];
  const color = STATUS_COLORS[status];

  return (
    <span
      className={cn(statusBadgeVariants(), className)}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}
