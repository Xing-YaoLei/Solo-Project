import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Filter, Search, ArrowRight, X, CheckCircle2, Clock, MessageSquare } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import type { RejectionRecord, RemarkTask } from '@/types'
import { getRejectionRecords, upsertRemarkTask, updateConclusion } from '@/services/api'
import RejectionTable from '@/components/RejectionTable'
import RemarkPanel from '@/components/RemarkPanel'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | RemarkTask['status']

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
]

export default function RejectionPage() {
  const [records, setRecords] = useState<RejectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [searchText, setSearchText] = useState('')
  const [activeRejection, setActiveRejection] = useState<RejectionRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchRecords = () => {
    setLoading(true)
    getRejectionRecords().then((data) => {
      setRecords(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'all') {
        const taskStatus = r.remarkTask?.status ?? 'pending'
        if (taskStatus !== statusFilter) return false
      }
      if (dateStart && r.rejectionDate < dateStart) return false
      if (dateEnd && r.rejectionDate > dateEnd) return false
      if (searchText && !r.patientName.includes(searchText)) return false
      return true
    })
  }, [records, statusFilter, dateStart, dateEnd, searchText])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleProcess = (id: string) => {
    const record = records.find((r) => r.id === id)
    if (record) setActiveRejection(record)
  }

  const handleView = (id: string) => {
    const record = records.find((r) => r.id === id)
    if (record) setActiveRejection(record)
  }

  const handleSubmitRemark = async (rejectionId: string, data: { assignee: string; remark: string }) => {
    try {
      const updated = await upsertRemarkTask({
        rejectionId,
        content: data.remark,
        assignedTo: data.assignee,
        status: 'processing',
      })
      if (updated) {
        setRecords((prev) => prev.map((r) => (r.id === rejectionId ? updated : r)))
        setActiveRejection(updated)
        showToast('备注提交成功，任务已创建/更新')
      } else {
        showToast('提交失败，请重试', 'error')
      }
    } catch {
      showToast('提交失败，请重试', 'error')
    }
  }

  const handleSubmitConclusion = async (rejectionId: string, conclusion: string) => {
    try {
      const updated = await updateConclusion(rejectionId, conclusion)
      setRecords((prev) => prev.map((r) => (r.id === rejectionId ? updated : r)))
      setActiveRejection(null)
      showToast('处理结论已提交，任务已完成')
    } catch {
      showToast('提交失败，请重试', 'error')
    }
  }

  const patientTrendOption = (patientId: string) => {
    const patientRecords = records.filter((r) => r.patientId === patientId)
    const amounts = patientRecords.map((r) => r.rejectedAmount)
    const dates = patientRecords.map((r) => r.rejectionDate)
    return {
      grid: { top: 5, right: 5, bottom: 5, left: 5 },
      xAxis: { type: 'category' as const, show: false, data: dates },
      yAxis: { type: 'value' as const, show: false },
      series: [
        {
          type: 'line' as const,
          data: amounts,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#ef4444', width: 2 },
          areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.3)' }, { offset: 1, color: 'rgba(239,68,68,0.02)' }] } },
        },
      ],
      tooltip: { trigger: 'axis' as const, formatter: (params: unknown) => {
        const p = (params as { name: string; value: number }[])[0]
        return `${p.name}<br/>拒付金额: ¥${p.value.toLocaleString()}`
      }},
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6 flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">拒付任务中心</h1>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">状态</span>
        </div>
        <div className="flex gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === tab.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mx-2 h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">日期</span>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="mx-2 h-6 w-px bg-gray-200" />

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索患者姓名"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-48 rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-sm text-gray-500">
          <ArrowRight className="h-4 w-4" />
          共 <span className="font-medium text-gray-900">{filteredRecords.length}</span> 条记录
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        {['P001', 'P002', 'P003'].map((pid) => {
          const patientRecords = records.filter((r) => r.patientId === pid)
          if (patientRecords.length === 0) return null
          const patient = patientRecords[0]
          return (
            <div key={pid} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{patient.patientName}</p>
                <p className="text-xs text-gray-500">{patientRecords.length} 次拒付 · ¥{patientRecords.reduce((s, r) => s + r.rejectedAmount, 0).toLocaleString()}</p>
              </div>
              <div className="h-10 w-24">
                <ReactECharts option={patientTrendOption(pid)} style={{ height: 40, width: 96 }} opts={{ renderer: 'svg' }} />
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Clock className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      ) : (
        <RejectionTable data={filteredRecords} onProcess={handleProcess} onView={handleView} />
      )}

      <RemarkPanel
        rejection={activeRejection}
        onClose={() => setActiveRejection(null)}
        onSubmitRemark={handleSubmitRemark}
        onSubmitConclusion={handleSubmitConclusion}
      />

      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all',
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
