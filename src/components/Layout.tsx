import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Settings,
  User,
  LogOut,
  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const Layout: React.FC = () => {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '数据总览', icon: LayoutDashboard, roles: ['admin', 'manager', 'teacher'] },
    { path: '/analysis', label: '数据分析', icon: BarChart3, roles: ['admin', 'manager', 'teacher'] },
    { path: '/workbench', label: '个人工作台', icon: Briefcase, roles: ['teacher'] },
    { path: '/import', label: '数据导入', icon: Database, roles: ['admin', 'manager'] },
    { path: '/caliber', label: '口径管理', icon: Settings, roles: ['admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-dark-900/90 backdrop-blur-xl border-r border-dark-700/50 flex flex-col">
        <div className="p-6 border-b border-dark-700/50">
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
              题库练习看板
            </span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-400 hover:bg-dark-800/60 hover:text-white'
                )
              }
            >
              <item.icon size={20} className={cn(
                'transition-transform duration-200',
                'group-hover:scale-110'
              )} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-dark-800/40 rounded-xl mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-400">
                {user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '管理层' : '教师'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-dark-900/50 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-8">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {filteredNavItems.find((item) => item.path === window.location.pathname)?.label || '题库练习看板'}
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-800/60 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-dark-300">系统运行正常</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
