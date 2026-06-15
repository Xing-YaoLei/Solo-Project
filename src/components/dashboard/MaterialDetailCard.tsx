'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { materialDetails, campusCardRecords } from '@/lib/mock-data'
import { filterMaterialDetails, filterCampusCardRecords } from '@/lib/role-filter'
import type { Role, RoleScope } from '@/lib/types'
import { ArrowUpRight, ChevronDown } from 'lucide-react'

interface Props {
  role?: Role
  department?: string
}

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

export default function MaterialDetailCard({ role = 'admin', department }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const scope: RoleScope = { role, department }

  const filteredMaterials = useMemo(() => filterMaterialDetails(materialDetails, scope), [role, department])
  const filteredCards = useMemo(() => filterCampusCardRecords(campusCardRecords, scope), [role, department])

  return (
    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
        材料提交明细
      </h3>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {filteredMaterials.map((item) => {
          const isExpanded = expandedId === item.id
          const records = filteredCards.filter((r) => r.studentId === item.studentId)
          const status = statusConfig[item.status]
          const risk = riskConfig[item.riskLevel]

          return (
            <div key={item.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors duration-150"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium min-w-[60px]">{item.studentName}</span>
                  <span className="text-xs" style={{ color: 'var(--slate)' }}>{item.materialType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ color: status.color, backgroundColor: status.bg }}
                  >
                    {item.status}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1"
                    style={{ color: risk.color, backgroundColor: risk.bg }}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${item.riskLevel === 'high' ? 'animate-pulse-dot' : ''}`}
                      style={{ backgroundColor: risk.color }}
                    />
                    风险{risk.label}
                  </span>
                  <ChevronDown
                    size={14}
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
                  className="mx-3 mt-1 mb-1 p-3 rounded-lg text-xs"
                  style={{ backgroundColor: '#F8FAFC', borderLeft: '2px solid var(--amber)' }}
                >
                  <p className="font-medium mb-2" style={{ color: 'var(--navy)' }}>一卡通追溯</p>
                  <div className="space-y-1.5">
                    {records.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between">
                        <span style={{ color: 'var(--slate)' }}>
                          {rec.location}
                        </span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: 'var(--slate)' }}>
                            {new Date(rec.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {rec.isAnomaly && (
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
                            >
                              异常
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filteredMaterials.length === 0 && (
          <div className="text-center py-4 text-sm" style={{ color: 'var(--slate)' }}>
            当前角色无可见数据
          </div>
        )}
      </div>

      <Link
        href="/materials"
        className="flex items-center gap-1 text-xs font-medium mt-3 transition-colors duration-200"
        style={{ color: 'var(--amber)' }}
      >
        查看详情
        <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
