import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/route-planner': 'RoutePlanner',
  '/trajectory': 'Trajectory',
  '/work-orders': 'WorkOrders',
  '/todo-pool': 'TodoPool',
  '/reports': 'Reports',
  '/permissions': 'Permissions',
};

const roleLabels: Record<string, string> = {
  tenant: '租客',
  butler: '管家',
  maintenance: '维修员',
  finance: '财务',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const todoItems = useAppStore((s) => s.todoItems);
  const currentUser = useAppStore((s) => s.currentUser);

  const pendingCount = todoItems.filter((t) => t.status === 'pending').length;
  const title =
    routeTitles[location.pathname] ??
    Object.entries(routeTitles).find(
      ([path]) => path !== '/' && location.pathname.startsWith(path)
    )?.[1] ??
    'Dashboard';

  return (
    <header className="flex items-center h-14 px-6 bg-navy-800 border-b border-navy-700 shrink-0">
      <h1 className="text-white font-heading font-semibold text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-4">
        {pendingCount > 0 && (
          <button
            onClick={() => navigate('/todo-pool')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-danger/20 text-status-danger text-xs font-semibold hover:bg-status-danger/30 transition-colors"
          >
            <AlertTriangle size={14} />
            {pendingCount}
          </button>
        )}

        <button className="relative text-navy-500 hover:text-amber-400 transition-colors">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-amber-400 text-xs font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium leading-tight">
              {currentUser.name}
            </span>
            <span className="text-amber-500 text-[10px] leading-tight">
              {roleLabels[currentUser.role] ?? currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
