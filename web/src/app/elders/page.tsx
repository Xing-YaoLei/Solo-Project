'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { getElders } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import CareLevelBadge from '@/components/CareLevelBadge'
import { Search } from 'lucide-react'

const careLevels = ['', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5']
const riskLevels = ['', 'HIGH', 'MEDIUM', 'LOW']

const careLevelLabels: Record<string, string> = {
  '': '全部护理等级',
  LEVEL_1: '一级护理',
  LEVEL_2: '二级护理',
  LEVEL_3: '三级护理',
  LEVEL_4: '四级护理',
  LEVEL_5: '五级护理',
}

const riskLevelLabels: Record<string, string> = {
  '': '全部风险等级',
  HIGH: '高危',
  MEDIUM: '中危',
  LOW: '低危',
}

const avatarColors = [
  'bg-teal-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-indigo-600',
]

export default function EldersPage() {
  const [search, setSearch] = useState('')
  const [careFilter, setCareFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  const { data: eldersData, isLoading } = useQuery({
    queryKey: ['elders', careFilter, riskFilter],
    queryFn: () => {
      const params: Record<string, string> = { limit: '100' }
      if (careFilter) params.careLevel = careFilter
      if (riskFilter) params.fallRiskLevel = riskFilter
      return getElders(params)
    },
  })

  const elders = eldersData?.data ?? eldersData ?? []

  const filtered = elders.filter((e: any) =>
    e.name.includes(search)
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索老人姓名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={careFilter}
          onChange={(e) => setCareFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {careLevels.map((l) => (
            <option key={l} value={l}>
              {careLevelLabels[l]}
            </option>
          ))}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {riskLevels.map((l) => (
            <option key={l} value={l}>
              {riskLevelLabels[l]}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((elder: any, i: number) => {
            const isHighRisk = elder.fallRiskLevel === 'HIGH'
            const isMedRisk = elder.fallRiskLevel === 'MEDIUM'
            return (
              <Link
                key={elder.id}
                href={`/elders/${elder.id}`}
                className={`bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fade-in-up border-l-4 ${
                  isHighRisk
                    ? 'border-l-red-600 animate-pulse-border'
                    : isMedRisk
                    ? 'border-l-orange-500'
                    : 'border-l-transparent'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      avatarColors[i % avatarColors.length]
                    }`}
                  >
                    {elder.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">
                      {elder.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {elder.age}岁 · {elder.roomNumber}房
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CareLevelBadge level={elder.careLevel} />
                  <StatusBadge
                    status={elder.fallRiskLevel}
                    variant="risk"
                    pulse={isHighRisk}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
