import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ChartCard({
  title,
  description,
  children,
  right,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card p-5 flex flex-col animate-slide-up', className)}>
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {right}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}
