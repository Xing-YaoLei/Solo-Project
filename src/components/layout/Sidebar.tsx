'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  FileText,
  AlertTriangle,
  Share2,
  ChevronDown,
} from 'lucide-react'
import { useStore } from '@/store/use-store'
import type { Role } from '@/lib/types'

const navItems = [
  { label: '概览', href: '/', icon: LayoutDashboard },
  { label: '学生趋势', href: '/trend', icon: TrendingUp },
  { label: '成绩构成', href: '/composition', icon: PieChart },
  { label: '材料明细', href: '/materials', icon: FileText },
  { label: '导师异常', href: '/advisor-anomaly', icon: AlertTriangle },
]

const roleLabels: Record<Role, string> = {
  admin: '教务管理员',
  dean: '院系领导',
  advisor: '导师',
  student: '学生',
}

export default function Sidebar() {
  const pathname = usePathname()
  const currentRole = useStore((s) => s.currentRole)
  const setCurrentRole = useStore((s) => s.setCurrentRole)
  const toggleShareModal = useStore((s) => s.toggleShareModal)
  const [roleOpen, setRoleOpen] = useState(false)

  return (
    <aside
      className="w-64 min-h-screen flex flex-col relative"
      style={{
        background: 'linear-gradient(180deg, #1B2A4A 0%, #0F1A30 100%)',
        color: '#FFFFFF',
      }}
    >
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
          >
            <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
          </div>
          <span
            className="text-lg font-bold tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            成绩复核监测
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'rgba(42, 63, 106, 0.6)' : 'transparent',
                borderLeft: isActive ? '3px solid #F59E0B' : '3px solid transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
              }}
            >
              <Icon size={18} style={{ color: isActive ? '#F59E0B' : '#94A3B8' }} />
              {item.label}
            </Link>
          )
        })}

        <button
          onClick={toggleShareModal}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full"
          style={{ color: '#94A3B8', borderLeft: '3px solid transparent' }}
        >
          <Share2 size={18} />
          分享与导出
        </button>
      </nav>

      <div className="px-3 pb-6">
        <div className="relative">
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
            style={{
              backgroundColor: 'rgba(42, 63, 106, 0.4)',
              color: '#94A3B8',
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#F59E0B' }}
              />
              {roleLabels[currentRole]}
            </span>
            <ChevronDown
              size={16}
              style={{
                transform: roleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms',
              }}
            />
          </button>
          {roleOpen && (
            <div
              className="absolute bottom-full left-0 w-full mb-1 rounded-lg overflow-hidden shadow-lg"
              style={{ backgroundColor: '#2A3F6A' }}
            >
              {(Object.keys(roleLabels) as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setCurrentRole(role)
                    setRoleOpen(false)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors duration-150"
                  style={{
                    color: currentRole === role ? '#F59E0B' : '#94A3B8',
                    backgroundColor: currentRole === role ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  }}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
