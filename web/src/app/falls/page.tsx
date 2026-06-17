'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { getFalls } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Filter } from 'lucide-react'
import { formatDateTime } from '@/app/helpers'

const riskOptions = [
  { value: '', label: '全部风险' },
  { value: 'HIGH', label: '高危' },
  { value: 'MEDIUM', label: '中危' },
  { value: 'LOW', label: '低危' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'REPORTED', label: '已报告' },
  { value: 'IN_REVIEW', label: '复核中' },
  { value: 'REVIEWED', label: '已复核' },
  { value: 'CLOSED', label: '已关闭' },
]

export default function FallsPage() {
  const [riskFilter, setRiskFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: falls = [], isLoading } = useQuery({
    queryKey: ['falls', riskFilter, statusFilter],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (riskFilter) params.riskLevel = riskFilter
      if (statusFilter) params.status = statusFilter
      return getFalls(params)
    },
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {riskOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">老人</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">事件时间</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">地点</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">风险等级</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {falls.map((f: any) => {
                const isHigh = f.riskLevel === 'HIGH'
                const isMed = f.riskLevel === 'MEDIUM'
                return (
                  <tr
                    key={f.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${
                      isHigh ? 'border-l-red-600 animate-pulse-border' : isMed ? 'border-l-orange-500' : 'border-l-transparent'
                    }`}
                    onClick={() => window.location.href = `/falls/${f.id}`}
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">{f.elder?.name ?? '未知'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{formatDateTime(f.incidentTime)}</td>
                    <td className="py-3 px-4 text-slate-600">{f.location}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={f.riskLevel} variant="risk" pulse={isHigh} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={f.status} variant="fall" />
                    </td>
                  </tr>
                )
              })}
              {falls.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">暂无跌倒事件</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
