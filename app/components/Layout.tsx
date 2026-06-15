import { Link, NavLink, useLocation } from "@remix-run/react";
import { useState } from "react";
import { cn } from "~/components/ui";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  mobile?: boolean;
  desktop?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "场状态", icon: "📊" },
  { to: "/reminders", label: "提醒名单", icon: "🔔" },
  { to: "/calendar", label: "日历时段", icon: "📅" },
  { to: "/appointments/new", label: "录入预约", icon: "➕" },
  { to: "/appointments", label: "预约列表", icon: "📋", desktop: true },
  { to: "/conflicts", label: "冲突处理", icon: "⚠️", desktop: true },
  { to: "/checkin", label: "快速签到", icon: "✅", mobile: true },
  { to: "/analytics", label: "数据分析", icon: "📈", desktop: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-gray-900 text-lg hidden sm:inline">试听预约结算台</span>
              <span className="font-bold text-gray-900 text-lg sm:hidden">试听预约</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.filter((i) => !i.mobile).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )
                  }
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-2 py-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium",
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 h-16">
          {[
            { to: "/", label: "场状态", icon: "📊" },
            { to: "/reminders", label: "提醒", icon: "🔔" },
            { to: "/appointments/new", label: "录入", icon: "➕" },
            { to: "/checkin", label: "签到", icon: "✅" },
            { to: "/calendar", label: "日历", icon: "📅" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  isActive ? "text-indigo-600" : "text-gray-500"
                )
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="md:hidden h-16" />
    </div>
  );
}
