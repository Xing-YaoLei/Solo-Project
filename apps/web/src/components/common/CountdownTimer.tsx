'use client';

import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: Date | string;
  warningThresholdHours?: number;
  showIcon?: boolean;
  className?: string;
}

export default function CountdownTimer({
  deadline,
  warningThresholdHours = 1,
  showIcon = true,
  className,
}: CountdownTimerProps) {
  const { formatted, isExpired, isWarning } = useCountdown(deadline, warningThresholdHours);

  const colorClass = isExpired
    ? 'text-danger'
    : isWarning
    ? 'text-warning countdown-warning'
    : 'text-slate-600';

  const Icon = isExpired || isWarning ? AlertTriangle : Clock;

  return (
    <div className={cn('inline-flex items-center gap-1 text-sm', colorClass, className)}>
      {showIcon && <Icon className="w-4 h-4" />}
      <span className="font-medium">{formatted}</span>
    </div>
  );
}
