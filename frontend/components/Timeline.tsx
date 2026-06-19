import { cn, formatDateTime } from '@/lib/utils';
import {
  FileText,
  RefreshCw,
  User,
  Package,
  CheckCircle,
  XCircle,
  Shield,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import type { OperationType } from '@/lib/types';

interface TimelineItem {
  id: string;
  type: OperationType;
  title: string;
  description?: string;
  operatorName?: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  emptyText?: string;
}

const typeConfig: Record<OperationType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  created: { icon: Plus, color: 'bg-green-500', label: '创建' },
  statusChanged: { icon: RefreshCw, color: 'bg-blue-500', label: '状态变更' },
  technicianAssigned: { icon: User, color: 'bg-purple-500', label: '分派技师' },
  partRequested: { icon: Package, color: 'bg-amber-500', label: '配件申请' },
  partApproved: { icon: CheckCircle, color: 'bg-green-500', label: '配件批准' },
  partRejected: { icon: XCircle, color: 'bg-red-500', label: '配件拒绝' },
  partFulfilled: { icon: Package, color: 'bg-green-500', label: '配件完成' },
  qualityCheckAdded: { icon: Shield, color: 'bg-cyan-500', label: '质检记录' },
  updated: { icon: Edit, color: 'bg-blue-500', label: '更新' },
  deleted: { icon: Trash2, color: 'bg-red-500', label: '删除' },
};

export function Timeline({ items, className, emptyText = '暂无记录' }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-slate-500', className)}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, index) => {
        const config = typeConfig[item.type] || typeConfig.updated;
        const Icon = config.icon;
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4">
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm',
                  config.color
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-slate-200" />
              )}
            </div>

            <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{item.title}</span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(item.timestamp)}
                </span>
              </div>
              {item.operatorName && (
                <p className="mt-0.5 text-sm text-slate-500">
                  操作人：{item.operatorName}
                </p>
              )}
              {item.description && (
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              )}
              {(item.oldValue || item.newValue) && (
                <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                  {item.oldValue && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">变更前：</span>
                      <span className="text-slate-700">{item.oldValue}</span>
                    </div>
                  )}
                  {item.newValue && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-slate-500">变更后：</span>
                      <span className="font-medium text-slate-900">{item.newValue}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
