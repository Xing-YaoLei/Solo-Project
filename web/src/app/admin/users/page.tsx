'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface ListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'staff' };

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [placeholder, setPlaceholder] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({ page, limit });
      const res = await fetchApi<ListResponse>(`/users${qs}`);
      setItems(res.data);
      setTotal(res.total);
      setPlaceholder(false);
    } catch {
      setPlaceholder(true);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/users', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const roleLabel = (r: string) => {
    switch (r) {
      case 'admin': return '管理员';
      case 'manager': return '经理';
      case 'staff': return '员工';
      default: return r;
    }
  };

  if (placeholder && !loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">人员管理</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold mb-2">用户管理需对接认证系统</h2>
          <p className="text-gray-500 text-sm">当前后端未提供用户管理 API，请联系管理员对接认证系统后使用。</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">人员管理</h1>
        <button onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          新增用户
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">姓名</th>
                <th className="px-4 py-3 text-left">邮箱</th>
                <th className="px-4 py-3 text-left">手机号</th>
                <th className="px-4 py-3 text-left">角色</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.email}</td>
                  <td className="px-4 py-3 text-gray-600">{item.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      {roleLabel(item.role)}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
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
            <h2 className="text-lg font-bold mb-4">新增用户</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">姓名</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">手机号</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">角色</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="admin">管理员</option>
                  <option value="manager">经理</option>
                  <option value="staff">员工</option>
                </select>
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
