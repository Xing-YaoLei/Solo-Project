'use client';

import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: Date | string;
  icon?: ReactNode;
  color?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export default function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm">
        暂无记录
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative pl-10">
            <div
              className={cn(
                'absolute left-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white shadow-sm',
                item.color ? `bg-[${item.color}]` : index === 0 ? 'bg-primary' : 'bg-slate-400'
              )}
              style={{ backgroundColor: item.color || (index === 0 ? '#1e3a5f' : '#94a3b8') }}
            >
              {item.icon || (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="py-0.5">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-slate-800">
                  {item.title}
                </h4>
                <span className="text-xs text-slate-400">
                  {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-slate-600">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
