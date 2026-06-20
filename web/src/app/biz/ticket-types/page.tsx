'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quota: number;
  soldCount: number;
  refundable: boolean;
  transferable: boolean;
  rules?: string;
  eventId?: string;
}

interface ListResponse {
  data: TicketType[];
  total: number;
  page: number;
  limit: number;
}

const EMPTY_FORM = { name: '', price: '', quota: '', refundable: false, transferable: false, rules: '', eventId: '' };

export default function TicketTypesPage() {
  const [items, setItems] = useState<TicketType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterEventId, setFilterEventId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        limit,
        eventId: filterEventId || undefined,
      });
      const res = await fetchApi<ListResponse>(`/ticket-types${qs}`);
      setItems(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: TicketType) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      quota: String(item.quota),
      refundable: item.refundable,
      transferable: item.transferable,
      rules: item.rules || '',
      eventId: item.eventId || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      price: Number(form.price),
      quota: Number(form.quota),
      refundable: form.refundable,
      transferable: form.transferable,
      rules: form.rules || undefined,
      eventId: form.eventId || undefined,
    };
    try {
      if (editingId) {
        await fetchApi(`/ticket-types/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/ticket-types', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该票种？')) return;
    try {
      await fetchApi(`/ticket-types/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const quotaPercent = (sold: number, quota: number) => {
    if (quota <= 0) return 0;
    return Math.min(100, Math.round((sold / quota) * 100));
  };

  const barColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">票种管理</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          新增票种
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动ID</label>
          <input value={filterEventId} onChange={(e) => { setFilterEventId(e.target.value); setPage(1); }} placeholder="输入活动ID" className="border rounded px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">名称</th>
                <th className="px-4 py-3 text-left">价格</th>
                <th className="px-4 py-3 text-left">配额</th>
                <th className="px-4 py-3 text-left min-w-[180px]">已售/配额</th>
                <th className="px-4 py-3 text-left">可退</th>
                <th className="px-4 py-3 text-left">可转</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const pct = quotaPercent(item.soldCount, item.quota);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">¥{Number(item.price).toFixed(2)}</td>
                    <td className="px-4 py-3">{item.quota}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">{item.soldCount}/{item.quota} ({pct}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.refundable ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">是</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">否</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.transferable ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">是</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">否</span>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs">编辑</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">删除</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? '编辑票种' : '新增票种'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">价格</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">配额</label>
                <input type="number" min="0" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.refundable} onChange={(e) => setForm({ ...form, refundable: e.target.checked })} className="rounded" />
                  可退票
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.transferable} onChange={(e) => setForm({ ...form, transferable: e.target.checked })} className="rounded" />
                  可转赠
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">规则 (JSON)</label>
                <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={3} placeholder='{"maxPerUser": 5}' className="w-full border rounded px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">活动ID</label>
                <input value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
