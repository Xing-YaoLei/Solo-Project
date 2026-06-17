import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Phone,
  Mail,
  Shield,
  Star,
  X,
  Check,
} from 'lucide-react';
import type { User } from '@/types';
import { usersApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABELS, ROLE_COLORS, cn } from '@/utils/format';
import type { UserRole } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    role: 'cleaner' as UserRole,
    password: '',
  });
  const hasRole = useAuthStore((s) => s.hasRole);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await usersApi.list(params);
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingUser(null);
    setForm({
      username: '',
      email: '',
      full_name: '',
      phone: '',
      role: 'cleaner',
      password: '',
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          full_name: form.full_name,
          phone: form.phone || null,
          role: form.role,
          password: form.password || undefined,
        });
      } else {
        await usersApi.create({
          ...form,
          password: form.password || 'default123',
        });
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail || '操作失败');
    }
  };

  const roleStats = {
    admin: users.filter((u) => u.role === 'admin').length,
    supervisor: users.filter((u) => u.role === 'supervisor').length,
    cleaner: users.filter((u) => u.role === 'cleaner').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users size={24} />
            人员管理
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            管理管理员、主管、保洁员账号和权限
          </p>
        </div>
        {hasRole('admin') && (
          <button onClick={handleCreate} className="btn-primary gap-2 self-start">
            <Plus size={16} />
            新增人员
          </button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => setRoleFilter('all')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            roleFilter === 'all' && 'ring-2 ring-primary-500'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-sm text-gray-500">全部人员</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setRoleFilter('supervisor')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            roleFilter === 'supervisor' && 'ring-2 ring-purple-500'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{roleStats.supervisor}</div>
              <div className="text-sm text-gray-500">调度主管</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setRoleFilter('cleaner')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            roleFilter === 'cleaner' && 'ring-2 ring-teal-500'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Star size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{roleStats.cleaner}</div>
              <div className="text-sm text-gray-500">保洁员</div>
            </div>
          </div>
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名、用户名、邮箱..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* 用户列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    人员
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    角色
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    联系方式
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    技能
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  {hasRole('admin') && (
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={hasRole('admin') ? 6 : 5} className="px-5 py-16 text-center text-gray-400">
                      暂无匹配人员
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              user.full_name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('badge', ROLE_COLORS[user.role])}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {user.phone && (
                            <div className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Phone size={11} />
                              {user.phone}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Mail size={11} />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.skills && user.skills.length > 0 ? (
                            user.skills.slice(0, 4).map((s, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">未设置</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {user.is_active ? (
                          <span className="badge bg-green-100 text-green-700">
                            <Check size={10} className="inline mr-1" />
                            在职
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-600">
                            <X size={10} className="inline mr-1" />
                            已停用
                          </span>
                        )}
                      </td>
                      {hasRole('admin') && (
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleEdit(user)}
                            className="btn-outline gap-1 text-xs py-1 px-2"
                          >
                            <Edit3 size={12} />
                            编辑
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? '编辑人员' : '新增人员'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">用户名 *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="input"
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <label className="label">邮箱 *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                    disabled={!!editingUser}
                  />
                </div>
              </div>
              <div>
                <label className="label">姓名 *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">手机号</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">角色 *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="input"
                    disabled={!hasRole('admin')}
                  >
                    <option value="cleaner">保洁员</option>
                    <option value="supervisor">调度主管</option>
                    <option value="admin">系统管理员</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">{editingUser ? '重置密码（留空则不变）' : '初始密码'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input"
                  placeholder={editingUser ? '' : '默认 default123'}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                {editingUser ? '保存修改' : '创建账号'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
