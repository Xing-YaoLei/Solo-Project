import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';
import type { Alert } from '@shared/types';
import { RISK_COLORS, DOCUMENT_TYPES } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/format';
import { Clock, FileWarning, AlertOctagon } from 'lucide-react';

dayjs.extend(relativeTime);

interface Props {
  alerts: Alert[];
  className?: string;
}

export function AlertTimeline({ alerts, className }: Props) {
  const navigate = useNavigate();
  const now = dayjs();

  return (
    <div className={cn('rounded-2xl bg-surface-card border border-surface-border overflow-hidden flex flex-col', className)}>
      <div className="h-14 flex items-center justify-between px-5 border-b border-surface-border bg-surface-elevated/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400">
            <AlertOctagon size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">实时预警流</div>
            <div className="text-[11px] text-slate-500">共 {alerts.length} 条预警</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 px-2 py-1 rounded-full bg-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
          LIVE
        </span>
      </div>

      <div className="overflow-y-auto" style={{ height: 480 }}>
        <div className="relative px-5 py-4 space-y-3">
          <div className="absolute left-[26px] top-4 bottom-4 w-px bg-gradient-to-b from-rose-500/40 via-amber-500/20 to-transparent" />
          {alerts.map((a, idx) => {
            const isNew = dayjs(a.triggeredAt).isAfter(now.subtract(10, 'minute'));
            const color = RISK_COLORS[a.level];
            const docMeta = a.documentType ? DOCUMENT_TYPES.find((d) => d.key === a.documentType) : null;
            const DocIcon = docMeta?.icon ?? FileWarning;
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/review/${a.vin}`)}
                className={cn(
                  'relative w-full text-left rounded-xl border transition-all group',
                  isNew
                    ? 'bg-rose-500/8 border-rose-500/25 hover:bg-rose-500/12'
                    : 'bg-white/[0.02] border-surface-border hover:bg-white/[0.04] hover:border-white/10'
                )}
              >
                {isNew && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 animate-pulse-soft">
                    NEW
                  </span>
                )}
                <div className="flex gap-3 p-3">
                  <div className="relative shrink-0">
                    <span className="block w-4 h-4 rounded-full mt-1.5 shadow-[0_0_0_3px_rgba(15,20,25,1)]" style={{ background: color, boxShadow: `0 0 0 3px #0F1419, 0 0 12px ${color}55` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white truncate">{a.storeName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-slate-300 bg-white/5">{a.vin.slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
                      <DocIcon size={10} className="text-slate-500" />
                      <span>{docMeta?.label ?? '综合风险'}</span>
                      <span className="text-slate-600">·</span>
                      <span>滞库 {a.stockDays} 天</span>
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{a.message}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={10} />
                        {formatDateTime(a.triggeredAt)}
                      </div>
                      {a.resolved ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">已解决</span>
                      ) : a.acknowledged ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">已确认</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">待处理</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
