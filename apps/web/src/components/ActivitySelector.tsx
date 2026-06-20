'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Activity } from '@ticket/prisma';
import { ChevronDown, Plus, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/utils';

export default function ActivitySelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Activity[]>([]);
  const [current, setCurrent] = useState<string>('demo-activity-001');

  useEffect(() => {
    api.get<Activity[]>('/activities').then((data) => {
      setItems(data);
      if (!current && data.length) {
        setCurrent(data[0].id);
      }
    });
  }, [current]);

  const currentItem = items.find((i) => i.id === current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors min-w-[320px]"
      >
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 truncate">
            {currentItem?.name || '选择活动'}
          </div>
          <div className="text-xs text-slate-500">
            {currentItem ? `${fmtDate(currentItem.startTime)} · ${currentItem.venue}` : '暂无活动'}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">选择管理活动</span>
            <button className="btn-primary text-xs !px-2 !py-1" onClick={() => router.push('/activity/new')}>
              <Plus className="w-3 h-3" /> 新建
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setCurrent(a.id);
                  setOpen(false);
                }}
                className={`w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 ${
                  a.id === current ? 'bg-brand-50' : ''
                }`}
              >
                <div className="text-sm font-medium text-slate-900">{a.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {fmtDate(a.startTime)} · {a.venue}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function useActivityId() {
  return 'demo-activity-001';
}
