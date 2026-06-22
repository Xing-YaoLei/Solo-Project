'use client'

import { useState, useEffect } from 'react'
import { Building2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import BoardChart from '@/components/board/board-chart'
import BoardGroupCard from '@/components/board/board-group'
import {
  BOARD_GROUP_BY_OPTIONS,
  REVIEW_OPINION_COLORS,
  CLOSURE_REASON_COLORS,
  TICKET_STATUS_COLORS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { BoardGroupBy, BoardData } from '@/lib/types'

const groupColors: Record<BoardGroupBy, Record<string, string>> = {
  review_opinion: REVIEW_OPINION_COLORS,
  closure_reason: CLOSURE_REASON_COLORS,
  status: TICKET_STATUS_COLORS,
}

const departments = ['全部部门', '信息技术部', '风控合规部', '运营管理部', '采购部', '财务部']
const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'pending_remediation', label: '待整改' },
  { value: 'in_remediation', label: '整改中' },
  { value: 'pending_review', label: '待复核' },
  { value: 'closed', label: '已关闭' },
]

export default function BoardPage() {
  const router = useRouter()
  const [groupBy, setGroupBy] = useState<BoardGroupBy>('review_opinion')
  const [statusFilter, setStatusFilter] = useState('')
  const [department, setDepartment] = useState('全部部门')
  const [boardData, setBoardData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBoardData()
  }, [groupBy, statusFilter, department])

  const fetchBoardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('groupBy', groupBy)
      if (statusFilter) params.set('status', statusFilter)
      if (department) params.set('department', department)

      const res = await fetch(`/api/board?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBoardData(data)
      }
    } catch (error) {
      console.error('Failed to fetch board data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`)
  }

  const colors = groupColors[groupBy]

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="看板" />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center gap-1">
              {BOARD_GROUP_BY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGroupBy(opt.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    groupBy === opt.value
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchBoardData}
                disabled={loading}
                className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-slate-500">加载中...</div>
              </div>
            ) : !boardData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-slate-500">暂无数据</div>
              </div>
            ) : (
              <div className="flex gap-6">
                <div className="w-2/5 shrink-0">
                  <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-navy-900">分布统计</h2>
                    <BoardChart groupBy={groupBy} groups={boardData.groups} />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h2 className="mb-3 text-sm font-bold text-navy-900">分组明细</h2>
                  {boardData.groups.map((group) => (
                    <BoardGroupCard
                      key={group.key}
                      group={group}
                      color={(colors as any)[group.key] ?? '#64748B'}
                      onTicketClick={handleTicketClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
