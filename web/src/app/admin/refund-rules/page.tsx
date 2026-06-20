'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface RefundRule {
  id: string;
  name: string;
  ticketTypeId?: string;
  beforeDays: number;
  refundPercent: number;
  materials?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ListResponse {
  data: RefundRule[];
  total: number;
  page: number;
  limit: number;
}

const EMPTY_FORM = { name: '', ticketTypeId: '', beforeDays: 0, refundPercent: 0, materials: '' };

export default function RefundRulesPage() {
  const [items, setItems] = useState<RefundRule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterIsActive, setFilterIsActive] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        limit,
        isActive: filterIsActive === '' ? undefined : filterIsActive === 'true',
      });
      const res = await fetchApi<ListResponse>(`/refund-rules${qs}`);
      setItems(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterIsActive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: RefundRule) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      ticketTypeId: item.ticketTypeId || '',
      beforeDays: item.beforeDays,
      refundPercent: item.refundPercent,
      materials: item.materials || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      ticketTypeId: form.ticketTypeId || undefined,
      beforeDays: Number(form.beforeDays),
      refundPercent: Number(form.refundPercent),
      materials: form.materials,
    };
    try {
      if (editingId) {
        await fetchApi(`/refund-rules/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/refund-rules', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('确认停用该规则？')) return;
    try {
      await fetchApi(`/refund-rules/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">退款规则配置</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          新增规则
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">状态</label>
          <select value={filterIsActive} onChange={(e) => { setFilterIsActive(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部</option>
            <option value="true">启用</option>
            <option value="false">停用</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">规则名称</th>
                <th className="px-4 py-3 text-left">票种ID</th>
                <th className="px-4 py-3 text-left">提前天数</th>
                <th className="px-4 py-3 text-left">退款比例</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.ticketTypeId || '-'}</td>
                  <td className="px-4 py-3">{item.beforeDays}</td>
                  <td className="px-4 py-3">{item.refundPercent}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isActive ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs">编辑</button>
                    {item.isActive && (
                      <button onClick={() => handleSoftDelete(item.id)} className="text-red-600 hover:underline text-xs">停用</button>
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
            <h2 className="text-lg font-bold mb-4">{editingId ? '编辑规则' : '新增规则'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">规则名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">票种ID（可选）</label>
                <input value={form.ticketTypeId} onChange={(e) => setForm({ ...form, ticketTypeId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">提前天数</label>
                <input type="number" value={form.beforeDays} onChange={(e) => setForm({ ...form, beforeDays: Number(e.target.value) })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">退款比例 (%)</label>
                <input type="number" min={0} max={100} value={form.refundPercent} onChange={(e) => setForm({ ...form, refundPercent: Number(e.target.value) })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">所需材料（JSON）</label>
                <textarea value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} className="w-full border rounded px-3 py-2 text-sm font-mono" rows={3} placeholder='[ "身份证", "订单截图" ]' />
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
