'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';
import Link from 'next/link';

interface SeatMap {
  id: string;
  name: string;
  eventId: string;
  totalSeats: number;
  thresholdWarn: number;
  thresholdFull: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ListResponse {
  data: SeatMap[];
  total: number;
  page: number;
  limit: number;
}

const EMPTY_FORM = { name: '', eventId: '', totalSeats: 0, thresholdWarn: 80, thresholdFull: 100 };

export default function SeatMapsPage() {
  const [items, setItems] = useState<SeatMap[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterEventId, setFilterEventId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineThreshold, setInlineThreshold] = useState({ thresholdWarn: 0, thresholdFull: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        limit,
        eventId: filterEventId || undefined,
      });
      const res = await fetchApi<ListResponse>(`/seat-maps${qs}`);
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

  const openEdit = (item: SeatMap) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      eventId: item.eventId,
      totalSeats: item.totalSeats,
      thresholdWarn: item.thresholdWarn,
      thresholdFull: item.thresholdFull,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      eventId: form.eventId,
      totalSeats: Number(form.totalSeats),
      thresholdWarn: Number(form.thresholdWarn),
      thresholdFull: Number(form.thresholdFull),
    };
    try {
      if (editingId) {
        await fetchApi(`/seat-maps/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/seat-maps', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该座位图？')) return;
    try {
      await fetchApi(`/seat-maps/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const startInlineEdit = (item: SeatMap) => {
    setInlineEditId(item.id);
    setInlineThreshold({ thresholdWarn: item.thresholdWarn, thresholdFull: item.thresholdFull });
  };

  const saveInlineThreshold = async (id: string) => {
    try {
      await fetchApi(`/seat-maps/${id}/threshold`, {
        method: 'PUT',
        body: JSON.stringify({ thresholdWarn: Number(inlineThreshold.thresholdWarn), thresholdFull: Number(inlineThreshold.thresholdFull) }),
      });
      setInlineEditId(null);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">座位图阈值管理</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          新增座位图
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end">
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
                <th className="px-4 py-3 text-left">活动ID</th>
                <th className="px-4 py-3 text-left">总座位数</th>
                <th className="px-4 py-3 text-left">预警阈值</th>
                <th className="px-4 py-3 text-left">满座阈值</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.eventId}</td>
                  <td className="px-4 py-3">{item.totalSeats}</td>
                  <td className="px-4 py-3">
                    {inlineEditId === item.id ? (
                      <input type="number" value={inlineThreshold.thresholdWarn} onChange={(e) => setInlineThreshold({ ...inlineThreshold, thresholdWarn: Number(e.target.value) })} className="border rounded px-2 py-1 w-16 text-sm" />
                    ) : (
                      <span>{item.thresholdWarn}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inlineEditId === item.id ? (
                      <input type="number" value={inlineThreshold.thresholdFull} onChange={(e) => setInlineThreshold({ ...inlineThreshold, thresholdFull: Number(e.target.value) })} className="border rounded px-2 py-1 w-16 text-sm" />
                    ) : (
                      <span>{item.thresholdFull}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {inlineEditId === item.id ? (
                      <>
                        <button onClick={() => saveInlineThreshold(item.id)} className="text-green-600 hover:underline text-xs">保存阈值</button>
                        <button onClick={() => setInlineEditId(null)} className="text-gray-500 hover:underline text-xs">取消</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startInlineEdit(item)} className="text-blue-600 hover:underline text-xs">编辑阈值</button>
                        <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs">编辑</button>
                        <Link href={`/admin/seat-maps/${item.id}`} className="text-indigo-600 hover:underline text-xs">查看余座</Link>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">删除</button>
                      </>
                    )}
                  </td>
                </tr>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? '编辑座位图' : '新增座位图'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">活动ID</label>
                <input value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">总座位数</label>
                <input type="number" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">预警阈值 (%)</label>
                <input type="number" min={0} max={100} value={form.thresholdWarn} onChange={(e) => setForm({ ...form, thresholdWarn: Number(e.target.value) })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">满座阈值 (%)</label>
                <input type="number" min={0} max={100} value={form.thresholdFull} onChange={(e) => setForm({ ...form, thresholdFull: Number(e.target.value) })} required className="w-full border rounded px-3 py-2 text-sm" />
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
