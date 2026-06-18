import { NavLink, Outlet } from "react-router-dom"
import { LayoutDashboard, Car, GitCompare, TrendingDown } from "lucide-react"

const navItems = [
  { to: "/", label: "看板主页", icon: LayoutDashboard },
  { to: "/vehicles", label: "车辆档案", icon: Car },
  { to: "/diff", label: "数据差异", icon: GitCompare },
  { to: "/turnover", label: "库存周转", icon: TrendingDown },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      <aside
        className="flex w-56 shrink-0 flex-col border-r"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        <div className="flex h-14 items-center gap-2 border-b px-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-amber">
            <TrendingDown className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            过户材料看板
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "font-medium"
                    : "hover:bg-brand-hover"
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? "var(--accent-amber-dim)" : "transparent",
                color: isActive ? "var(--accent-amber)" : "var(--text-secondary)",
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-4 w-4" style={{ color: isActive ? "var(--accent-amber)" : undefined }} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4" style={{ borderColor: "var(--border-color)" }}>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            数据更新于
          </div>
          <div className="font-mono-mono mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            2025-12-19 14:30
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
