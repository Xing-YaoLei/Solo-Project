'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface CheckInDict {
  id: string;
  code: string;
  label: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ListResponse {
  data: CheckInDict[];
  total: number;
  page: number;
  limit: number;
}

const EMPTY_FORM = { code: '', label: '', category: '', description: '' };

export default function CheckInDictsPage() {
  const [items, setItems] = useState<CheckInDict[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
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
        category: filterCategory || undefined,
        isActive: filterIsActive === '' ? undefined : filterIsActive === 'true',
      });
      const res = await fetchApi<ListResponse>(`/check-in-dicts${qs}`);
      setItems(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterCategory, filterIsActive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: CheckInDict) => {
    setEditingId(item.id);
    setForm({ code: item.code, label: item.label, category: item.category, description: item.description || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchApi(`/check-in-dicts/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await fetchApi('/check-in-dicts', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('确认停用该条目？')) return;
    try {
      await fetchApi(`/check-in-dicts/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">核销字典管理</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          新增字典
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">分类</label>
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
            <option value="">全部</option>
            <option value="check_in_type">核销类型</option>
            <option value="channel">渠道</option>
            <option value="status">状态</option>
          </select>
        </div>
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
                <th className="px-4 py-3 text-left">编码</th>
                <th className="px-4 py-3 text-left">标签</th>
                <th className="px-4 py-3 text-left">分类</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3">{item.category}</td>
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
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
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
            <h2 className="text-lg font-bold mb-4">{editingId ? '编辑字典' : '新增字典'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">编码</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">标签</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">分类</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={3} />
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
