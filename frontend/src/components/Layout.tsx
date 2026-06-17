import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  UserCircle,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/activity', label: '活动签到', icon: Activity },
  { path: '/risk', label: '风险事件', icon: AlertTriangle },
  { path: '/residents', label: '老人档案', icon: Users },
  { path: '/settings/thresholds', label: '阈值配置', icon: Settings },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold text-slate-800">养老护理报表</h1>
                <p className="text-xs text-slate-500">床位排班漏斗</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <div className="p-3 border-t border-slate-200">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-primary-600" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">护理主管</p>
                <p className="text-xs text-slate-500 truncate">admin@eldercare.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">养老护理床位排班漏斗报表</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              数据更新时间：{new Date().toLocaleString('zh-CN')}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
