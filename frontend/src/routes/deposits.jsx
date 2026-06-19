import React, { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Search, Wallet, Plus, TrendingUp } from 'lucide-react'
import { api } from '../lib/api'
import { DEPOSIT_STATUS, ORDER_STATUS } from '../lib/constants'
import { Pagination, EmptyState, StatusBadge, Modal } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/deposits')({
  component: DepositsPage,
})

function DepositsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [data, setData] = useState({ items: [], total: 0 })

  useEffect(() => { load() }, [page, filters])

  async function load() {
    const p = { page, page_size: 10, ...filters }
    if (!p.keyword) delete p.keyword
    if (!p.status) delete p.status
    const d = await api.listOrders(p)
    setData(d)
  }

  const depositOrders = data.items.filter(o => Number(o.deposit_amount) > 0)
  const stats = {
    total: data.items.reduce((s, o) => s + Number(o.deposit_amount || 0), 0),
    unpaid: data.items.filter(o => Number(o.deposit_amount) > 0 && o.deposit?.status === 'unpaid').length,
    paid: data.items.filter(o => o.deposit?.status === 'paid').length,
    refunded: data.items.filter(o => ['refunded', 'partially_refunded'].includes(o.deposit?.status)).length,
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">押金明细</h1>
        <p className="text-sm text-gray-500 mt-1">统一查看所有订单的押金收付情况，包含支付、退还、扣款明细与流水号</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">押金总额</p>
          <p className="text-2xl font-bold text-gray-900">¥{stats.total.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">待收</p>
          <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">已收</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">已退</p>
          <p className="text-2xl font-bold text-primary-600">{stats.refunded}</p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="搜索订单号/客户..."
            value={filters.keyword}
            onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setPage(1) }} />
        </div>
        <select className="input max-w-[150px]" value={filters.status}
          onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
          <option value="">全部押金状态</option>
          {Object.entries(DEPOSIT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState title="暂无订单" icon={Wallet} />
        ) : (
          <>
            <div className="table-wrapper border-0">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">订单</th>
                    <th className="th">套餐/入住</th>
                    <th className="th">应付押金</th>
                    <th className="th">已收</th>
                    <th className="th">已退</th>
                    <th className="th">扣款</th>
                    <th className="th">状态</th>
                    <th className="th">支付方式/流水</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(o => (
                    <tr key={o.id} className={Number(o.deposit_amount) > 0 ? '' : 'opacity-50'}>
                      <td className="td">
                        <p className="font-mono text-xs text-primary-600">{o.order_no}</p>
                        <p className="text-xs text-gray-500">{o.customer_name} · {o.customer_phone}</p>
                      </td>
                      <td className="td text-xs">
                        <p className="font-medium">{o.package?.name?.slice(0, 16)}...</p>
                        <p className="text-gray-400">{o.check_in_date} → {o.check_out_date}</p>
                      </td>
                      <td className="td font-semibold">¥{Number(o.deposit_amount || 0).toFixed(2)}</td>
                      <td className="td text-emerald-600 font-medium">¥{Number(o.deposit?.paid_amount || 0).toFixed(2)}</td>
                      <td className="td text-primary-600 font-medium">¥{Number(o.deposit?.refunded_amount || 0).toFixed(2)}</td>
                      <td className="td text-red-500 font-medium">¥{Number(o.deposit?.deducted_amount || 0).toFixed(2)}</td>
                      <td className="td">
                        {Number(o.deposit_amount) > 0 && o.deposit
                          ? <StatusBadge status={o.deposit.status} map={DEPOSIT_STATUS} />
                          : Number(o.deposit_amount) > 0
                            ? <span className="badge bg-red-100 text-red-600">待创建</span>
                            : <span className="badge bg-gray-100 text-gray-400">无押金</span>
                        }
                      </td>
                      <td className="td text-xs text-gray-500">
                        {o.deposit?.payment_method && (
                          <>
                            <p>{{wechat:'微信',alipay:'支付宝',cash:'现金',card:'刷卡',bank:'银行转账'}[o.deposit.payment_method] || o.deposit.payment_method}</p>
                            {o.deposit.payment_ref && <p className="font-mono text-[10px] truncate max-w-[160px]" title={o.deposit.payment_ref}>{o.deposit.payment_ref}</p>}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
