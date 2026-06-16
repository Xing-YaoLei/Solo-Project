import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { StatusBadge, PageHeader } from '@/components/UI';
import { stores } from '@/mock/data';
import { Search, Filter, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';

const prescriptionTypeLabels: Record<string, string> = {
  normal: '普通处方',
  chronic: '慢性病处方',
  pediatric: '儿科处方',
};

const prescriptionTypeBadge: Record<string, string> = {
  normal: 'bg-slate-100 text-slate-600',
  chronic: 'bg-blue-50 text-blue-600',
  pediatric: 'bg-purple-50 text-purple-600',
};

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'in_review', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'exception', label: '异常' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'normal', label: '普通处方' },
  { value: 'chronic', label: '慢性病处方' },
  { value: 'pediatric', label: '儿科处方' },
];

export function ReviewWorkbench() {
  const router = useRouter();
  const { prescriptions, selectedIds, toggleSelect, selectAll, clearSelection, batchUpdateStatus } = usePrescriptionStore();

  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = prescriptions.filter((p) => {
    if (storeFilter && p.store_id !== storeFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (typeFilter && p.prescription_type !== typeFilter) return false;
    if (dateFrom && p.submitted_at < dateFrom) return false;
    if (dateTo && p.submitted_at > dateTo + 'T23:59:59') return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      filtered.forEach((p) => {
        if (!selectedIds.includes(p.id)) {
          toggleSelect(p.id);
        }
      });
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <PageHeader title="审核工作台" description="管理所有待审核与审核中的处方" />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            <span>筛选</span>
          </div>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
          >
            <option value="">全部门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <span className="text-sm text-slate-400">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/20"
                  />
                </th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">处方编号</th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">门店</th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">患者</th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">处方类型</th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">提交时间</th>
                <th className="px-5 py-3 text-left text-2xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 hover:bg-slate-25 cursor-pointer transition-colors"
                  onClick={() => router.navigate({ to: `/prescription/${p.id}` })}
                >
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/20"
                    />
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700 font-mono">{p.prescription_no}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{p.store_name}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{p.patient_name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${prescriptionTypeBadge[p.prescription_type] || 'bg-slate-100 text-slate-600'}`}>
                      {prescriptionTypeLabels[p.prescription_type] || p.prescription_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">{formatDate(p.submitted_at)}</td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.navigate({ to: `/prescription/${p.id}` })}
                      className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      查看
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">没有找到匹配的处方</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-slate-200 shadow-lg px-6 py-3 flex items-center gap-4 z-50">
          <span className="text-sm text-slate-600">
            已选择 <span className="font-semibold text-brand-500">{selectedIds.length}</span> 条处方
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => batchUpdateStatus(selectedIds, 'approved')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-mint-400 hover:bg-mint-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              批量通过
            </button>
            <button
              onClick={() => batchUpdateStatus(selectedIds, 'rejected')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              批量驳回
            </button>
            <button
              onClick={() => batchUpdateStatus(selectedIds, 'exception')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              标记异常
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
