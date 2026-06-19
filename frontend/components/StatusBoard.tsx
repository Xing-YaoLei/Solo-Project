'use client';

import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  ShoppingCart,
  X,
} from 'lucide-react';

export interface StatusBoardItem {
  key: string;
  label: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan' | 'orange';
  onClick?: () => void;
  active?: boolean;
}

interface StatusBoardProps {
  items: StatusBoardItem[];
  className?: string;
  totalLabel?: string;
  showTotal?: boolean;
}

const colorClasses: Record<string, { bg: string; icon: string; text: string; border: string; hover: string }> = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-700',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-700',
    border: 'border-red-200',
    hover: 'hover:bg-red-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hover: 'hover:bg-amber-100',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
  },
  cyan: {
    bg: 'bg-cyan-50',
    icon: 'bg-cyan-100 text-cyan-600',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    hover: 'hover:bg-cyan-100',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
    text: 'text-orange-700',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100',
  },
};

const defaultIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  blue: Clock,
  green: CheckCircle,
  red: XCircle,
  amber: AlertTriangle,
  purple: Package,
  cyan: ShoppingCart,
  orange: Package,
};

export function StatusBoard({
  items,
  className,
  totalLabel = '总计',
  showTotal = true,
}: StatusBoardProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5', className)}>
      {items.map((item) => {
        const colors = colorClasses[item.color] || colorClasses.blue;
        const Icon = item.icon || defaultIcons[item.color] || Package;

        return (
          <div
            key={item.key}
            onClick={item.onClick}
            className={cn(
              'rounded-lg border p-4 transition-all',
              colors.bg,
              colors.border,
              item.onClick && `cursor-pointer ${colors.hover}`,
              item.active && 'ring-2 ring-offset-2 ring-primary-500'
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  colors.icon
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn('text-2xl font-bold', colors.text)}>
                {item.count}
              </span>
            </div>
            <p className={cn('mt-2 text-sm font-medium', colors.text)}>
              {item.label}
            </p>
          </div>
        );
      })}

      {showTotal && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-slate-700">{total}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">{totalLabel}</p>
        </div>
      )}
    </div>
  );
}

export default StatusBoard;
