import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { alertsApi } from '@/api'
import { AlertStatusBadge, SeverityBadge } from '@/components/Badges'
import { formatDateTime, formatTemp } from '@/utils'
import type { TemperatureAlert, TemperatureAlertStatus } from '@/types'
import { ALERT_STATUS_LABEL } from '@/types'

export function AlertsListPage() {
  const [items, setItems] = useState<TemperatureAlert[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<TemperatureAlertStatus | ''>('')
  const [severity, setSeverity] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [page, pageSize, status, severity])

  async function load() {
    setLoading(true)
    try {
      const res = await alertsApi.list({
        page, page_size: pageSize,
        status: status || undefined,
        severity: severity || undefined,
      })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="select w-auto"
          value={status}
          onChange={(e) => { setStatus(e.target.value as TemperatureAlertStatus | ''); setPage(1) }}
        >
          <option value="">全部状态</option>
          {Object.entries(ALERT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="select w-auto"
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1) }}
        >
          <option value="">全部严重程度</option>
          <option value="warning">警告</option>
          <option value="critical">严重</option>
        </select>
        <button className="btn-secondary" onClick={load}>刷新</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">ID</th>
                <th className="table-th">关联单号</th>
                <th className="table-th">严重程度</th>
                <th className="table-th">实际温度</th>
                <th className="table-th">允许范围</th>
                <th className="table-th">来源</th>
                <th className="table-th">状态</th>
                <th className="table-th">创建时间</th>
                <th className="table-th">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr><td colSpan={9} className="table-td text-center text-slate-400 py-8">加载中...</td></tr>
              )}
              {!loading && items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono">#{a.id}</td>
                  <td className="table-td">
                    <Link to="/orders/$orderId" params={{ orderId: String(a.order_id) }} className="link">
                      查看单据
                    </Link>
                  </td>
                  <td className="table-td"><SeverityBadge severity={a.severity} /></td>
                  <td className="table-td text-red-600 font-medium">{formatTemp(a.actual_temp)}</td>
                  <td className="table-td">{a.min_temp}~{a.max_temp}°C</td>
                  <td className="table-td">{a.source_type === 'auto' ? '自动检测' : '人工录入'}</td>
                  <td className="table-td"><AlertStatusBadge status={a.status} /></td>
                  <td className="table-td text-slate-500">{formatDateTime(a.created_at)}</td>
                  <td className="table-td">
                    <Link to="/alerts/$alertId" params={{ alertId: String(a.id) }} className="link text-sm">详情</Link>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={9} className="table-td text-center text-slate-400 py-8">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">共 {total} 条</div>
          <div className="flex items-center gap-2">
            <select className="select w-auto" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n} 条/页</option>)}
            </select>
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
            <span className="text-sm text-slate-600 px-2">{page} / {totalPages || 1}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
        </div>
      </div>
    </div>
  )
}
