'use client'

import { useState } from 'react'
import Link from 'next/link'
import { materialDetails, campusCardRecords } from '@/lib/mock-data'
import { ArrowLeft, ChevronDown, Filter } from 'lucide-react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'

const statusOptions = ['全部', '待审核', '审核中', '已通过', '已退回'] as const
const riskOptions = ['全部', '低', '中', '高'] as const

const statusConfig: Record<string, { color: string; bg: string }> = {
  '待审核': { color: '#D97706', bg: '#FFFBEB' },
  '审核中': { color: '#1B2A4A', bg: '#E8EBF0' },
  '已通过': { color: '#059669', bg: '#ECFDF5' },
  '已退回': { color: '#DC2626', bg: '#FEF2F2' },
}

const riskConfig: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: '#10B981', bg: '#ECFDF5' },
  medium: { label: '中', color: '#F59E0B', bg: '#FFFBEB' },
  high: { label: '高', color: '#EF4444', bg: '#FEF2F2' },
}

const riskLabelToLevel: Record<string, string> = {
  '低': 'low',
  '中': 'medium',
  '高': 'high',
}

export default function MaterialsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [riskFilter, setRiskFilter] = useState<string>('全部')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = materialDetails.filter((item) => {
    if (statusFilter !== '全部' && item.status !== statusFilter) return false
    if (riskFilter !== '全部' && item.riskLevel !== riskLabelToLevel[riskFilter]) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium transition-colors duration-200"
          style={{ color: 'var(--amber)' }}
        >
          <ArrowLeft size={16} />
          返回
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          申请材料明细
        </h1>
        <div className="ml-auto">
          <RefreshIndicator />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: 'var(--slate)' }} />
          <span className="text-xs" style={{ color: 'var(--slate)' }}>状态</span>
        </div>
        <div className="flex gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
              style={{
                backgroundColor: statusFilter === s ? 'var(--navy)' : 'var(--bg-card)',
                color: statusFilter === s ? '#FFFFFF' : 'var(--slate)',
                border: '1px solid var(--border)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Filter size={14} style={{ color: 'var(--slate)' }} />
          <span className="text-xs" style={{ color: 'var(--slate)' }}>风险</span>
        </div>
        <div className="flex gap-2">
          {riskOptions.map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
              style={{
                backgroundColor: riskFilter === r ? 'var(--navy)' : 'var(--bg-card)',
                color: riskFilter === r ? '#FFFFFF' : 'var(--slate)',
                border: '1px solid var(--border)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-primary)' }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>序号</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>学生姓名</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>学号</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>材料类型</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>提交时间</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>状态</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>风险等级</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => {
              const isExpanded = expandedId === item.id
              const records = campusCardRecords.filter((r) => r.studentId === item.studentId)
              const status = statusConfig[item.status]
              const risk = riskConfig[item.riskLevel]

              return (
                <tr key={item.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td colSpan={7} className="p-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center px-4 py-3">
                        <span className="w-12" style={{ color: 'var(--slate)' }}>{index + 1}</span>
                        <span className="w-20 font-medium">{item.studentName}</span>
                        <span className="w-28" style={{ color: 'var(--slate)' }}>{item.studentId}</span>
                        <span className="w-24">{item.materialType}</span>
                        <span className="w-36" style={{ color: 'var(--slate)' }}>
                          {new Date(item.submittedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="w-20">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ color: status.color, backgroundColor: status.bg }}
                          >
                            {item.status}
                          </span>
                        </span>
                        <span className="w-20">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1"
                            style={{ color: risk.color, backgroundColor: risk.bg }}
                          >
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${item.riskLevel === 'high' ? 'animate-pulse-dot' : ''}`}
                              style={{ backgroundColor: risk.color }}
                            />
                            {risk.label}
                          </span>
                        </span>
                        <ChevronDown
                          size={14}
                          className="ml-auto"
                          style={{
                            color: 'var(--slate)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms',
                          }}
                        />
                      </div>
                    </button>
                    {isExpanded && records.length > 0 && (
                      <div
                        className="mx-4 mb-3 p-4 rounded-lg text-xs"
                        style={{ backgroundColor: '#F8FAFC', borderLeft: '3px solid var(--amber)' }}
                      >
                        <p className="font-medium mb-3" style={{ color: 'var(--navy)' }}>一卡通追溯明细</p>
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="pb-2 text-left font-medium" style={{ color: 'var(--slate)' }}>时间</th>
                              <th className="pb-2 text-left font-medium" style={{ color: 'var(--slate)' }}>地点</th>
                              <th className="pb-2 text-left font-medium" style={{ color: 'var(--slate)' }}>是否异常</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((rec) => (
                              <tr key={rec.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                <td className="py-2" style={{ color: 'var(--slate)' }}>
                                  {new Date(rec.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2">{rec.location}</td>
                                <td className="py-2">
                                  {rec.isAnomaly ? (
                                    <span
                                      className="px-2 py-0.5 rounded text-xs font-medium"
                                      style={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
                                    >
                                      异常
                                    </span>
                                  ) : (
                                    <span
                                      className="px-2 py-0.5 rounded text-xs font-medium"
                                      style={{ color: '#059669', backgroundColor: '#ECFDF5' }}
                                    >
                                      正常
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--slate)' }}>
            无匹配记录
          </div>
        )}
      </div>
    </div>
  )
}
