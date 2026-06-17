import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { mockUsers } from '@/data/mockData';
import type { TodoItem, TodoPriority, TodoType, TodoStatus } from '@/types';

const priorityColorMap: Record<TodoPriority, string> = {
  urgent: 'bg-status-danger',
  high: 'bg-amber-500',
  normal: 'bg-status-info',
};

const priorityBorderColorMap: Record<TodoPriority, string> = {
  urgent: 'border-l-status-danger',
  high: 'border-l-amber-500',
  normal: 'border-l-status-info',
};

const priorityLabelMap: Record<TodoPriority, string> = {
  urgent: '紧急',
  high: '高',
  normal: '一般',
};

const typeLabelMap: Record<TodoType, string> = {
  delay: '延误',
  rejection: '驳回',
  reassign: '重新分派',
};

const typeBadgeMap: Record<TodoType, string> = {
  delay: 'bg-status-danger/20 text-status-danger',
  rejection: 'bg-amber-500/20 text-amber-500',
  reassign: 'bg-status-info/20 text-status-info',
};

const statusLabelMap: Record<TodoStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

const statusBadgeMap: Record<TodoStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-500',
  processing: 'bg-status-info/20 text-status-info',
  resolved: 'bg-status-success/20 text-status-success',
};

const maintenanceUsers = mockUsers.filter((u) => u.role === 'maintenance');

type ActionMode = 'reassign' | 'supplement' | 'reject' | null;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function SummaryCards({ items }: { items: TodoItem[] }) {
  const pending = items.filter((t) => t.status === 'pending').length;
  const processing = items.filter((t) => t.status === 'processing').length;
  const resolved = items.filter((t) => t.status === 'resolved').length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 text-center">
        <span className="font-mono-data text-3xl font-bold text-amber-500">{pending}</span>
        <p className="text-xs text-gray-400 mt-1">待处理</p>
      </div>
      <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 text-center">
        <span className="font-mono-data text-3xl font-bold text-status-info">{processing}</span>
        <p className="text-xs text-gray-400 mt-1">处理中</p>
      </div>
      <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 text-center">
        <span className="font-mono-data text-3xl font-bold text-status-success">{resolved}</span>
        <p className="text-xs text-gray-400 mt-1">已解决</p>
      </div>
    </div>
  );
}

