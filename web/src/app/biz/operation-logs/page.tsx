'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface OperationLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  operatorId?: string;
  operatorName?: string;
  detail?: string;
  createdAt: string;
}

interface ListResponse {
  data: OperationLog[];
  total: number;
  page: number;
  limit: number;
}

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'order', label: '订单' },
  { value: 'dispute', label: '争议' },
  { value: 'check-in', label: '签到' },
  { value: 'seat-map', label: '座位图' },
];

const ACTION_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'created', label: '创建' },
  { value: 'updated', label: '更新' },
  { value: 'cancelled', label: '取消' },
  { value: 'approved', label: '批准' },
  { value: 'rejected', label: '驳回' },
  { value: 'closed', label: '关闭' },
  { value: 'reassigned', label: '重新分配' },
  { value: 'supplement', label: '补充' },
  { value: 'retry', label: '重试' },
];

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-700',
  updated: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
  reassigned: 'bg-purple-100 text-purple-700',
  supplement: 'bg-orange-100 text-orange-700',
  retry: 'bg-cyan-100 text-cyan-700',
};

export default function OperationLogsPage() {
  const [items, setItems] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterOperatorId, setFilterOperatorId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        limit,
        entityType: filterEntityType || undefined,
        action: filterAction || undefined,
        operatorId: filterOperatorId || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });
      const res = await fetchApi<ListResponse>(`/operation-logs${qs}`);
      setItems(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterEntityType, filterAction, filterOperatorId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const entityTypeLabel = (t: string) => ENTITY_TYPE_OPTIONS.find((o) => o.value === t)?.label || t;
  const actionLabel = (a: string) => ACTION_OPTIONS.find((o) => o.value === a)?.label || a;

  const formatDetail = (detail?: string) => {
    if (!detail) return null;
    try {
      const parsed = JSON.parse(detail);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return detail;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">操作日志</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">实体类型</label>
          <select value={filterEntityType} onChange={(e) => { setFilterEntityType(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
            {ENTITY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">操作</label>
          <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
            {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">操作人ID</label>
          <input value={filterOperatorId} onChange={(e) => { setFilterOperatorId(e.target.value); setPage(1); }} placeholder="输入操作人ID" className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">开始日期</label>
          <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">结束日期</label>
          <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">实体类型</th>
                <th className="px-4 py-3 text-left">实体ID</th>
                <th className="px-4 py-3 text-left">操作</th>
                <th className="px-4 py-3 text-left">操作人</th>
                <th className="px-4 py-3 text-left">创建时间</th>
                <th className="px-4 py-3 text-left">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {entityTypeLabel(item.entityType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.entityId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${ACTION_COLORS[item.action] || 'bg-gray-100 text-gray-700'}`}>
                        {actionLabel(item.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.operatorName || item.operatorId || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      {item.detail ? (
                        <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="text-blue-600 hover:underline text-xs">
                          {expandedId === item.id ? '收起' : '查看'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === item.id && item.detail && (
                    <tr key={`${item.id}-detail`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <pre className="text-xs text-gray-700 bg-white rounded border p-3 overflow-x-auto whitespace-pre-wrap break-words">
                          {formatDetail(item.detail)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
            <span className="px-3 py-1">{page} / {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
