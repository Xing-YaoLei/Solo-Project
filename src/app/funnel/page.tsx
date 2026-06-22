'use client'

import { useState, useEffect } from 'react'
import { Calendar, Building2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import FunnelChart from '@/components/funnel/funnel-chart'
import FirstResolutionCard from '@/components/funnel/first-resolution-card'
import ConclusionSidebar from '@/components/funnel/conclusion-sidebar'
import type { FunnelStage, FunnelStageKey, FunnelData } from '@/lib/types'

const departments = ['全部部门', '信息技术部', '风控合规部', '运营管理部', '采购部', '财务部']

export default function FunnelPage() {
  const router = useRouter()
  const [selectedStage, setSelectedStage] = useState<FunnelStageKey | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [department, setDepartment] = useState('全部部门')
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFunnelData()
  }, [startDate, endDate, department])

  const fetchFunnelData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (department) params.set('department', department)

      const res = await fetch(`/api/funnel?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setFunnelData(data)
      }
    } catch (error) {
      console.error('Failed to fetch funnel data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="漏斗报表" />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>
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
              onClick={fetchFunnelData}
              disabled={loading}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-slate-500">加载中...</div>
              </div>
            ) : !funnelData ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-slate-500">暂无数据</div>
              </div>
            ) : (
              <div className="flex gap-6">
                <div className="flex-1 space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-sm font-bold text-navy-900">整改跟踪漏斗</h2>
                    <FunnelChart stages={funnelData.stages} />
                  </div>
                  <FirstResolutionCard
                    rate={funnelData.firstResolutionRate}
                    trend={funnelData.firstResolutionTrend}
                  />
                </div>
                <div className="w-80 shrink-0">
                  <div className="sticky top-24">
                    <ConclusionSidebar
                      stages={funnelData.stages}
                      selectedStage={selectedStage}
                      onSelectStage={setSelectedStage}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
