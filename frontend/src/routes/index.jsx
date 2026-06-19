import React, { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Package, ShoppingCart, AlertTriangle, Wallet, BadgeCheck,
  TrendingUp, ArrowUpRight, ChevronRight, Warehouse, Calendar
} from 'lucide-react'
import { api } from '../lib/api'
import { StatCard, SectionTitle, EmptyState } from '../components/ui'
import { ORDER_STATUS, ANOMALY_STATUS, ANOMALY_TYPE, IMPACT_LEVEL } from '../lib/constants'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    packages: 0, activeOrders: 0, todayCheckIn: 0, todayCheckOut: 0,
    anomalies: 0, pendingDeposit: 0, verifiedCount: 0, conversion: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentAnomalies, setRecentAnomalies] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const [
          { items: pkgs, total: pkgTotal },
          { items: orders },
          { items: anomalies },
        ] = await Promise.all([
          api.listPackages({ page: 1, page_size: 100 }),
          api.listOrders({ page: 1, page_size: 10 }),
          api.listAnomalies({ page: 1, page_size: 5, status: 'open' }),
        ])
        const conv = await api.getConversion({
          period_start: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
          period_end: new Date().toISOString().slice(0, 10),
        }).catch(() => ({}))
        setStats({
          packages: pkgTotal || 0,
          activeOrders: orders.filter(o =>
            ['pending', 'confirmed', 'checked_in'].includes(o.status)
          ).length,
          todayCheckIn: orders.filter(o => {
            const today = new Date().toISOString().slice(0, 10)
            return o.check_in_date === today && o.status !== 'cancelled'
          }).length,
          todayCheckOut: orders.filter(o => {
            const today = new Date().toISOString().slice(0, 10)
            return o.check_out_date === today && o.status === 'checked_in'
          }).length,
          anomalies: anomalies.total || 0,
          pendingDeposit: orders.filter(o => o.deposit_amount > 0 && !o.deposit).length,
          verifiedCount: orders.filter(o => o.status === 'checked_in' || o.status === 'checked_out').length,
          conversion: conv.overall_conversion_rate || 0,
        })
        setRecentOrders(orders.slice(0, 8))
        setRecentAnomalies(anomalies.items || [])
      } catch (e) {
        console.warn(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const quickLinks = [
    { to: '/packages', icon: Package, label: '套餐管理', desc: '配置套餐与价格规则' },
    { to: '/stay-dates', icon: Calendar, label: '入住日期', desc: '开放/关闭可售日期' },
    { to: '/inventories', icon: Warehouse, label: '库存管理', desc: '设置每日库存与单价' },
    { to: '/orders', icon: ShoppingCart, label: '订单跟进', desc: '处理并跟踪订单状态' },
    { to: '/verifications', icon: BadgeCheck, label: '核销记录', desc: '入住核销与退房登记' },
    { to: '/deposits', icon: Wallet, label: '押金管理', desc: '押金收取与退还扣款' },
    { to: '/anomalies', icon: AlertTriangle, label: '异常单', desc: '超卖等异常跟进处理' },
    { to: '/analytics', icon: TrendingUp, label: '转化率分析', desc: '套餐转化与销售分析' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 card animate-pulse bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="在售套餐" value={stats.packages} icon={Package} color="primary" sub="所有上架套餐" />
        <StatCard label="进行中订单" value={stats.activeOrders} icon={ShoppingCart} color="blue" sub="待确认+已确认+已入住" />
        <StatCard label="待处理异常" value={stats.anomalies} icon={AlertTriangle} color="red" sub="待处理/处理中" />
        <StatCard label="本月整体转化率" value={`${stats.conversion}%`} icon={TrendingUp} color="emerald" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="今日入住" value={stats.todayCheckIn} icon={BadgeCheck} color="emerald" />
        <StatCard label="今日退房" value={stats.todayCheckOut} icon={ChevronRight} color="purple" />
        <StatCard label="待收押金" value={stats.pendingDeposit} icon={Wallet} color="amber" />
        <StatCard label="累计核销" value={stats.verifiedCount} icon={BadgeCheck} color="primary" />
      </div>

      <SectionTitle title="快速入口" />
      <div className="grid grid-cols-4 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, desc }) => (
          <button
            key={to}
            onClick={() => nav({ to })}
            className="group card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 flex items-center gap-1">
                {label}
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <SectionTitle
            title="最近订单"
            desc="最新的订单状态与跟进记录"
            action={
              <button className="btn-ghost text-xs" onClick={() => nav({ to: '/orders' })}>
                查看全部 <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          {recentOrders.length === 0 ? (
            <EmptyState title="暂无订单" desc="点击快速入口创建第一份订单" />
          ) : (
            <div className="table-wrapper">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">订单号</th>
                    <th className="th">客户</th>
                    <th className="th">入住日期</th>
                    <th className="th">金额</th>
                    <th className="th">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => nav({ to: '/orders' })}
                    >
                      <td className="td font-mono text-xs text-primary-600">{o.order_no}</td>
                      <td className="td">
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-xs text-gray-500">{o.customer_phone}</p>
                      </td>
                      <td className="td text-xs text-gray-600">
                        {o.check_in_date} → {o.check_out_date}
                      </td>
                      <td className="td font-semibold text-gray-900">¥{o.final_amount}</td>
                      <td className="td">
                        <span className={`badge ${ORDER_STATUS[o.status]?.color}`}>
                          {ORDER_STATUS[o.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <SectionTitle
            title="待处理异常"
            action={
              <button className="btn-ghost text-xs" onClick={() => nav({ to: '/anomalies' })}>
                全部 <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          {recentAnomalies.length === 0 ? (
            <EmptyState title="无待处理异常" desc="一切运转正常 🎉" />
          ) : (
            <div className="space-y-3">
              {recentAnomalies.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 cursor-pointer"
                  onClick={() => nav({ to: '/anomalies' })}
                >
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] text-white font-medium ${ANOMALY_TYPE[a.anomaly_type]?.color}`}>
                      {ANOMALY_TYPE[a.anomaly_type]?.label}
                    </span>
                    <span className={`badge ${IMPACT_LEVEL[a.impact_level]?.color}`}>
                      {IMPACT_LEVEL[a.impact_level]?.label}
                    </span>
                    <span className={`badge ml-auto ${ANOMALY_STATUS[a.status]?.color}`}>
                      {ANOMALY_STATUS[a.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.anomaly_no}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
