import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { statsApi, alertsApi, ordersApi } from '@/api'
import { StatusBadge, AlertStatusBadge } from '@/components/Badges'
import { formatDate } from '@/utils'

export function DashboardPage() {
  const [overview, setOverview] = useState<any>(null)
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [o, a, ord] = await Promise.all([
        statsApi.overview(),
        alertsApi.list({ page_size: 5 }).then((r) => r.items),
        ordersApi.list({ page_size: 5, page: 1 }).then((r) => r.items),
      ])
      setOverview(o)
      setRecentAlerts(a)
      setRecentOrders(ord)
    } catch (e) {
      console.error(e)
    }
  }

  const statsCards = [
    { label: '今日补货单', value: overview?.today?.total_orders ?? 0, icon: '📦', color: 'text-primary-600' },
    { label: '运输中', value: overview?.today?.in_transit ?? 0, icon: '🚚', color: 'text-indigo-600' },
    { label: '待质检', value: overview?.today?.pending_qc ?? 0, icon: '🔍', color: 'text-orange-600' },
    { label: '未关闭异常', value: overview?.alerts?.open_count ?? 0, icon: '🌡️', color: 'text-red-600' },
    { label: '未解决差异', value: overview?.discrepancies?.unresolved_count ?? 0, icon: '⚠️', color: 'text-rose-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              </div>
              <div className="text-3xl opacity-60">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">最近补货单</h3>
            <Link to="/orders" className="link text-sm">查看全部 →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-th">单号</th>
                  <th className="table-th">门店</th>
                  <th className="table-th">计划日期</th>
                  <th className="table-th">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="table-td">
                      <Link to="/orders/$orderId" params={{ orderId: String(o.id) }} className="link font-medium">
                        {o.order_no}
                      </Link>
                    </td>
                    <td className="table-td">{o.store_name}</td>
                    <td className="table-td">{formatDate(o.planned_date)}</td>
                    <td className="table-td">
                      <StatusBadge status={o.status} />
                      {o.has_alerts && <span className="ml-1 text-red-500 text-xs">🌡️</span>}
                      {o.has_discrepancies && <span className="ml-1 text-orange-500 text-xs">⚠️</span>}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="table-td text-center text-slate-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">最近温度异常</h3>
            <Link to="/alerts" className="link text-sm">查看全部 →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">实际温度</th>
                  <th className="table-th">范围</th>
                  <th className="table-th">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentAlerts.map((a) => (
                  <tr key={a.id}>
                    <td className="table-td">
                      <Link to="/alerts/$alertId" params={{ alertId: String(a.id) }} className="link font-medium">
                        #{a.id}
                      </Link>
                    </td>
                    <td className="table-td text-red-600 font-medium">{a.actual_temp}°C</td>
                    <td className="table-td text-slate-500">{a.min_temp}~{a.max_temp}°C</td>
                    <td className="table-td"><AlertStatusBadge status={a.status} /></td>
                  </tr>
                ))}
                {recentAlerts.length === 0 && (
                  <tr><td colSpan={4} className="table-td text-center text-slate-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {overview?.status_distribution_7d && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">近7日状态分布</h3>
          </div>
          <div className="card-body flex flex-wrap gap-3">
            {Object.entries(overview.status_distribution_7d).map(([k, v]) => (
              <div key={k} className="px-4 py-2 bg-slate-50 rounded-md border border-slate-200">
                <div className="text-xs text-slate-500">{k}</div>
                <div className="text-lg font-semibold text-slate-800">{v as number}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
