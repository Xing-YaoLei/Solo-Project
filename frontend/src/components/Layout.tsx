import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '管理层',
  teacher: '教师',
  student: '学生',
};

export default function Layout() {
  const { user, logout, hasRole } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '工作台', icon: '📊', roles: ['admin', 'manager', 'teacher', 'student'] },
    { path: '/study-progress', label: '学习进度', icon: '📈', roles: ['admin', 'manager', 'teacher', 'student'] },
    { path: '/todos', label: '待办事项', icon: '📋', roles: ['admin', 'manager', 'teacher', 'student'] },
    { path: '/reminders', label: '提醒规则', icon: '🔔', roles: ['admin', 'manager'] },
    { path: '/courses', label: '课程管理', icon: '📚', roles: ['admin', 'teacher'] },
    { path: '/questions', label: '题库管理', icon: '❓', roles: ['admin', 'teacher'] },
    { path: '/tags', label: '标签管理', icon: '🏷️', roles: ['admin', 'teacher'] },
  ];

  const visibleItems = menuItems.filter(item => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary-600">题库练习跟进台</h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
              <p className="text-xs text-gray-500">{roleLabels[user?.role || 'student']}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
