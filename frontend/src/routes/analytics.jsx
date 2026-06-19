import React, { useEffect, useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ReactECharts from 'echarts-for-react'
import { TrendingUp, BarChart3, Users, ShoppingCart, DollarSign, Target, Calendar } from 'lucide-react'
import { api } from '../lib/api'
import { SectionTitle, EmptyState, StatCard } from '../components/ui'

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const [period, setPeriod] = useState({
    start: (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return d.toISOString().slice(0, 10) })(),
    end: new Date().toISOString().slice(0, 10)
  })
  const [metrics, setMetrics] = useState(null)
  const [pkgData, setPkgData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [period])

  async function load() {
    setLoading(true)
    try {
      const [m, p] = await Promise.all([
        api.getConversion({ period_start: period.start, period_end: period.end }),
        api.getPackageConversion({ period_start: period.start, period_end: period.end })
      ])
      setMetrics(m)
      setPkgData(p)
    } catch (e) { console.warn(e) }
    finally { setLoading(false) }
  }

  const conversionOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 30, top: 40, bottom: 60 },
    legend: { data: ['下单数', '确认数', '入住数'], top: 0 },
    xAxis: {
      type: 'category',
      data: pkgData.map(p => p.package_name.slice(0, 12) + (p.package_name.length > 12 ? '...' : '')),
      axisLabel: { interval: 0, rotate: -20, fontSize: 11 }
    },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      { name: '下单数', type: 'bar', data: pkgData.map(p => p.metrics.total_orders), itemStyle: { color: '#93c5fd' } },
      { name: '确认数', type: 'bar', data: pkgData.map(p => p.metrics.confirmed_orders), itemStyle: { color: '#60a5fa' } },
      { name: '入住数', type: 'bar', data: pkgData.map(p => p.metrics.checked_in_orders), itemStyle: { color: '#3b82f6' } },
    ]
  }), [pkgData])

  const rateOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 40, top: 40, bottom: 60 },
    legend: { data: ['订单确认率', '确认入住率', '整体转化率'], top: 0 },
    xAxis: {
      type: 'category',
      data: pkgData.map(p => p.package_name.slice(0, 12) + (p.package_name.length > 12 ? '...' : '')),
      axisLabel: { interval: 0, rotate: -20, fontSize: 11 }
    },
    yAxis: { type: 'value', name: '转化率(%)', max: 100 },
    series: [
      { name: '订单确认率', type: 'line', smooth: true, data: pkgData.map(p => p.metrics.order_to_confirm_rate), itemStyle: { color: '#f59e0b' } },
      { name: '确认入住率', type: 'line', smooth: true, data: pkgData.map(p => p.metrics.confirm_to_checkin_rate), itemStyle: { color: '#10b981' } },
      { name: '整体转化率', type: 'line', smooth: true, data: pkgData.map(p => p.metrics.overall_conversion_rate), itemStyle: { color: '#3b82f6' }, lineStyle: { width: 3 } },
    ]
  }), [pkgData])

  const revenueOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n¥{c}', fontSize: 11 },
      data: pkgData.map(p => ({ name: p.package_name.slice(0, 8), value: Number(p.metrics.total_revenue) }))
    }]
  }), [pkgData])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" /> 套餐转化率分析
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            多维度分析各套餐的下单→确认→入住转化漏斗、销售额表现、客单价等
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gray-100 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <input type="date" className="bg-transparent outline-none px-1 text-gray-700"
              value={period.start} onChange={e => setPeriod({ ...period, start: e.target.value })} />
            <span className="text-gray-400">至</span>
            <input type="date" className="bg-transparent outline-none px-1 text-gray-700"
              value={period.end} onChange={e => setPeriod({ ...period, end: e.target.value })} />
          </div>
          {[7, 30, 90].map(d => (
            <button key={d} className="btn-ghost text-xs"
              onClick={() => {
                const end = new Date()
                const start = new Date(); start.setDate(start.getDate() - d + 1)
                setPeriod({ start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) })
              }}>
              {d}天
            </button>
          ))}
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-6 gap-3">
          <StatCard label="咨询量(估算)" value={metrics.total_inquiries} icon={Users} color="primary" />
          <StatCard label="下单数" value={metrics.total_orders} icon={ShoppingCart} color="blue" />
          <StatCard label="确认数" value={metrics.confirmed_orders} icon={Target} color="amber" />
          <StatCard label="入住数" value={metrics.checked_in_orders} icon={BarChart3} color="emerald" />
          <StatCard label="总营收" value={`¥${Number(metrics.total_revenue).toLocaleString()}`} icon={DollarSign} color="purple" />
          <StatCard label="平均客单价" value={`¥${Number(metrics.avg_order_value).toFixed(0)}`} icon={TrendingUp} color="red" />
        </div>
      )}

      {metrics && (
        <div className="card p-5">
          <SectionTitle title="整体转化漏斗" />
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '咨询→下单', v: metrics.inquiry_to_order_rate, color: 'bg-primary-500' },
              { label: '下单→确认', v: metrics.order_to_confirm_rate, color: 'bg-amber-500' },
              { label: '确认→入住', v: metrics.confirm_to_checkin_rate, color: 'bg-emerald-500' },
              { label: '整体转化', v: metrics.overall_conversion_rate, color: 'bg-gradient-to-r from-primary-500 to-emerald-500' },
            ].map(f => (
              <div key={f.label} className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
                <p className="text-xs text-gray-500 mb-2">{f.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-3">{f.v}%</p>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full ${f.color} transition-all`} style={{ width: `${Math.min(f.v, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
            <strong>📌 口径说明：</strong>
            咨询量按下单数×3估算（行业平均值）；整体转化率 = 入住数 ÷ 估算咨询量 × 100%；
            总营收不含已取消和已退款订单。详细口径请参考数据导出中的「口径补充」Sheet。
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="h-80 card animate-pulse bg-gray-50" />
          <div className="h-80 card animate-pulse bg-gray-50" />
        </div>
      ) : pkgData.length === 0 ? (
        <EmptyState title="暂无数据" desc="请先创建订单后查看分析" icon={BarChart3} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5">
              <SectionTitle title="各套餐订单漏斗" desc="下单/确认/入住 订单数量对比" />
              <ReactECharts option={conversionOption} style={{ height: '300px' }} />
            </div>
            <div className="card p-5">
              <SectionTitle title="各套餐转化率对比" desc="关键转化比率" />
              <ReactECharts option={rateOption} style={{ height: '300px' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5 col-span-1">
              <SectionTitle title="营收占比" desc="按套餐总营收" />
              <ReactECharts option={revenueOption} style={{ height: '340px' }} />
            </div>

            <div className="card p-5 col-span-2 overflow-hidden">
              <SectionTitle title="套餐转化明细" desc="按销售额倒序排列，点击导出获取完整Excel" />
              <div className="table-wrapper">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">套餐</th>
                      <th className="th text-right">下单</th>
                      <th className="th text-right">确认</th>
                      <th className="th text-right">入住</th>
                      <th className="th text-right">取消</th>
                      <th className="th text-right">确认率</th>
                      <th className="th text-right">入住率</th>
                      <th className="th text-right">整体转化</th>
                      <th className="th text-right">营收</th>
                      <th className="th text-right">客单价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkgData.map(p => (
                      <tr key={p.package_id} className="hover:bg-gray-50">
                        <td className="td font-medium truncate max-w-[200px]">{p.package_name}</td>
                        <td className="td text-right">{p.metrics.total_orders}</td>
                        <td className="td text-right text-blue-600">{p.metrics.confirmed_orders}</td>
                        <td className="td text-right text-emerald-600">{p.metrics.checked_in_orders}</td>
                        <td className="td text-right text-red-500">{p.metrics.cancelled_orders}</td>
                        <td className="td text-right font-medium">{p.metrics.order_to_confirm_rate}%</td>
                        <td className="td text-right font-medium">{p.metrics.confirm_to_checkin_rate}%</td>
                        <td className="td text-right">
                          <span className={`font-semibold ${p.metrics.overall_conversion_rate >= 20 ? 'text-emerald-600' : p.metrics.overall_conversion_rate >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                            {p.metrics.overall_conversion_rate}%
                          </span>
                        </td>
                        <td className="td text-right font-semibold text-primary-600">
                          ¥{Number(p.metrics.total_revenue).toLocaleString()}
                        </td>
                        <td className="td text-right">¥{Number(p.metrics.avg_order_value).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