function ReassignPanel({
  onConfirm,
  onCancel,
}: {
  onConfirm: (assigneeId: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState(maintenanceUsers[0]?.id ?? '');

  return (
    <div className="mt-3 rounded-lg bg-navy-700/30 border border-navy-600/50 p-3 space-y-3">
      <p className="text-xs text-gray-300">选择新的维修人员：</p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg bg-navy-700 border border-navy-600/50 text-gray-200 text-xs px-3 py-2 focus:outline-none focus:border-status-info"
      >
        {maintenanceUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => onConfirm(selected)}
          disabled={!selected}
          className="px-3 py-1.5 text-xs bg-status-info text-white rounded-lg hover:bg-status-info/80 transition-colors disabled:opacity-50"
        >
          确认分派
        </button>
      </div>
    </div>
  );
}

function SupplementPanel({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="mt-3 rounded-lg bg-navy-700/30 border border-navy-600/50 p-3 space-y-3">
      <p className="text-xs text-gray-300">补充材料说明：</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full rounded-lg bg-navy-700 border border-navy-600/50 text-gray-200 text-xs px-3 py-2 focus:outline-none focus:border-status-info resize-none"
        placeholder="请输入补充说明..."
      />
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-dashed border-navy-600/50 text-gray-500 text-xs px-3 py-3 text-center">
          📎 上传附件（暂未开放）
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 text-xs bg-amber-500 text-navy-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
        >
          提交
        </button>
      </div>
    </div>
  );
}

function RejectPanel({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="mt-3 rounded-lg bg-navy-700/30 border border-navy-600/50 p-3 space-y-3">
      <p className="text-xs text-gray-300">驳回原因：</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full rounded-lg bg-navy-700 border border-navy-600/50 text-gray-200 text-xs px-3 py-2 focus:outline-none focus:border-status-danger resize-none"
        placeholder="请输入驳回原因..."
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 text-xs bg-status-danger text-white rounded-lg hover:bg-status-danger/80 transition-colors"
        >
          确认驳回
        </button>
      </div>
    </div>
  );
}

function TodoCard({ item }: { item: TodoItem }) {
  const updateTodoStatus = useAppStore((s) => s.updateTodoStatus);
  const [actionMode, setActionMode] = useState<ActionMode>(null);

  const handleReassign = (_assigneeId: string) => {
    updateTodoStatus(item.id, 'resolved');
    setActionMode(null);
  };

  const handleSupplement = () => {
    updateTodoStatus(item.id, 'processing');
    setActionMode(null);
  };

  const handleReject = () => {
    updateTodoStatus(item.id, 'processing');
    setActionMode(null);
  };

  return (
    <div
      className={`rounded-lg bg-navy-800 border border-navy-700/50 border-l-4 ${priorityBorderColorMap[item.priority]} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading font-semibold text-white text-sm truncate">
              {item.orderTitle}
            </h3>
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityColorMap[item.priority]} text-white`}
            >
              {priorityLabelMap[item.priority]}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeBadgeMap[item.type]}`}
            >
              {typeLabelMap[item.type]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.reason}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              分派: <span className="text-gray-300">{item.assignedName}</span>
            </span>
            <span>
              时间: <span className="font-mono-data text-gray-300">{formatDate(item.createdAt)}</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadgeMap[item.status]}`}>
              {statusLabelMap[item.status]}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => setActionMode(actionMode === 'reassign' ? null : 'reassign')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                  actionMode === 'reassign'
                    ? 'bg-status-info text-white'
                    : 'bg-status-info/20 text-status-info hover:bg-status-info/30'
                }`}
              >
                重新分派
              </button>
              <button
                onClick={() => setActionMode(actionMode === 'supplement' ? null : 'supplement')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                  actionMode === 'supplement'
                    ? 'bg-amber-500 text-navy-900'
                    : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                }`}
              >
                补充材料
              </button>
              <button
                onClick={() => setActionMode(actionMode === 'reject' ? null : 'reject')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                  actionMode === 'reject'
                    ? 'bg-status-danger text-white'
                    : 'bg-status-danger/20 text-status-danger hover:bg-status-danger/30'
                }`}
              >
                驳回重提
              </button>
            </>
          )}
          {item.status === 'processing' && (
            <span className="px-3 py-1.5 text-xs rounded-lg bg-status-info/10 text-status-info/60 cursor-not-allowed">
              处理中...
            </span>
          )}
          {item.status === 'resolved' && (
            <span className="px-3 py-1.5 text-xs rounded-lg bg-status-success/10 text-status-success font-medium">
              已解决
            </span>
          )}
        </div>
      </div>

      {item.status === 'pending' && actionMode === 'reassign' && (
        <ReassignPanel
          onConfirm={handleReassign}
          onCancel={() => setActionMode(null)}
        />
      )}
      {item.status === 'pending' && actionMode === 'supplement' && (
        <SupplementPanel onConfirm={handleSupplement} onCancel={() => setActionMode(null)} />
      )}
      {item.status === 'pending' && actionMode === 'reject' && (
        <RejectPanel onConfirm={handleReject} onCancel={() => setActionMode(null)} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 rounded-full bg-navy-700/50 flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-status-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-sm text-status-muted">暂无待办事项</p>
    </div>
  );
}

export default function TodoPool() {
  const todoItems = useAppStore((s) => s.todoItems);

  return (
    <div className="p-4 h-full overflow-y-auto scrollbar-thin">
      <h1 className="font-heading font-bold text-white text-lg mb-4">待办池</h1>
      <div className="space-y-4">
        <SummaryCards items={todoItems} />

        <div>
          <h2 className="font-heading font-semibold text-white text-sm mb-3">延误工单列表</h2>
          {todoItems.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {todoItems.map((item) => (
                <TodoCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
