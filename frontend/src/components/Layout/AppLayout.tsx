import { useState, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  Users,
  Building2,
  BarChart3,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABELS, ROLE_COLORS } from '@/utils/format';
import clsx from 'clsx';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'cleaner'] },
  { path: '/calendar', label: '排班日历', icon: Calendar, roles: ['admin', 'supervisor', 'cleaner'] },
  { path: '/schedules', label: '任务列表', icon: ClipboardList, roles: ['admin', 'supervisor', 'cleaner'] },
  { path: '/todos', label: '我的待办', icon: CheckSquare, roles: ['admin', 'supervisor', 'cleaner'] },
  { path: '/conflicts', label: '冲突管理', icon: AlertTriangle, roles: ['admin', 'supervisor'] },
  { path: '/users', label: '人员管理', icon: Users, roles: ['admin', 'supervisor'] },
  { path: '/apartments', label: '公寓管理', icon: Building2, roles: ['admin', 'supervisor'] },
  { path: '/reports', label: '数据报表', icon: BarChart3, roles: ['admin', 'supervisor'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || !currentUser || item.roles.includes(currentUser.role)
  );

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="h-full flex bg-gray-50">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'w-64' : 'w-20',
          'translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              保
            </div>
            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-gray-900 truncate">保洁排班跟进台</span>
                <span className="text-xs text-gray-500 truncate">长租公寓运营系统</span>
              </div>
            )}
          </div>
          <button
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={20} className={clsx('flex-shrink-0', isActive && 'text-primary-600')} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {currentUser && sidebarOpen && (['admin', 'supervisor'].includes(currentUser.role)) && (
          <div className="p-3 border-t border-gray-200">
            <Link
              to="/schedules/create"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus size={18} />
              创建排班
            </Link>
          </div>
        )}

        <div className="hidden lg:block p-2 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {filteredNavItems.find((n) => location.pathname === n.path || location.pathname.startsWith(n.path + '/'))?.label || '长租公寓保洁排班跟进台'}
            </h1>
          </div>

          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{currentUser.full_name}</div>
                  <div className="text-xs text-gray-500">{ROLE_LABELS[currentUser.role]}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    currentUser.full_name.charAt(0)
                  )}
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{currentUser.full_name}</div>
                      <div className="text-sm text-gray-500">{currentUser.email}</div>
                      <span className={clsx('mt-2 badge', ROLE_COLORS[currentUser.role])}>
                        {ROLE_LABELS[currentUser.role]}
                      </span>
                    </div>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      个人资料
                    </button>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
