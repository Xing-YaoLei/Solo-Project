import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FileText,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { path: '/dashboard', label: '风险监测总览', icon: LayoutDashboard },
  { path: '/audit', label: '取数链路审计', icon: Database },
  { path: '/complaints', label: '客诉明细管理', icon: FileText },
  { path: '/reports', label: '多维报表分析', icon: BarChart3 },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-primary-950/95 backdrop-blur-xl border-r border-white/10 z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <h1 className="font-display text-xl font-bold text-white truncate">
            客诉风险监测
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="glass-card p-4">
            <p className="text-xs text-white/50 mb-2">系统状态</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-sm text-white/70">运行正常</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
