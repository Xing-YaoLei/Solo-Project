'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { PRIORITY_LABELS, PRIORITY_COLORS, type Priority } from '@scenic/shared';
import { cn } from '@/lib/utils';

const priorityBadgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
  {
    variants: {
      variant: {
        default: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface PriorityBadgeProps extends VariantProps<typeof priorityBadgeVariants> {
  priority: Priority;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const label = PRIORITY_LABELS[priority];
  const color = PRIORITY_COLORS[priority];

  return (
    <span
      className={cn(priorityBadgeVariants(), className)}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
