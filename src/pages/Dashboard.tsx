import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, AlertTriangle, Percent, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import {
  getSettlementTrend,
  getSettlementSummary,
  getTrainingCompletion,
  getRejectionRecords,
  getRejectionReasons,
} from '@/services/api'
import type { SettlementTrend, SettlementSummary } from '@/types'
import IndicatorCard from '@/components/IndicatorCard'
import SettlementTrendChart from '@/components/SettlementTrendChart'
import CompletionRateChart from '@/components/CompletionRateChart'
import RejectionReasonChart from '@/components/RejectionReasonChart'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-32 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-20" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
      <div className="h-[300px] bg-gray-100 rounded" />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const viewFilters = useAppStore((s) => s.viewFilters)

  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [trend, setTrend] = useState<SettlementTrend[]>([])
  const [completionData, setCompletionData] = useState<{ name: string; rate: number; target: number }[]>([])
  const [rejectionData, setRejectionData] = useState<{ name: string; value: number; count: number; pendingAmount: number; processingAmount: number; resolvedAmount: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      getSettlementSummary(viewFilters),
      getSettlementTrend('month', viewFilters),
      getTrainingCompletion(viewFilters),
      getRejectionReasons(viewFilters),
    ]).then(([summaryRes, trendRes, prescriptions, reasonItems]) => {
      if (cancelled) return
      setSummary(summaryRes)
      setTrend(trendRes)

      const completionItems = prescriptions
        .filter((p) => p.status === 'active')
        .slice(0, 8)
        .map((p) => ({
          name: p.prescriptionName,
          rate: Math.round(p.completionRate * 10) / 10,
          target: 80,
        }))
      setCompletionData(completionItems)

      setRejectionData(reasonItems.slice(0, 6))

      setLoading(false)
    })

    return () => { cancelled = true }
  }, [viewFilters])

  const handlePeriodClick = (period: string) => {
    navigate(`/drilldown?period=${encodeURIComponent(period)}`)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    )
  }

  const pendingAmount = summary?.rejectedPendingAmount || 0
  const processingAmount = summary?.rejectedProcessingAmount || 0
  const resolvedAmount = summary?.rejectedResolvedAmount || 0

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IndicatorCard
          title="医保结算总额"
          value={summary ? `¥${summary.totalAmount.toLocaleString()}` : '-'}
          change={summary?.totalAmountChange ?? 0}
          icon={<DollarSign size={20} />}
        />
        <IndicatorCard
          title="拒付金额"
          value={summary ? `¥${summary.rejectedAmount.toLocaleString()}` : '-'}
          subtext={
            <div className="mt-1 text-[11px] text-gray-500 space-x-2">
              <span className="inline-flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1" />待处理 ¥{pendingAmount.toLocaleString()}</span>
              <span className="inline-flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />处理中 ¥{processingAmount.toLocaleString()}</span>
              <span className="inline-flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />已解决 ¥{resolvedAmount.toLocaleString()}</span>
            </div>
          }
          change={summary?.rejectedAmountChange ?? 0}
          icon={<AlertTriangle size={20} />}
        />
        <IndicatorCard
          title="拒付率"
          value={summary ? summary.rejectionRate.toFixed(1) : '-'}
          unit="%"
          change={summary?.rejectionRateChange ?? 0}
          icon={<Percent size={20} />}
        />
        <IndicatorCard
          title="训练完成率"
          value={summary ? summary.completionRate.toFixed(1) : '-'}
          unit="%"
          change={summary?.completionRateChange ?? 0}
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      {/* Trend chart */}
      <SettlementTrendChart data={trend} onPeriodClick={handlePeriodClick} />

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionRateChart data={completionData} />
        <RejectionReasonChart data={rejectionData} />
      </div>
    </div>
  )
}
