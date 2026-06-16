import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Pill, DoorOpen, CalendarCheck } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '风险监测' },
  { to: '/medication', icon: Pill, label: '用药清单' },
  { to: '/visits', icon: DoorOpen, label: '探访记录' },
  { to: '/activities', icon: CalendarCheck, label: '活动签到' },
];

export default function Sidebar() {
  return (
    <aside className="w-[220px] h-full bg-[#1B2A4A] border-r border-white/[0.08] flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-white/[0.08]">
        <h1 className="text-lg font-bold text-white/90 leading-tight">
          养老护理
          <br />
          风险监测
        </h1>
        <p className="text-xs text-white/40 mt-1 font-[JetBrains_Mono,monospace]">
          BedRisk Monitor
        </p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#253B5E] text-amber-400 font-semibold'
                  : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.08]">
        <p className="text-[10px] text-white/30 font-[JetBrains_Mono,monospace]">
          v1.0.0 · MP0251
        </p>
      </div>
    </aside>
  );
}
