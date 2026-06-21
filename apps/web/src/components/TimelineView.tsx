import { TimelineEventType } from '@legal/shared';
import type { TimelineEventDTO } from '@legal/shared';

const eventTypeConfig: Record<TimelineEventType, { color: string; bgColor: string; icon: string }> = {
  [TimelineEventType.CASE_CREATED]: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: '📋' },
  [TimelineEventType.MATERIAL_UPLOADED]: { color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: '📎' },
  [TimelineEventType.IDENTITY_VERIFIED]: { color: 'text-cyan-600', bgColor: 'bg-cyan-50', icon: '✅' },
  [TimelineEventType.CONFLICT_CHECK_PASSED]: { color: 'text-green-600', bgColor: 'bg-green-50', icon: '🛡️' },
  [TimelineEventType.CONFLICT_CHECK_FAILED]: { color: 'text-red-600', bgColor: 'bg-red-50', icon: '⚠️' },
  [TimelineEventType.EVIDENCE_REVIEWED]: { color: 'text-purple-600', bgColor: 'bg-purple-50', icon: '🔍' },
  [TimelineEventType.MATERIAL_INCOMPLETE_NOTICE]: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: '❗' },
  [TimelineEventType.MATERIAL_RESUBMITTED]: { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: '🔄' },
  [TimelineEventType.LAWYER_ASSIGNED]: { color: 'text-violet-600', bgColor: 'bg-violet-50', icon: '👨‍⚖️' },
  [TimelineEventType.CASE_STAGE_SET]: { color: 'text-teal-600', bgColor: 'bg-teal-50', icon: '📌' },
  [TimelineEventType.TRIAL_SCHEDULED]: { color: 'text-sky-600', bgColor: 'bg-sky-50', icon: '⚖️' },
  [TimelineEventType.FEE_AGREED]: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: '💰' },
  [TimelineEventType.RISK_WARNING]: { color: 'text-red-600', bgColor: 'bg-red-50', icon: '🚨' },
  [TimelineEventType.COMMUNICATION]: { color: 'text-slate-600', bgColor: 'bg-slate-50', icon: '💬' },
  [TimelineEventType.VERSION_UPDATE]: { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '📝' },
  [TimelineEventType.CASE_CLOSED]: { color: 'text-slate-700', bgColor: 'bg-slate-100', icon: '🏁' },
};

interface TimelineViewProps {
  events: TimelineEventDTO[];
}

export default function TimelineView({ events }: TimelineViewProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>暂无时间轴事件</p>
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
      <div className="space-y-6">
        {sorted.map((event, index) => {
          const config = eventTypeConfig[event.eventType] || {
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            icon: '📌',
          };

          return (
            <div key={index} className="relative flex gap-4 pl-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10 ${config.bgColor}`}
              >
                {config.icon}
              </div>
              <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`text-sm font-semibold ${config.color}`}>{event.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{event.content}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-slate-400">
                      {event.createdAt
                        ? new Date(event.createdAt).toLocaleDateString('zh-CN')
                        : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {event.createdAt
                        ? new Date(event.createdAt).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
                {event.operatorName && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600">
                      {event.operatorName.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-500">{event.operatorName}</span>
                  </div>
                )}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 bg-slate-50 rounded px-3 py-2">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-slate-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
