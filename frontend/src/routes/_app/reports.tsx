import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Download, BarChart3, TrendingDown, FileText, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import type { ReworkRateReport } from '@/types'
import dayjs from 'dayjs'

function ReportsPage() {
  const now = dayjs()
  const [year, setYear] = useState(now.year())
  const [month, setMonth] = useState(now.month() + 1)
  const [report, setReport] = useState<ReworkRateReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/rework-rate', { params: { year, month } })
      setReport(res.data)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await api.get('/reports/download-history', { params: { limit: 10 } })
      setHistory(res.data)
    } catch {}
  }

  useEffect(() => {
    loadReport()
    loadHistory()
  }, [year, month])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await api.get('/reports/rework-rate/download', {
        params: { year, month },
        responseType: 'blob',
      })
      const fileName = res.headers['x-content-filename'] || `返修率报表_${year}${String(month).padStart(2, '0')}.xlsx`
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      loadHistory()
    } finally {
      setDownloading(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.year() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const getRateColor = (rate: number) => {
    if (rate <= 2) return 'text-green-600'
    if (rate <= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={24} className="text-primary-600" />
            月底复盘
          </h1>
          <p className="text-slate-500 mt-1">返修率统计分析，报表下载记录筛选口径和生成者</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <select
            className="input"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading || !report}
          >
            <Download size={16} />
            {downloading ? '下载中...' : '下载Excel'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">加载中...</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">总工单数</p>
                    <p className="text-2xl font-bold text-slate-900">{report.total_orders}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle size={22} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">返修工单数</p>
                    <p className="text-2xl font-bold text-slate-900">{report.rework_orders}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      report.rework_rate <= 2
                        ? 'bg-green-100'
                        : report.rework_rate <= 5
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    }`}
                  >
                    <TrendingDown
                      size={22}
                      className={
                        report.rework_rate <= 2
                          ? 'text-green-600'
                          : report.rework_rate <= 5
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">返修率</p>
                    <p className={`text-2xl font-bold ${getRateColor(report.rework_rate)}`}>
                      {report.rework_rate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">返修明细</h2>
              <span className="text-sm text-slate-500">共 {report.details.length} 条</span>
            </div>
            <div className="card-body p-0">
              {report.details.length === 0 ? (
                <p className="p-8 text-center text-slate-500">本月暂无返修记录</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>工单号</th>
                      <th>车牌号</th>
                      <th>车型</th>
                      <th>故障描述</th>
                      <th>技师</th>
                      <th>返修原因</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map((d, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{d.order_no}</td>
                        <td>{d.plate_number}</td>
                        <td className="text-sm text-slate-600">{d.brand_model}</td>
                        <td className="text-sm text-slate-600 max-w-xs truncate">{d.complaint || '-'}</td>
                        <td>{d.technician || '-'}</td>
                        <td className="text-sm text-red-600">{d.reason || '-'}</td>
                        <td className="text-sm text-slate-500">{d.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">报表下载历史</h2>
              <span className="text-sm text-slate-500">记录筛选口径和生成者</span>
            </div>
            <div className="card-body p-0">
              {history.length === 0 ? (
                <p className="p-5 text-center text-slate-500">暂无下载记录</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>报表类型</th>
                      <th>筛选条件</th>
                      <th>生成者</th>
                      <th>文件名</th>
                      <th>下载时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <span className="badge bg-blue-100 text-blue-700">
                            {h.report_type === 'rework_rate' ? '返修率报表' : h.report_type}
                          </span>
                        </td>
                        <td className="text-xs text-slate-600 max-w-xs">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">
                            {JSON.stringify(h.filter_criteria)}
                          </code>
                        </td>
                        <td>#{h.generated_by || '-'}</td>
                        <td className="text-sm text-slate-600">{h.file_name}</td>
                        <td className="text-sm text-slate-500">
                          {dayjs(h.created_at).format('YYYY-MM-DD HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-slate-500">暂无数据</p>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_app/reports')({
  component: ReportsPage,
})
