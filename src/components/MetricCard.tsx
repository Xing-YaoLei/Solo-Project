import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/api';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  gradient: string;
  updateTime?: string;
}

export default function MetricCard({
  title,
  value,
  unit,
  change,
  changeType = 'increase',
  icon,
  gradient,
  updateTime,
}: MetricCardProps) {
  const isPositive = changeType === 'decrease';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: gradient }}
            >
              {value}
            </span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${gradient}20` }}
        >
          <div className="text-transparent bg-clip-text" style={{ backgroundImage: gradient }}>
            {icon}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-emerald-600' : 'text-orange-600'
            }`}
          >
            {isPositive ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
            <span className="text-slate-400 font-normal">较上月</span>
          </div>
        )}

        {updateTime && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDateTime(updateTime)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
