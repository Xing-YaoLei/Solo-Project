import type { TimelineEvent } from '@/types';
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDot,
} from 'lucide-react';

const eventIcons: Record<string, typeof FileText> = {
  '提交处方': FileText,
  '开始审核': Eye,
  '审核通过': CheckCircle2,
  '审核驳回': XCircle,
  '标记异常': AlertTriangle,
};

const eventColors: Record<string, string> = {
  pending: 'bg-slate-300',
  in_review: 'bg-blue-400',
  approved: 'bg-mint-400',
  rejected: 'bg-red-400',
  exception: 'bg-amber-400',
};

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative">
      {events.map((event, index) => {
        const Icon = eventIcons[event.action] || CircleDot;
        const isLast = index === events.length - 1;
        const dotColor = eventColors[event.status] || 'bg-slate-300';

        return (
          <div key={index} className="flex gap-3 pb-5">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dotColor} bg-opacity-15 ring-2 ring-white`}>
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{event.action}</span>
                <span className="text-2xs text-slate-400">{event.actor}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{event.detail}</p>
              <p className="text-2xs text-slate-400 mt-1 font-mono">
                {new Date(event.timestamp).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
