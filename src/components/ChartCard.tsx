import { ReactNode } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../utils/api';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  updateTime?: string;
  children: ReactNode;
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function ChartCard({
  title,
  subtitle,
  updateTime,
  children,
  className = '',
  onRefresh,
  isLoading = false,
}: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-200 ${className}`}
      style={{ animationDelay: '0.1s' }}
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {updateTime && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>更新于 {formatDateTime(updateTime)}</span>
            </div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
