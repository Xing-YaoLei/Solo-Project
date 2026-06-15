'use client'

import { RotateCw } from 'lucide-react'
import { useStore } from '@/store/use-store'
import { useRefresh } from '@/hooks/use-refresh'

export default function RefreshIndicator() {
  const lastRefreshedAt = useStore((s) => s.lastRefreshedAt)
  const { refresh, isLoading } = useRefresh()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--slate)' }}>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: isLoading ? 'var(--amber)' : 'var(--emerald)' }}
        />
        <span>
          最近刷新: {new Date(lastRefreshedAt).toLocaleTimeString('zh-CN', { hour12: false })}
        </span>
      </div>
      <button
        onClick={refresh}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
        style={{
          backgroundColor: isLoading ? '#E8EBF0' : '#1B2A4A',
          color: isLoading ? '#64748B' : '#FFFFFF',
        }}
      >
        <RotateCw
          size={13}
          className={isLoading ? 'animate-spin' : ''}
        />
        {isLoading ? '刷新中' : '刷新'}
      </button>
    </div>
  )
}
