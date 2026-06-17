import { type ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  action,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
