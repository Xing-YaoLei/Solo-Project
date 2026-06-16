import { useState, useMemo } from 'react';
import { useRouter } from '@tanstack/react-router';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { StatusBadge, PageHeader } from '@/components/UI';
import { users } from '@/mock/data';
import { Search, AlertTriangle, Filter, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

const borderColorMap: Record<string, string> = {
  open: 'border-l-amber-400',
  processing: 'border-l-blue-400',
  resolved: 'border-l-mint-400',
  closed: 'border-l-slate-300',
};

export function ExceptionList() {
  const router = useRouter();
  const exceptions = usePrescriptionStore((s) => s.exceptions);

  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const assigneeOptions = useMemo(() => {
    const ids = new Set(exceptions.map((e) => e.assignee_id));
    return users.filter((u) => ids.has(u.id));
  }, [exceptions]);

  const stats = useMemo(() => ({
    open: exceptions.filter((e) => e.status === 'open').length,
    processing: exceptions.filter((e) => e.status === 'processing').length,
    resolved: exceptions.filter((e) => e.status === 'resolved').length,
    closed: exceptions.filter((e) => e.status === 'closed').length,
  }), [exceptions]);

  const filtered = useMemo(() => {
    return exceptions.filter((e) => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (assigneeFilter && e.assignee_id !== assigneeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          e.exception_no.toLowerCase().includes(q) ||
          e.prescription_no.toLowerCase().includes(q) ||
          e.reason.toLowerCase().includes(q) ||
          e.impact_scope.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [exceptions, statusFilter, assigneeFilter, searchQuery]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <PageHeader title="异常管理" description="跟踪处理所有处方审核异常" />

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '待处理', count: stats.open, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: '处理中', count: stats.processing, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '已解决', count: stats.resolved, color: 'text-mint-600', bg: 'bg-mint-50', border: 'border-mint-200' },
          { label: '已关闭', count: stats.closed, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-lg border p-3', s.bg, s.border)}>
            <p className="text-2xs text-slate-500">{s.label}</p>
            <p className={cn('text-2xl font-semibold mt-0.5', s.color)}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-slate-400" />
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">全部处理人</option>
            {assigneeOptions.map((u) => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索异常编号、处方号、原因..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className={cn(
              'bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow',
              borderColorMap[ex.status] || 'border-l-slate-300',
            )}
            onClick={() => router.navigate({ to: `/exceptions/${ex.id}` })}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold text-slate-800">{ex.exception_no}</span>
              <StatusBadge status={ex.status} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>处方号：</span>
                <span
                  className="text-blue-600 hover:underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.navigate({ to: `/exceptions/${ex.id}` });
                  }}
                >
                  {ex.prescription_no}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{ex.reason}</p>

              <div className="flex items-center gap-1.5 text-2xs text-slate-500">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{ex.impact_scope}</span>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="text-2xs text-slate-500">
                  处理人：{ex.assignee_name}
                </span>
                <span className="flex items-center gap-1 text-2xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatDate(ex.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">暂无匹配的异常记录</p>
        </div>
      )}
    </div>
  );
}
