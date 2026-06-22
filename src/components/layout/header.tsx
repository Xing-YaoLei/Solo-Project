'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <h1 className="text-xl font-bold text-navy-900">{title}</h1>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
            审
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-navy-900">审计员</p>
            <span className="inline-block rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
              管理员
            </span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <User className="h-4 w-4" />
              个人资料
            </button>
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="h-4 w-4" />
              账号设置
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
