import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/format';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { SyncDelayInfo } from '@shared/types';

interface Props {
  delays: SyncDelayInfo[];
  className?: string;
}

export function SyncDelayBadge({ delays, className }: Props) {
  const hasDelay = delays.some((d) => d.isDelayed);
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              hasDelay
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15',
              className
            )}
          >
            {hasDelay ? <AlertTriangle size={12} /> : <Check size={12} />}
            {hasDelay ? '⚠ 延迟' : '✓ 同步正常'}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            align="end"
            className="z-[100] w-80 rounded-xl bg-surface-elevated border border-surface-border shadow-card p-3 animate-slide-up"
          >
            <div className="text-xs font-semibold text-white mb-2 border-b border-surface-border pb-2">数据源同步状态</div>
            <ul className="space-y-2.5">
              {delays.map((d) => (
                <li key={d.source} className="text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-slate-200">{d.sourceName}</span>
                    {d.isDelayed ? (
                      <span className="inline-flex items-center gap-1 text-rose-400">
                        <X size={10} /> 延迟 {d.delayHours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <Check size={10} /> 正常
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>最近同步: {formatDateTime(d.lastSyncAt)}</span>
                  </div>
                  {d.isDelayed && (
                    <div className="text-[11px] text-rose-400/80 mt-0.5">
                      影响区间: {d.affectedFrom} ~ {d.affectedTo}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Tooltip.Arrow className="fill-surface-elevated" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
