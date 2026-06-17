import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Route,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { UserRoleType } from '@/types';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/route-planner', label: 'RoutePlanner', icon: Map },
  { path: '/trajectory', label: 'Trajectory', icon: Route },
  { path: '/work-orders', label: 'WorkOrders', icon: ClipboardList },
  { path: '/todo-pool', label: 'TodoPool', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/permissions', label: 'Permissions', icon: Shield },
];

const roleOptions: { value: UserRoleType; label: string }[] = [
  { value: 'tenant', label: '租客' },
  { value: 'butler', label: '管家' },
  { value: 'maintenance', label: '维修员' },
  { value: 'finance', label: '财务' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const currentUser = useAppStore((s) => s.currentUser);
  const setRole = useAppStore((s) => s.setRole);

  return (
    <aside
      className={`flex flex-col h-screen bg-navy-800 border-r border-navy-700 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center h-14 px-4 border-b border-navy-700">
        <span className="text-amber-500 font-heading font-bold text-lg truncate">
          {sidebarCollapsed ? '派' : '派单台'}
        </span>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center w-full h-10 px-4 transition-colors duration-200 ${
                isActive
                  ? 'border-l-3 border-amber-500 bg-navy-700/50 text-amber-400'
                  : 'border-l-3 border-transparent text-navy-500 hover:text-amber-400 hover:bg-navy-700/30'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-body truncate">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-navy-700 p-2">
        {!sidebarCollapsed && (
          <select
            value={currentUser.role}
            onChange={(e) => setRole(e.target.value as UserRoleType)}
            className="w-full bg-navy-900 text-amber-400 text-xs rounded px-2 py-1.5 border border-navy-700 focus:outline-none focus:border-amber-500"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 mt-1 rounded text-navy-500 hover:text-amber-400 hover:bg-navy-700/30 transition-colors duration-200"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
