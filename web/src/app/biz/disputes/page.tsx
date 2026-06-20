'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface Evidence {
  id: string;
  type: string;
  url: string;
  description?: string;
}

interface Dispute {
  id: string;
  orderId: string;
  orderNo?: string;
  reason: string;
  status: string;
  assigneeId?: string;
  assigneeName?: string;
  evidence?: Evidence[];
  createdAt: string;
}

interface ListResponse {
  data: Dispute[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已驳回' },
  { value: 'closed', label: '已关闭' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
};

export default function DisputesPage() {
  const [items, setItems] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Dispute | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignValue, setAssignValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        limit,
        status: filterStatus || undefined,
        assigneeId: filterAssigneeId || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });
      const res = await fetchApi<ListResponse>(`/disputes${qs}`);
      setItems(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, filterAssigneeId, filterDateFrom, filterDateTo]);

  const loadUnread = useCallback(async () => {
    try {
      const qs = buildQuery({ status: 'pending' });
      const res = await fetchApi<ListResponse>(`/disputes${qs}`);
      setUnreadCount(res.total);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadUnread();
  }, [loadData, loadUnread]);

  const totalPages = Math.ceil(total / limit);

  const handleExpand = async (dispute: Dispute) => {
    if (expandedId === dispute.id) {
      setExpandedId(null);
      setDetailData(null);
      return;
    }
    setExpandedId(dispute.id);
    if (dispute.evidence && dispute.evidence.length > 0) {
      setDetailData(dispute);
      return;
    }
    setDetailLoading(true);
    try {
      const res = await fetchApi<Dispute>(`/disputes/${dispute.id}`);
      setDetailData(res);
    } catch (e) {
      console.error(e);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (disputeId: string, newStatus: string) => {
    try {
      await fetchApi(`/disputes/${disputeId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
      loadUnread();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async (disputeId: string) => {
    try {
      await fetchApi(`/disputes/${disputeId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ assigneeId: assignValue }),
      });
      setAssignId(null);
      setAssignValue('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const statusLabel = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">退款争议</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">状态</label>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">处理人ID</label>
          <input value={filterAssigneeId} onChange={(e) => { setFilterAssigneeId(e.target.value); setPage(1); }} placeholder="输入处理人ID" className="border rounded px-3 py-1.5 text-sm" />
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
                <th className="px-4 py-3 text-left">订单ID</th>
                <th className="px-4 py-3 text-left">原因</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">处理人</th>
                <th className="px-4 py-3 text-left">创建时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.orderNo || item.orderId}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{item.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.assigneeName || item.assigneeId || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-3 space-x-1">
                      <button onClick={() => handleExpand(item)} className="text-blue-600 hover:underline text-xs">
                        {expandedId === item.id ? '收起' : '详情'}
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusUpdate(item.id, 'approved')} className="text-green-600 hover:underline text-xs">批准</button>
                          <button onClick={() => handleStatusUpdate(item.id, 'rejected')} className="text-red-600 hover:underline text-xs">驳回</button>
                        </>
                      )}
                      {(item.status === 'pending' || item.status === 'approved') && (
                        <button onClick={() => handleStatusUpdate(item.id, 'closed')} className="text-gray-600 hover:underline text-xs">关闭</button>
                      )}
                      <button onClick={() => { setAssignId(item.id); setAssignValue(item.assigneeId || ''); }} className="text-purple-600 hover:underline text-xs">分配</button>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr key={`${item.id}-detail`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        {detailLoading ? (
                          <div className="text-gray-400 text-xs">加载详情...</div>
                        ) : detailData ? (
                          <div>
                            <div className="text-xs font-medium mb-2 text-gray-600">争议详情</div>
                            <div className="text-xs text-gray-700 mb-3">{detailData.reason}</div>
                            {detailData.evidence && detailData.evidence.length > 0 ? (
                              <div>
                                <div className="text-xs font-medium mb-2 text-gray-600">凭证</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {detailData.evidence.map((ev) => (
                                    <div key={ev.id} className="bg-white rounded border p-2 text-xs">
                                      <div className="font-medium text-gray-600">{ev.type}</div>
                                      {ev.description && <div className="text-gray-500 mt-1">{ev.description}</div>}
                                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 block">查看文件</a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">暂无凭证</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs">加载失败</div>
                        )}
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

      {assignId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">分配处理人</h2>
            <input value={assignValue} onChange={(e) => setAssignValue(e.target.value)} placeholder="输入处理人ID" className="w-full border rounded px-3 py-2 text-sm mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAssignId(null); setAssignValue(''); }} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">取消</button>
              <button onClick={() => handleAssign(assignId)} className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
