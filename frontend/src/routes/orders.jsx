import React, { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search, Plus, Filter, Eye, ChevronRight, ArrowRight,
  Clock, User, Phone, CalendarDays, BedDouble, Users,
  CreditCard, FileText, CheckCircle2, XCircle, UserCheck,
  LogOut, Activity, MessageSquare, BadgeCheck, Wallet,
  AlertCircle, TrendingUp
} from 'lucide-react'
import { api } from '../lib/api'
import {
  ORDER_STATUS, VERIFICATION_STATUS, DEPOSIT_STATUS,
  ANOMALY_TYPE, ANOMALY_STATUS, IMPACT_LEVEL, STATUS_FLOW
} from '../lib/constants'
import { Pagination, Modal, SectionTitle, EmptyState, StatusBadge } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState({ keyword: '', status: '', package_id: '' })
  const [data, setData] = useState({ items: [], total: 0 })
  const [packages, setPackages] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [statusLogs, setStatusLogs] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    package_id: '', customer_name: '', customer_phone: '', customer_id_card: '',
    check_in_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    check_out_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    nights: 2, guest_count: 2, room_count: 1,
    original_amount: '', discount_amount: 0, final_amount: '',
    deposit_amount: '', sales_channel: '官方小程序', sales_person: '', remark: '',
  })
  const [pricePreview, setPricePreview] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ to_status: '', operator: '', reason: '' })
  const [showDepositPay, setShowDepositPay] = useState(false)
  const [showDepositRefund, setShowDepositRefund] = useState(false)
  const [depositData, setDepositData] = useState(null)
  const [payForm, setPayForm] = useState({ paid_amount: '', payment_method: 'wechat', payment_ref: '', handler: '' })
  const [refundForm, setRefundForm] = useState({
    refund_amount: '', refund_method: 'wechat', refund_ref: '',
    deductions: [], handler: '', remark: ''
  })
  const [newDeduction, setNewDeduction] = useState({ item: '', amount: '', reason: '' })

  useEffect(() => {
    (async () => {
      const d = await api.listPackages({ page: 1, page_size: 100 })
      setPackages(d.items)
      if (d.items.length) setForm(f => ({ ...f, package_id: d.items[0].id, base_price: d.items[0].base_price }))
    })()
  }, [])

  useEffect(() => { load() }, [page, filters])

  async function load() {
    const p = { page, page_size: pageSize, ...filters }
    if (!p.status) delete p.status
    if (!p.keyword) delete p.keyword
    if (!p.package_id) delete p.package_id
    const d = await api.listOrders(p)
    setData(d)
  }

  async function openDetail(o) {
    setSelected(o)
    const [detail, logs] = await Promise.all([
      api.getOrder(o.id),
      api.getOrderStatusLogs(o.id)
    ])
    setDetail(detail)
    setStatusLogs(logs)
  }

  useEffect(() => {
    if (!form.package_id || !form.check_in_date || !form.check_out_date) return
    ;(async () => {
      try {
        const [price, avail] = await Promise.all([
          api.calculatePrice({ package_id: form.package_id, check_in: form.check_in_date, check_out: form.check_out_date }),
          api.checkInventory({ package_id: form.package_id, check_in: form.check_in_date, check_out: form.check_out_date, needed: form.room_count })
        ])
        setPricePreview(price)
        setAvailability(avail)
        if (!form.original_amount) setForm(f => ({ ...f, original_amount: price.total, final_amount: price.total }))
      } catch (e) { console.warn(e) }
    })()
  }, [form.package_id, form.check_in_date, form.check_out_date, form.room_count])

  useEffect(() => {
    const orig = Number(form.original_amount) || 0
    const disc = Number(form.discount_amount) || 0
    setForm(f => ({ ...f, final_amount: Math.max(0, orig - disc) }))
  }, [form.original_amount, form.discount_amount])

  useEffect(() => {
    if (form.check_in_date && form.check_out_date) {
      const n = Math.round((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000)
      if (n > 0) setForm(f => ({ ...f, nights: n }))
    }
  }, [form.check_in_date, form.check_out_date])

  async function submitOrder() {
    try {
      const pkg = packages.find(p => p.id == form.package_id)
      const payload = {
        ...form,
        package_id: Number(form.package_id),
        original_amount: Number(form.original_amount) || 0,
        discount_amount: Number(form.discount_amount) || 0,
        final_amount: Number(form.final_amount) || 0,
        deposit_amount: Number(form.deposit_amount) || 0,
        nights: Number(form.nights),
        guest_count: Number(form.guest_count),
        room_count: Number(form.room_count),
      }
      if (!availability?.available) {
        await toast.promise(Promise.resolve(), {
          success: '⚠️ 库存不足，但已强制创建订单并生成异常单',
          loading: '检测到超卖，系统自动记录异常单...',
          error: '出错了'
        })
      }
      const created = await api.createOrder(payload, form.sales_person || '系统用户')
      toast.success(`订单 ${created.order_no} 创建成功`)
      setShowCreate(false)
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function changeStatus() {
    try {
      await api.changeOrderStatus(selected.id, statusForm)
      toast.success('状态已更新')
      setShowStatusModal(false)
      await openDetail(selected)
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function doPay() {
    try {
      if (!depositData) return
      await api.payDeposit(depositData.id, {
        ...payForm,
        paid_amount: Number(payForm.paid_amount) || depositData.total_amount
      })
      toast.success('押金支付成功')
      setShowDepositPay(false)
      await openDetail(selected)
    } catch (e) { toast.error(e.message) }
  }

  async function doRefund() {
    try {
      if (!depositData) return
      const deductions = refundForm.deductions.map(d => ({
        item: d.item, amount: Number(d.amount), reason: d.reason
      }))
      await api.refundDeposit(depositData.id, {
        refund_amount: refundForm.refund_amount ? Number(refundForm.refund_amount) : undefined,
        refund_method: refundForm.refund_method,
        refund_ref: refundForm.refund_ref,
        deductions, handler: refundForm.handler, remark: refundForm.remark
      })
      toast.success('押金退款成功')
      setShowDepositRefund(false)
      await openDetail(selected)
    } catch (e) { toast.error(e.message) }
  }

  function openDepositPay(dep) {
    setDepositData(dep)
    setPayForm({ paid_amount: dep.total_amount - dep.paid_amount, payment_method: 'wechat', payment_ref: '', handler: '' })
    setShowDepositPay(true)
  }

  function openDepositRefund(dep) {
    setDepositData(dep)
    setRefundForm({
      refund_amount: (dep.paid_amount - dep.refunded_amount - dep.deducted_amount),
      refund_method: dep.payment_method || 'wechat',
      refund_ref: '', deductions: [], handler: '', remark: ''
    })
    setNewDeduction({ item: '', amount: '', reason: '' })
    setShowDepositRefund(true)
  }

  const currentStep = STATUS_FLOW.findIndex(s => s.key === selected?.status)
  const stats = {
    total: data.total,
    pending: data.items.filter(o => o.status === 'pending').length,
    confirmed: data.items.filter(o => o.status === 'confirmed').length,
    checked_in: data.items.filter(o => o.status === 'checked_in').length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">订单跟进台</h1>
          <p className="text-sm text-gray-500 mt-1">
            全流程订单管理：创建 → 确认 → 入住 → 退房，支持状态流转时间线、核销、押金、异常单联动
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> 新建订单
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">订单总数</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">待确认</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">已确认</p>
          <p className="text-2xl font-bold text-primary-600">{stats.confirmed}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">在住中</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.checked_in}</p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="订单号/客户名/手机号..."
            value={filters.keyword}
            onChange={e => { setFilters(f => ({ ...f, keyword: e.target.value })); setPage(1) }} />
        </div>
        <select className="input max-w-[150px]" value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}>
          <option value="">全部状态</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="input max-w-[220px]" value={filters.package_id}
          onChange={e => { setFilters(f => ({ ...f, package_id: e.target.value })); setPage(1) }}>
          <option value="">全部套餐</option>
          {packages.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className="btn-ghost ml-auto text-xs" onClick={load}>
          <Filter className="w-3 h-3" /> 重置
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 card overflow-hidden">
          {data.items.length === 0 ? (
            <EmptyState title="暂无订单" desc="点击右上角创建第一份订单" icon={FileText} />
          ) : (
            <>
              <div className="table-wrapper border-0">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">订单号</th>
                      <th className="th">客户</th>
                      <th className="th">入住日期</th>
                      <th className="th">金额</th>
                      <th className="th">状态</th>
                      <th className="th">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map(o => (
                      <tr
                        key={o.id}
                        className={`hover:bg-gray-50 cursor-pointer ${selected?.id === o.id ? 'bg-primary-50/60' : ''}`}
                        onClick={() => openDetail(o)}
                      >
                        <td className="td">
                          <p className="font-mono text-xs text-primary-600">{o.order_no}</p>
                          <p className="text-[11px] text-gray-400">{o.package?.name?.slice(0, 12)}...</p>
                        </td>
                        <td className="td">
                          <p className="font-medium">{o.customer_name}</p>
                          <p className="text-xs text-gray-500">{o.customer_phone}</p>
                        </td>
                        <td className="td text-xs text-gray-600">
                          <p>{o.check_in_date}</p>
                          <p className="text-gray-400">{o.nights}晚</p>
                        </td>
                        <td className="td">
                          <p className="font-semibold text-gray-900">¥{o.final_amount}</p>
                          {o.deposit_amount > 0 && (
                            <p className="text-[11px] text-amber-600">押 ¥{o.deposit_amount}</p>
                          )}
                        </td>
                        <td className="td">
                          <StatusBadge status={o.status} map={ORDER_STATUS} />
                        </td>
                        <td className="td">
                          <button className="btn-ghost text-xs" onClick={e => { e.stopPropagation(); openDetail(o) }}>
                            <Eye className="w-3 h-3" /> 查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
            </>
          )}
        </div>

        <div className="col-span-2">
          {!selected ? (
            <div className="card p-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Activity className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500">点击左侧订单查看详情</p>
              <p className="text-xs text-gray-400 mt-1">含状态流转、核销、押金等完整信息</p>
            </div>
          ) : !detail ? (
            <div className="card p-16 animate-pulse bg-gray-50" />
          ) : (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm text-primary-600">{detail.order_no}</p>
                    <p className="text-base font-semibold mt-0.5">{detail.package?.name}</p>
                    <p className="text-xs text-gray-500">{detail.package?.homestay_name}</p>
                  </div>
                  <StatusBadge status={detail.status} map={ORDER_STATUS} />
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">订单状态流转</p>
                  <div className="relative">
                    <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-200 z-0" />
                    {STATUS_FLOW.map((s, i) => {
                      const done = i <= currentStep
                      const current = i === currentStep
                      return (
                        <div key={s.key} className="relative z-10 flex items-start gap-3 py-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                            done ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
                          } ${current ? 'ring-4 ring-primary-100' : ''}`}>
                            {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</p>
                          </div>
                        </div>
                      )
                    })}
                    {['cancelled', 'refunded'].includes(detail.status) && (
                      <div className="relative z-10 flex items-start gap-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-medium text-red-600">
                            {detail.status === 'cancelled' ? '已取消' : '已退款'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-secondary w-full mt-3 text-sm"
                    onClick={() => {
                      setStatusForm({ to_status: '', operator: '', reason: '' })
                      setShowStatusModal(true)
                    }}
                  >
                    <Activity className="w-3.5 h-3.5" /> 变更状态
                  </button>
                </div>
              </div>

              <div className="p-5 border-b border-gray-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" /> 客户信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={User} label="姓名" value={detail.customer_name} />
                  <InfoRow icon={Phone} label="手机" value={detail.customer_phone} />
                  {detail.customer_id_card && (
                    <div className="col-span-2">
                      <InfoRow icon={CreditCard} label="证件号" value={detail.customer_id_card} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-b border-gray-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary-500" /> 入住信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={CalendarDays} label="入住" value={detail.check_in_date} />
                  <InfoRow icon={CalendarDays} label="退房" value={detail.check_out_date} />
                  <InfoRow icon={BedDouble} label="晚数" value={`${detail.nights}晚 × ${detail.room_count}间`} />
                  <InfoRow icon={Users} label="人数" value={`${detail.guest_count}人`} />
                </div>
              </div>

              <div className="p-5 border-b border-gray-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" /> 金额明细
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>原价总额</span>
                    <span>¥{detail.original_amount}</span>
                  </div>
                  {Number(detail.discount_amount) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>优惠</span>
                      <span>-¥{detail.discount_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>实收金额</span>
                    <span>¥{detail.final_amount}</span>
                  </div>
                  {Number(detail.deposit_amount) > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>押金</span>
                      <span>¥{detail.deposit_amount}</span>
                    </div>
                  )}
                </div>
                {(detail.sales_channel || detail.sales_person || detail.remark) && (
                  <div className="pt-3 space-y-1.5 text-xs text-gray-500 border-t border-gray-100">
                    {detail.sales_channel && <div>销售渠道：{detail.sales_channel}</div>}
                    {detail.sales_person && <div>销售：{detail.sales_person}</div>}
                    {detail.operator && <div>操作人：{detail.operator}</div>}
                    {detail.remark && <div className="pt-1 text-gray-700">备注：{detail.remark}</div>}
                  </div>
                )}
              </div>

              <div className="p-5 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-primary-500" /> 核销记录
                  </h4>
                </div>
                {detail.verification ? (
                  <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={detail.verification.status} map={VERIFICATION_STATUS} />
                      {detail.verification.verification_code && (
                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                          {detail.verification.verification_code}
                        </span>
                      )}
                    </div>
                    {detail.verification.check_in_actual && (
                      <p className="text-xs text-gray-600">
                        <UserCheck className="w-3 h-3 inline mr-1 text-emerald-600" />
                        实际入住: {detail.verification.check_in_actual?.slice(0, 16).replace('T', ' ')}
                      </p>
                    )}
                    {detail.verification.check_out_actual && (
                      <p className="text-xs text-gray-600">
                        <LogOut className="w-3 h-3 inline mr-1 text-gray-500" />
                        实际退房: {detail.verification.check_out_actual?.slice(0, 16).replace('T', ' ')}
                      </p>
                    )}
                    {detail.verification.verified_by && (
                      <p className="text-xs text-gray-500">核销人: {detail.verification.verified_by}</p>
                    )}
                    {detail.verification.verification_note && (
                      <p className="text-xs text-gray-600 pt-2 border-t border-gray-200/50">
                        {detail.verification.verification_note}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 p-3 rounded-lg bg-gray-50">暂无核销记录</p>
                )}
              </div>

              <div className="p-5 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary-500" /> 押金明细
                  </h4>
                </div>
                {detail.deposit ? (
                  <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={detail.deposit.status} map={DEPOSIT_STATUS} />
                      <span className="text-xs text-gray-500">支付方式: {detail.deposit.payment_method || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-gray-200/50">
                      <div><p className="text-gray-400">应付</p><p className="font-semibold text-gray-800 mt-0.5">¥{detail.deposit.total_amount}</p></div>
                      <div><p className="text-gray-400">已付</p><p className="font-semibold text-emerald-600 mt-0.5">¥{detail.deposit.paid_amount}</p></div>
                      <div><p className="text-gray-400">已退</p><p className="font-semibold text-primary-600 mt-0.5">¥{detail.deposit.refunded_amount}</p></div>
                    </div>
                    {Number(detail.deposit.deducted_amount) > 0 && (
                      <div className="pt-2 border-t border-gray-200/50">
                        <p className="text-xs text-red-500 mb-1">扣款 ¥{detail.deposit.deducted_amount}</p>
                        <div className="space-y-1">
                          {(detail.deposit.deduction_details || []).map((d, i) => (
                            <p key={i} className="text-[11px] text-gray-600 bg-white p-1.5 rounded">
                              · {d.item} <span className="float-right font-medium text-red-500">¥{d.amount}</span>
                              {d.reason && <span className="text-gray-400 ml-1">（{d.reason}）</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {detail.deposit.status === 'unpaid' || Number(detail.deposit.paid_amount) < Number(detail.deposit.total_amount) ? (
                        <button className="btn-success flex-1 text-xs" onClick={() => openDepositPay(detail.deposit)}>
                          <Wallet className="w-3 h-3" /> 收款
                        </button>
                      ) : null}
                      {(detail.deposit.status === 'paid' || detail.deposit.status === 'partially_refunded') && (
                        <button className="btn-primary flex-1 text-xs" onClick={() => openDepositRefund(detail.deposit)}>
                          <Wallet className="w-3 h-3" /> 退还
                        </button>
                      )}
                    </div>
                  </div>
                ) : Number(detail.deposit_amount) > 0 ? (
                  <p className="text-xs text-amber-600 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    ⚠️ 应收取押金 ¥{detail.deposit_amount}，押金记录待创建
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 p-3 rounded-lg bg-gray-50">无押金</p>
                )}
              </div>

              {statusLogs.length > 0 && (
                <div className="p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary-500" /> 状态流转记录
                  </h4>
                  <div className="space-y-2">
                    {statusLogs.map((l, i) => (
                      <div key={l.id} className="relative pl-6 pb-3 border-l-2 border-gray-100 last:border-l-0">
                        <div className={`absolute -left-[7px] top-0.5 w-3 h-3 rounded-full ${
                          i === 0 ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-gray-300'
                        }`} />
                        <div className="flex items-center gap-2 mb-0.5">
                          {l.from_status && <StatusBadge status={l.from_status} map={ORDER_STATUS} />}
                          {l.from_status && <ArrowRight className="w-3 h-3 text-gray-400" />}
                          <StatusBadge status={l.to_status} map={ORDER_STATUS} />
                        </div>
                        {l.reason && <p className="text-xs text-gray-600 mt-0.5">{l.reason}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {l.operator || '系统'} · {l.created_at?.slice(0, 19).replace('T', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showCreate}
        title="新建订单"
        size="xl"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
            <button className="btn-primary" onClick={submitOrder}>
              创建订单 {availability?.available === false && '(超卖将生成异常单)'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {availability?.available === false && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">库存不足！以下日期无法满足 {form.room_count} 间：</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {availability.issues.map((x, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white border border-red-200">
                      {x.date} 需要{x.needed}，可售{x.available}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-red-600">继续创建将扣减库存，并自动生成超卖异常单，便于后续跟进赔付处理。</p>
              </div>
            </div>
          )}

          <SectionTitle title="1. 基本信息" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">套餐 *</label>
              <select className="input" value={form.package_id}
                onChange={e => setForm({ ...form, package_id: e.target.value })}>
                <option value="">-- 请选择 --</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}（¥{p.base_price}/晚）</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">入住日期 *</label>
                <input type="date" className="input" value={form.check_in_date}
                  onChange={e => setForm({ ...form, check_in_date: e.target.value })} />
              </div>
              <div>
                <label className="label">退房日期 *</label>
                <input type="date" className="input" value={form.check_out_date}
                  onChange={e => setForm({ ...form, check_out_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">客户姓名 *</label>
              <input className="input" value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="label">客户电话 *</label>
              <input className="input" value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
            <div>
              <label className="label">身份证号</label>
              <input className="input" value={form.customer_id_card}
                onChange={e => setForm({ ...form, customer_id_card: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">晚数</label>
                <input type="number" className="input bg-gray-50" value={form.nights} readOnly />
              </div>
              <div>
                <label className="label">房间数</label>
                <input type="number" min="1" className="input" value={form.room_count}
                  onChange={e => setForm({ ...form, room_count: e.target.value })} />
              </div>
              <div>
                <label className="label">人数</label>
                <input type="number" min="1" className="input" value={form.guest_count}
                  onChange={e => setForm({ ...form, guest_count: e.target.value })} />
              </div>
            </div>
          </div>

          <SectionTitle
            title="2. 价格明细"
            desc={pricePreview ? `按入住区间自动测算，共 ${pricePreview.details?.length || 0} 晚` : '选择套餐和日期后自动测算'}
          />
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 grid grid-cols-3 gap-4">
            <div>
              <label className="label">原价总额</label>
              <input type="number" className="input" value={form.original_amount}
                onChange={e => setForm({ ...form, original_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">优惠金额</label>
              <input type="number" className="input" value={form.discount_amount}
                onChange={e => setForm({ ...form, discount_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">实收金额（自动）</label>
              <input type="number" className="input bg-primary-50 border-primary-200 font-semibold text-primary-700"
                value={form.final_amount} readOnly />
            </div>
          </div>
          {pricePreview?.details && pricePreview.details.length > 0 && (
            <details className="text-xs">
              <summary className="text-gray-500 cursor-pointer py-1">查看每日价格明细 ({pricePreview.details.length}天)</summary>
              <div className="table-wrapper mt-2">
                <table className="w-full">
                  <thead><tr><th className="th">日期</th><th className="th">适用规则</th><th className="th text-right">单价</th></tr></thead>
                  <tbody>
                    {pricePreview.details.map((d, i) => (
                      <tr key={i}>
                        <td className="td">{d.date} {'日一二三四五六'[d.weekday]}</td>
                        <td className="td text-primary-600">{d.rule_name}</td>
                        <td className="td text-right font-medium">¥{d.unit_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          <SectionTitle title="3. 押金 & 销售信息" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">押金金额</label>
              <input type="number" className="input" value={form.deposit_amount}
                onChange={e => setForm({ ...form, deposit_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">销售渠道</label>
              <select className="input" value={form.sales_channel}
                onChange={e => setForm({ ...form, sales_channel: e.target.value })}>
                {['官方小程序', '美团', '携程', '飞猪', '小红书', '抖音', '线下'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">销售负责人</label>
              <input className="input" value={form.sales_person}
                onChange={e => setForm({ ...form, sales_person: e.target.value })} />
            </div>
            <div />
            <div className="col-span-2">
              <label className="label">备注</label>
              <textarea rows="2" className="input" value={form.remark}
                onChange={e => setForm({ ...form, remark: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showStatusModal}
        title="变更订单状态"
        size="md"
        onClose={() => setShowStatusModal(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>取消</button>
            <button className="btn-primary" onClick={changeStatus}>确认变更</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">目标状态 *</label>
            <select className="input" value={statusForm.to_status}
              onChange={e => setStatusForm({ ...statusForm, to_status: e.target.value })}>
              <option value="">-- 请选择 --</option>
              {Object.entries(ORDER_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">操作人</label>
            <input className="input" value={statusForm.operator}
              onChange={e => setStatusForm({ ...statusForm, operator: e.target.value })} />
          </div>
          <div>
            <label className="label">变更原因</label>
            <textarea rows="3" className="input" value={statusForm.reason}
              onChange={e => setStatusForm({ ...statusForm, reason: e.target.value })} />
          </div>
          {selected && (
            <p className="text-xs text-gray-500 p-3 rounded-lg bg-gray-50">
              当前订单 <span className="font-mono text-primary-600">{selected.order_no}</span> 状态：
              <StatusBadge status={selected.status} map={ORDER_STATUS} />
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={showDepositPay}
        title="押金收款"
        size="md"
        onClose={() => setShowDepositPay(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowDepositPay(false)}>取消</button>
            <button className="btn-success" onClick={doPay}>确认收款</button>
          </>
        }
      >
        {depositData && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-700">应付押金 ¥{depositData.total_amount}，已付 ¥{depositData.paid_amount}</p>
            </div>
            <div>
              <label className="label">本次收款金额</label>
              <input type="number" className="input" value={payForm.paid_amount}
                onChange={e => setPayForm({ ...payForm, paid_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">支付方式</label>
              <select className="input" value={payForm.payment_method}
                onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                {['wechat', 'alipay', 'cash', 'card', 'bank'].map(m => (
                  <option key={m} value={m}>{{wechat:'微信',alipay:'支付宝',cash:'现金',card:'刷卡',bank:'银行转账'}[m]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">支付流水号</label>
              <input className="input" value={payForm.payment_ref}
                onChange={e => setPayForm({ ...payForm, payment_ref: e.target.value })} />
            </div>
            <div>
              <label className="label">经手人</label>
              <input className="input" value={payForm.handler}
                onChange={e => setPayForm({ ...payForm, handler: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showDepositRefund}
        title="押金退还"
        size="lg"
        onClose={() => setShowDepositRefund(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowDepositRefund(false)}>取消</button>
            <button className="btn-primary" onClick={doRefund}>确认退还</button>
          </>
        }
      >
        {depositData && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-primary-600">已付金额</p><p className="font-bold text-primary-700">¥{depositData.paid_amount}</p></div>
              <div><p className="text-xs text-primary-600">已退</p><p className="font-bold text-primary-700">¥{depositData.refunded_amount}</p></div>
              <div><p className="text-xs text-primary-600">已扣款</p><p className="font-bold text-red-600">¥{depositData.deducted_amount}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">本次退款金额</label>
                <input type="number" className="input" value={refundForm.refund_amount}
                  onChange={e => setRefundForm({ ...refundForm, refund_amount: e.target.value })} />
              </div>
              <div>
                <label className="label">退款方式</label>
                <select className="input" value={refundForm.refund_method}
                  onChange={e => setRefundForm({ ...refundForm, refund_method: e.target.value })}>
                  {['wechat', 'alipay', 'cash', 'card', 'bank', 'original'].map(m => (
                    <option key={m} value={m}>{{wechat:'微信',alipay:'支付宝',cash:'现金',card:'刷卡',bank:'银行转账',original:'原路退回'}[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">退款流水号</label>
                <input className="input" value={refundForm.refund_ref}
                  onChange={e => setRefundForm({ ...refundForm, refund_ref: e.target.value })} />
              </div>
              <div>
                <label className="label">经手人</label>
                <input className="input" value={refundForm.handler}
                  onChange={e => setRefundForm({ ...refundForm, handler: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">扣款明细（可选，从押金中扣除的部分）</label>
              </div>
              <div className="space-y-2 mb-2">
                {refundForm.deductions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 text-xs">
                    <span className="flex-1 truncate">{d.item}</span>
                    <span className="text-red-600 font-semibold">¥{d.amount}</span>
                    {d.reason && <span className="text-gray-500 text-[11px]">（{d.reason}）</span>}
                    <button className="text-gray-400 hover:text-red-500 ml-1"
                      onClick={() => setRefundForm({
                        ...refundForm,
                        deductions: refundForm.deductions.filter((_, j) => j !== i)
                      })}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <input className="input flex-1" placeholder="扣款项目（如：布草破损赔偿）"
                  value={newDeduction.item}
                  onChange={e => setNewDeduction({ ...newDeduction, item: e.target.value })} />
                <input type="number" className="input max-w-[110px]" placeholder="金额"
                  value={newDeduction.amount}
                  onChange={e => setNewDeduction({ ...newDeduction, amount: e.target.value })} />
                <input className="input flex-1" placeholder="原因"
                  value={newDeduction.reason}
                  onChange={e => setNewDeduction({ ...newDeduction, reason: e.target.value })} />
                <button className="btn-secondary text-xs whitespace-nowrap"
                  onClick={() => {
                    if (!newDeduction.item || !newDeduction.amount) return
                    setRefundForm({
                      ...refundForm,
                      deductions: [...refundForm.deductions, { ...newDeduction }]
                    })
                    setNewDeduction({ item: '', amount: '', reason: '' })
                  }}>
                  <Plus className="w-3 h-3" /> 添加
                </button>
              </div>
            </div>
            <div>
              <label className="label">备注</label>
              <textarea rows="2" className="input" value={refundForm.remark}
                onChange={e => setRefundForm({ ...refundForm, remark: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-gray-800 truncate">{value}</p>
      </div>
    </div>
  )
}
