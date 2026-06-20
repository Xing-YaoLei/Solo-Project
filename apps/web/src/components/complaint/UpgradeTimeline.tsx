'use client';

import dayjs from 'dayjs';
import { TrendingUp, User } from 'lucide-react';
import type { UpgradeRecord } from '@scenic/shared';

interface UpgradeTimelineProps {
  records: UpgradeRecord[];
}

export default function UpgradeTimeline({ records }: UpgradeTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">暂无升级记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-2.5 top-1 bottom-1 w-px bg-slate-200" />
      <div className="space-y-4">
        {records.map((record, index) => (
          <div key={record.id} className="relative pl-8">
            <div
              className={`absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                index === 0
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <span className="text-xs font-medium">{index + 1}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    Lv.{record.fromLevel} → Lv.{record.toLevel}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {dayjs(record.createdAt).format('MM-DD HH:mm')}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{record.reason}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3 h-3" />
                操作人：ID {record.operatorId.slice(0, 8)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
