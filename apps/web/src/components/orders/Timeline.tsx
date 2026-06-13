import React from 'react';
import * as LucideIcons from 'lucide-react';
import { formatDate, actionConfig, cn } from '@/lib/utils';
import type { RefundTimeline } from '@solo/shared';

interface TimelineProps {
  timelines: RefundTimeline[];
}

export function Timeline({ timelines }: TimelineProps) {
  if (timelines.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <LucideIcons.Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无操作记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
      
      <div className="space-y-6">
        {timelines.map((item, index) => {
          const config = actionConfig[item.action];
          const IconComponent = (LucideIcons as any)[config?.icon] || LucideIcons.Circle;
          const isFirst = index === 0;

          return (
            <div key={item.id} className="relative flex gap-4">
              <div
                className={cn(
                  'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white',
                  isFirst ? 'bg-primary-500' : 'bg-gray-400',
                )}
              >
                <IconComponent className="h-3.5 w-3.5 text-white" />
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{config?.label || item.action}</span>
                  {item.operator && (
                    <span className="text-xs text-gray-500">
                      由 {item.operator.name} 操作
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                {(item.oldStatus || item.newStatus) && (
                  <div className="text-sm text-gray-600 mb-1">
                    {item.oldStatus && <span>{statusLabel(item.oldStatus)}</span>}
                    {item.oldStatus && item.newStatus && (
                      <LucideIcons.ArrowRight className="inline h-3 w-3 mx-1 text-gray-400" />
                    )}
                    {item.newStatus && (
                      <span className="font-medium">{statusLabel(item.newStatus)}</span>
                    )}
                  </div>
                )}

                {(item.oldValue || item.newValue) && (
                  <div className="text-sm text-gray-600 mb-1">
                    {item.oldValue && <span className="line-through text-gray-400">{item.oldValue}</span>}
                    {item.oldValue && item.newValue && ' → '}
                    {item.newValue && <span className="font-medium">{item.newValue}</span>}
                  </div>
                )}

                {item.note && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2 whitespace-pre-wrap">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '待分配',
    ASSIGNED: '已分配',
    PROCESSING: '处理中',
    EVIDENCE_UPLOADED: '已上传凭证',
    REVIEWING: '审核中',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    RETRY: '需重试',
    SUPPLEMENT: '需补录',
    CLOSED: '已关闭',
    TIMEOUT: '已超时',
  };
  return map[status] || status;
}
