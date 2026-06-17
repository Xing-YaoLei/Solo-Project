'use client'

import Sidebar from './Sidebar'
import { useAppStore } from '@/store/useAppStore'
import { Menu, User } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              养老护理用药提醒分派台
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">护理员</span>
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
