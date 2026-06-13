import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { statsApi, basicApi } from '@/api'
import { StatusBadge } from '@/components/Badges'
import { formatDate, formatPercent, classNames } from '@/utils'
import type { StatsTemperatureRate, StatsTemperatureDrillDown, Store } from '@/types'
import dayjs from 'dayjs'

export function StatsPage() {
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(14, 'day').format('YYYY-MM-DD'))
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [storeId, setStoreId] = useState<number | ''>('')
  const [drillDate, setDrillDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [stores, setStores] = useState<Store[]>([])
  const [tempRates, setTempRates] = useState<StatsTemperatureRate[]>([])
  const [drilldown, setDrilldown] = useState<StatsTemperatureDrillDown[]>([])
  const [byStore, setByStore] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)

  useEffect(() => {
    basicApi.listStores().then(setStores).catch(() => {})
    statsApi.overview().then(setOverview).catch(() => {})
  }, [])

  useEffect(() => {
    statsApi.temperatureRate({
      date_from: dateFrom, date_to: dateTo,
      store_id: storeId || undefined,
    }).then(setTempRates).catch(() => {})
    statsApi.byStore({
      date_from: dateFrom, date_to: dateTo,
    }).then(setByStore).catch(() => {})
  }, [dateFrom, dateTo, storeId])

  useEffect(() => {
    statsApi.temperatureDrilldown(drillDate, storeId || undefined).then(setDrilldown).catch(() => {})
  }, [drillDate, storeId])

  const maxRate = Math.max(1, ...tempRates.map((r) => r.total_orders))
  const avgRate = tempRates.length > 0
    ? tempRates.reduce((s, r) => s + r.rate, 0) / tempRates.length
    : 1

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-slate-800">筛选条件</h3></div>
        <div className="card-body flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">开始日期</label>
            <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">结束日期</label>
            <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">门店</label>
            <select className="select" value={storeId} onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">全部</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="今日补货单" value={overview.today?.total_orders ?? 0} />
          <StatCard label="运输中" value={overview.today?.in_transit ?? 0} />
          <StatCard label="待质检" value={overview.today?.pending_qc ?? 0} color="text-orange-600" />
          <StatCard label="期间平均温控合格率" value={formatPercent(avgRate)} color={avgRate >= 0.95 ? 'text-green-600' : 'text-red-600'} />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">温控合格率趋势</h3>
          <span className="text-sm text-slate-500">{formatDate(dateFrom)} ~ {formatDate(dateTo)}</span>
        </div>
        <div className="card-body">
          {tempRates.length === 0 ? (
            <div className="text-center text-slate-400 py-12">暂无数据</div>
          ) : (
            <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
              {tempRates.map((r) => {
                const h = (r.total_orders / maxRate) * 100
                const qualifiedHeight = (r.qualified_orders / maxRate) * 100
                return (
                  <div key={r.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 40 }}>
                    <div className="w-full relative flex items-end justify-center" style={{ height: 160 }}>
                      <div className="w-5 bg-slate-200 rounded-t" style={{ height: `${h}%` }} />
                      <div
                        className={classNames(
                          'w-5 rounded-t absolute bottom-0',
                          r.rate >= 0.95 ? 'bg-emerald-500' : r.rate >= 0.8 ? 'bg-yellow-500' : 'bg-red-500',
                        )}
                        style={{ height: `${qualifiedHeight}%` }}
                        title={`${r.qualified_orders}/${r.total_orders} = ${formatPercent(r.rate)}`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 w-10 text-center truncate" title={formatDate(r.date)}>
                      {r.date.slice(5)}
                    </div>
                    <div className={classNames(
                      'text-[10px] font-medium',
                      r.rate >= 0.95 ? 'text-emerald-600' : r.rate >= 0.8 ? 'text-yellow-600' : 'text-red-600',
                    )}>
                      {formatPercent(r.rate)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">各门店温控情况</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">门店</th>
                <th className="table-th">补货单数</th>
                <th className="table-th">异常数</th>
                <th className="table-th">温控合格率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {byStore.map((s) => (
                <tr key={s.store_id}>
                  <td className="table-td font-medium">{s.store_code} - {s.store_name}</td>
                  <td className="table-td">{s.total_orders}</td>
                  <td className="table-td text-red-600">{s.alert_count}</td>
                  <td className={classNames('table-td font-medium',
                    s.temperature_rate >= 0.95 ? 'text-green-600' : s.temperature_rate >= 0.8 ? 'text-yellow-600' : 'text-red-600',
                  )}>
                    {formatPercent(s.temperature_rate)}
                  </td>
                </tr>
              ))}
              {byStore.length === 0 && (
                <tr><td colSpan={4} className="table-td text-center text-slate-400 py-6">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">单据下钻 - 存在温控异常的单据</h3>
          <div className="flex items-center gap-2">
            <input type="date" className="input w-auto text-sm" value={drillDate} onChange={(e) => setDrillDate(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">单号</th>
                <th className="table-th">门店</th>
                <th className="table-th">异常次数</th>
                <th className="table-th">最高温度</th>
                <th className="table-th">最低温度</th>
                <th className="table-th">状态</th>
                <th className="table-th">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {drilldown.map((d) => (
                <tr key={d.order_id}>
                  <td className="table-td font-medium">{d.order_no}</td>
                  <td className="table-td">{d.store_name}</td>
                  <td className="table-td text-red-600 font-medium">{d.alert_count}</td>
                  <td className="table-td text-red-600">{formatTemp(d.max_temp)}</td>
                  <td className="table-td">{formatTemp(d.min_temp)}</td>
                  <td className="table-td"><StatusBadge status={d.status} /></td>
                  <td className="table-td">
                    <Link to="/orders/$orderId" params={{ orderId: String(d.order_id) }} className="link text-sm">
                      查看单据
                    </Link>
                  </td>
                </tr>
              ))}
              {drilldown.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center text-slate-400 py-6">该日期无温控异常单据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-slate-800' }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={classNames('text-2xl font-bold mt-1', color)}>{value}</div>
    </div>
  )
}
