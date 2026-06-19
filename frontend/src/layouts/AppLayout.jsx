import React, { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  Home, Package, Calendar, Warehouse, ShoppingCart,
  BadgeCheck, Wallet, AlertTriangle, TrendingUp, Download,
  Menu, X, Mountain
} from 'lucide-react'

const menuItems = [
  { to: '/', icon: Home, label: '工作台' },
  { to: '/packages', icon: Package, label: '套餐与价格' },
  { to: '/stay-dates', icon: Calendar, label: '入住日期' },
  { to: '/inventories', icon: Warehouse, label: '库存管理' },
  { to: '/orders', icon: ShoppingCart, label: '订单跟进' },
  { to: '/verifications', icon: BadgeCheck, label: '核销记录' },
  { to: '/deposits', icon: Wallet, label: '押金明细' },
  { to: '/anomalies', icon: AlertTriangle, label: '异常单' },
  { to: '/analytics', icon: TrendingUp, label: '转化率分析' },
  { to: '/exports', icon: Download, label: '数据导出' },
]

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = useLocation({ select: (l) => l.pathname })

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-200 flex flex-col`}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-slate-700/50 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
            <Mountain className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[15px]">云宿跟进台</span>
              <span className="text-[11px] text-slate-400">Homestay Console</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = item.to === '/'
              ? pathname === '/'
              : pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-primary-500/20 text-primary-300 shadow-inner'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-700/50 p-3 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white text-xs"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <><X className="w-4 h-4" /> 收起侧栏</>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-800">
              旅游民宿套餐售卖跟进台
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary-50 text-primary-600 font-medium">
              v1.0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">今日 · {new Date().toLocaleDateString('zh-CN')}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
              管
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
