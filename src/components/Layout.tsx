import { Link, Outlet, useLocation } from "react-router-dom"
import { Home, BarChart3 } from "lucide-react"

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-charcoal">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal-dark/95 backdrop-blur-sm border-b border-amber/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-amber/20 flex items-center justify-center">
              <span className="text-amber font-serif font-bold text-sm">试</span>
            </div>
            <span className="font-serif text-lg text-amber glow-text group-hover:text-amber-light transition-colors">
              试驾调度 · 解谜训练
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                isActive("/")
                  ? "bg-amber/15 text-amber"
                  : "text-gray-400 hover:text-amber hover:bg-amber/5"
              }`}
            >
              <Home size={16} />
              <span>首页</span>
            </Link>
            <Link
              to="/stats"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                isActive("/stats")
                  ? "bg-amber/15 text-amber"
                  : "text-gray-400 hover:text-amber hover:bg-amber/5"
              }`}
            >
              <BarChart3 size={16} />
              <span>统计</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
