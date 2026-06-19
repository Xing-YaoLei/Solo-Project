import { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical, UserPlus, Shield, ShieldHalf } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'FRONTLINE',
    department: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [page, keyword, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/users', { params });
      setUsers(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/users', newUser);
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'FRONTLINE',
        department: '',
      });
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.message || '创建失败');
    }
  };

  const toggleUserStatus = async (id: number, isActive: boolean) => {
    if (!confirm(`确定要${isActive ? '禁用' : '启用'}该用户吗？`)) return;
    try {
      await api.patch(`/users/${id}`, { isActive: !isActive });
      fetchUsers();
    } catch (e) {
      alert('操作失败');
    }
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: '系统管理员',
      MANAGER: '运营经理',
      FRONTLINE: '一线人员',
    };
    return roles[role] || role;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'MANAGER':
        return <ShieldHalf className="w-4 h-4 text-blue-500" />;
      default:
        return <UserPlus className="w-4 h-4 text-gray-500" />;
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户名、姓名、邮箱..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-10 w-72"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-36"
          >
            <option value="">全部角色</option>
            <option value="ADMIN">管理员</option>
            <option value="MANAGER">经理</option>
            <option value="FRONTLINE">一线人员</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">总用户数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">管理员</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">一线人员</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {users.filter(u => u.role === 'FRONTLINE').length}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">部门</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">最后登录</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{user.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {user.username} · {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm text-gray-700">{getRoleText(user.role)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.department || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge',
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {user.isActive ? '正常' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN')
                        : '从未登录'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className={cn(
                            'text-sm',
                            user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                          )}
                        >
                          {user.isActive ? '禁用' : '启用'}
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">新增用户</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">用户名 *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="input mt-1"
                    placeholder="请输入用户名"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">密码 *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="input mt-1"
                    placeholder="请输入密码"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700">姓名 *</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="input mt-1"
                  placeholder="请输入姓名"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">邮箱</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="input mt-1"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">手机号</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="input mt-1"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700">角色</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="input mt-1"
                  >
                    <option value="FRONTLINE">一线人员</option>
                    <option value="MANAGER">运营经理</option>
                    <option value="ADMIN">系统管理员</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700">部门</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="input mt-1"
                    placeholder="请输入部门"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="btn btn-primary flex-1"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
