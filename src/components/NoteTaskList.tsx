'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  triggerReason?: string | null;
  triggerValue?: number | null;
  thresholdValue?: number | null;
  patient?: {
    id: string;
    name: string;
    patientNo: string;
  };
}

interface NoteTaskListProps {
  tasks: NoteTask[];
  onUpdateConclusion?: (taskId: string, conclusion: string) => void;
}

const priorityConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  LOW: { label: '低', className: 'text-slate-600 bg-slate-100', dotColor: 'bg-slate-400' },
  MEDIUM: { label: '中', className: 'text-yellow-700 bg-yellow-100', dotColor: 'bg-yellow-500' },
  HIGH: { label: '高', className: 'text-red-700 bg-red-100', dotColor: 'bg-red-500' },
  URGENT: { label: '紧急', className: 'text-red-700 bg-red-200', dotColor: 'bg-red-600' },
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: { label: '待处理', className: 'text-yellow-700 bg-yellow-100', icon: Clock },
  IN_PROGRESS: { label: '处理中', className: 'text-blue-700 bg-blue-100', icon: MessageSquare },
  COMPLETED: { label: '已完成', className: 'text-green-700 bg-green-100', icon: CheckCircle },
  CANCELLED: { label: '已取消', className: 'text-slate-600 bg-slate-100', icon: X },
};

export function NoteTaskList({ tasks, onUpdateConclusion }: NoteTaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [conclusionText, setConclusionText] = useState('');

  const handleSubmitConclusion = (taskId: string) => {
    if (conclusionText.trim() && onUpdateConclusion) {
      onUpdateConclusion(taskId, conclusionText.trim());
      setConclusionText('');
      setExpandedTask(null);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED');

  const TaskItem = ({ task }: { task: NoteTask }) => {
    const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
    const status = statusConfig[task.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;
    const isExpanded = expandedTask === task.id;
    const canAddConclusion = task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

    return (
      <div
        className={cn(
          'border rounded-xl overflow-hidden transition-all',
          isExpanded ? 'border-primary-300 shadow-md' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${status.className}`}>
              <StatusIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-800 truncate">{task.title}</h4>
                <span className={`w-2 h-2 rounded-full ${priority.dotColor} flex-shrink-0`} />
              </div>
              {task.patient && (
                <p className="text-sm text-slate-500 mt-1">
                  {task.patient.name} ({task.patient.patientNo})
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${priority.className}`}>
                  {priority.label}优先级
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
              {task.triggerReason && task.triggerValue != null && (
                <p className="text-xs text-slate-400 mt-2">
                  触发值: {task.triggerValue.toFixed?.(1) ?? task.triggerValue}% / 阈值:{' '}
                  {task.thresholdValue?.toFixed?.(1) ?? task.thresholdValue}%
                </p>
              )}
            </div>
            <FileText size={16} className="text-slate-400 flex-shrink-0 mt-1" />
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
            {task.description && (
              <p className="text-sm text-slate-600 mb-3">{task.description}</p>
            )}

            {task.conclusion && (
              <div className="p-3 bg-green-50 rounded-lg mb-3">
                <p className="text-xs text-green-700 font-medium mb-1">处理结论</p>
                <p className="text-sm text-green-800">{task.conclusion}</p>
              </div>
            )}

            {canAddConclusion && !task.conclusion && (
              <div className="space-y-2">
                <textarea
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  placeholder="输入处理结论..."
                  className="input text-sm min-h-[80px] resize-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmitConclusion(task.id);
                    }}
                    disabled={!conclusionText.trim()}
                    className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    提交结论
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-3">
              创建于 {formatDate(task.createdAt)}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {pendingTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            待处理任务 ({pendingTasks.length})
          </h4>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            已完成 ({completedTasks.length})
          </h4>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">暂无备注任务</p>
        </div>
      )}
    </div>
  );
}
