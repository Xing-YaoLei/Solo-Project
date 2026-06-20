'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDateTime, STATUS_STYLES, LABELS } from '@/lib/utils';

export default function TicketTypeHistory({ params }: { params: { id: string } }) {
  const [ticketType, setTicketType] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/ticket-types/${params.id}`).then(setTicketType);
    api.get(`/ticket-types/${params.id}/history`).then(setHistory);
  }, [params.id]);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/ticket-types" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 返回票种列表
      </Link>
      <div className="card p-6">
        <div className="section-title">票种状态变更历史</div>
        <div className="text-slate-600 text-sm mb-2">票种：<span className="font-semibold">{ticketType?.name || params.id}</span></div>
        <div className="text-slate-500 text-xs mb-4">所有状态变更将永久记录，可用于审计与追溯</div>
        <div className="relative border-l-2 border-slate-200 pl-6 ml-2 space-y-6">
          {history.length === 0 && <div className="text-slate-400 text-sm">暂无历史记录</div>}
          {history.map((h, i) => (
            <div key={h.id} className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-brand-500 shadow" />
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1">
                  {h.fromStatus && (
                    <>
                      <span className={STATUS_STYLES[h.fromStatus]}>{LABELS.TicketTypeStatus[h.fromStatus] || h.fromStatus}</span>
                      <span className="text-slate-300">→</span>
                    </>
                  )}
                  <span className={STATUS_STYLES[h.toStatus]}>{LABELS.TicketTypeStatus[h.toStatus] || h.toStatus}</span>
                </div>
              </div>
              {h.changeNote && <div className="text-sm text-slate-700">{h.changeNote}</div>}
              {h.changeReason && <div className="text-sm text-slate-500 mt-1">原因：{h.changeReason}</div>}
              <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDateTime(h.changedAt)}</span>
                <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{h.changedBy || '系统'}</span>
                <span>操作 #{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
