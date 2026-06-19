import {
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  RefreshCw,
  AlertTriangle,
  Shield,
  Edit3,
  Clock,
} from 'lucide-react'
import type { TimelineRecord } from '@/types'
import {
  formatDateTime,
  getTimelineEventTypeLabel,
  getTimelineEventTypeColor,
  cn,
} from '@/utils'

interface TimelineProps {
  events: TimelineRecord[]
}

const iconMap: Record<string, any> = {
  created: FileText,
  status_changed: CheckCircle,
  note_added: MessageSquare,
  attachment_added: Paperclip,
  rescheduled: RefreshCw,
  conflict_detected: AlertTriangle,
  conflict_resolved: Shield,
  handover: Edit3,
  remark: MessageSquare,
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无时间线记录</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {events.map((event, index) => {
        const Icon = iconMap[event.event_type] || Clock
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="relative flex gap-3">
            {/* 时间线 */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                  getTimelineEventTypeColor(event.event_type)
                )}
              >
                <Icon size={14} className="text-white" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
              )}
            </div>

            {/* 内容 */}
            <div className={cn('flex-1 pb-4', isLast ? 'pb-0' : '')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getTimelineEventTypeLabel(event.event_type)}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              {event.operator && (
                <p className="text-xs text-gray-500 mt-1">
                  处理人：{event.operator.full_name || event.operator.username}
                </p>
              )}

              {event.attachments && event.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {event.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded"
                    >
                      <Paperclip size={12} className="mr-1.5 text-gray-400" />
                      <span className="truncate">{att.file_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {formatDateTime(event.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
