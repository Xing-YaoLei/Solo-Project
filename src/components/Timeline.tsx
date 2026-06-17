import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { TimelineEvent } from '@/types';
import { cn } from '@/lib/utils';

const eventConfig: Record<string, { icon: typeof Package; color: string; bgColor: string }> = {
  in: { icon: ArrowDownCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  out: { icon: ArrowUpCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  transfer: { icon: ArrowLeftRight, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  adjust: { icon: SlidersHorizontal, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  shortage: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
  supplement: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  close: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无时间线记录
        </div>
      ) : (
        <div className="space-y-0">
          {events.map((event, index) => {
            const config = eventConfig[event.type] || eventConfig.in;
            const Icon = config.icon;
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative flex gap-4 animate-fade-in-up">
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center z-10',
                    config.bgColor
                  )}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  {!isLast && (
                    <div className="absolute top-10 w-0.5 h-full bg-gray-200" />
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <div className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
                      </div>
                      {event.quantity !== undefined && (
                        <span className={cn(
                          'text-sm font-semibold px-2 py-1 rounded',
                          event.type === 'in' || event.type === 'supplement'
                            ? 'bg-emerald-100 text-emerald-700'
                            : event.type === 'shortage' || event.type === 'out'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        )}>
                          {event.type === 'in' || event.type === 'supplement' ? '+' : '-'}
                          {event.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>操作人: {event.operator}</span>
                      <span>{new Date(event.timestamp).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
