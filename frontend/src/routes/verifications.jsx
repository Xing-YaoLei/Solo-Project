import React, { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Search, BadgeCheck, Edit3, UserCheck, LogOut, CalendarDays } from 'lucide-react'
import { api } from '../lib/api'
import { VERIFICATION_STATUS, ORDER_STATUS } from '../lib/constants'
import { Pagination, Modal, EmptyState, StatusBadge } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/verifications')({
  component: VerificationsPage,
})

function VerificationsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [orderIds, setOrderIds] = useState([])
  const [data, setData] = useState({ items: [], total: 0 })
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    status: 'verified', verified_by: '', check_in_actual: '', check_out_actual: '',
    verification_code: '', guest_ids_verified: [], verification_note: '',
  })
  const [guestId, setGuestId] = useState('')

  useEffect(() => { load() }, [page, filters])

  async function load() {
    const p = { page, page_size: 10, ...filters }
    if (!p.keyword) delete p.keyword
    if (p.status) {
      p.verification_status = p.status
      delete p.status
    }
    const d = await api.listOrders(p)
    setData(d)
    const ids = d.items.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').map(o => o.id)
    setOrderIds(ids)
  }

  async function openEdit(order) {
    let v = null
    try { v = await api.getVerification(order.id) } catch (e) {}
    setEditing({ order, verification: v })
    setForm({
      status: v?.status || 'pending',
      verified_by: v?.verified_by || '',
      check_in_actual: v?.check_in_actual?.slice(0, 16)?.replace('T', ' ') || '',
      check_out_actual: v?.check_out_actual?.slice(0, 16)?.replace('T', ' ') || '',
      verification_code: v?.verification_code || order.order_no.slice(-8),
      guest_ids_verified: v?.guest_ids_verified || [],
      verification_note: v?.verification_note || '',
    })
    setShowEdit(true)
  }

  async function save() {
    try {
      const payload = {
        status: form.status,
        verified_by: form.verified_by,
        check_in_actual: form.check_in_actual ? new Date(form.check_in_actual.replace(' ', 'T') + ':00').toISOString() : null,
        check_out_actual: form.check_out_actual ? new Date(form.check_out_actual.replace(' ', 'T') + ':00').toISOString() : null,
        verification_code: form.verification_code,
        guest_ids_verified: form.guest_ids_verified,
        verification_note: form.verification_note,
      }
      await api.updateVerification(editing.verification.id, payload)
      toast.success('核销记录已更新')
      setShowEdit(false)
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">核销记录</h1>
        <p className="text-sm text-gray-500 mt-1">管理订单的入住核销与退房登记，包含实际入住/退房时间、客人证件核验等</p>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="搜索订单号/客户/手机..."
            value={filters.keyword}
            onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setPage(1) }} />
        </div>
        <select className="input max-w-[150px]" value={filters.status}
          onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
          <option value="">全部状态</option>
          {Object.entries(VERIFICATION_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState title="暂无订单" desc="请先创建订单" />
        ) : (
          <>
            <div className="table-wrapper border-0">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">订单</th>
                    <th className="th">套餐</th>
                    <th className="th">计划入住 → 退房</th>
                    <th className="th">实际入住</th>
                    <th className="th">实际退房</th>
                    <th className="th">核销码</th>
                    <th className="th">状态</th>
                    <th className="th">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(o => (
                    <tr key={o.id}>
                      <td className="td">
                        <p className="font-mono text-xs text-primary-600">{o.order_no}</p>
                        <p className="text-xs text-gray-500">{o.customer_name} · {o.customer_phone}</p>
                      </td>
                      <td className="td text-xs">{o.package?.name?.slice(0, 18)}...</td>
                      <td className="td text-xs text-gray-600">
                        <p>{o.check_in_date}</p>
                        <p className="text-gray-400">{o.check_out_date}（{o.nights}晚）</p>
                      </td>
                      <td className="td text-xs text-emerald-600">
                        {o.verification?.check_in_actual?.slice(0, 16).replace('T', ' ') || '-'}
                      </td>
                      <td className="td text-xs text-blue-600">
                        {o.verification?.check_out_actual?.slice(0, 16).replace('T', ' ') || '-'}
                      </td>
                      <td className="td font-mono text-xs bg-primary-50/50 text-primary-600 rounded px-2 py-1">
                        {o.verification?.verification_code || '-'}
                      </td>
                      <td className="td">
                        {o.verification
                          ? <StatusBadge status={o.verification.status} map={VERIFICATION_STATUS} />
                          : o.status === 'cancelled' || o.status === 'refunded'
                            ? <span className="badge bg-gray-100 text-gray-500">订单关闭</span>
                            : <StatusBadge status="pending" map={VERIFICATION_STATUS} />
                        }
                      </td>
                      <td className="td">
                        <button className="btn-ghost text-xs" onClick={() => openEdit(o)}>
                          <Edit3 className="w-3 h-3" /> 核销/登记
                        </button>
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

      <Modal
        open={showEdit}
        title={`核销登记 - ${editing?.order?.order_no || ''}`}
        size="lg"
        onClose={() => setShowEdit(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowEdit(false)}>取消</button>
            <button className="btn-primary" onClick={save}>保存</button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">客户</p>
                <p className="font-medium">{editing.order.customer_name}（{editing.order.customer_phone}）</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">套餐</p>
                <p className="font-medium truncate">{editing.order.package?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">计划入住</p>
                <p className="font-medium">{editing.order.check_in_date} → {editing.order.check_out_date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">核销状态</label>
                <select className="input" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(VERIFICATION_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">核销码</label>
                <input className="input font-mono" value={form.verification_code}
                  onChange={e => setForm({ ...form, verification_code: e.target.value })} />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-500" /> 实际入住时间
                </label>
                <input type="datetime-local" className="input"
                  value={form.check_in_actual.replace(' ', 'T')}
                  onChange={e => setForm({ ...form, check_in_actual: e.target.value.replace('T', ' ') })} />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <LogOut className="w-3 h-3 text-blue-500" /> 实际退房时间
                </label>
                <input type="datetime-local" className="input"
                  value={form.check_out_actual.replace(' ', 'T')}
                  onChange={e => setForm({ ...form, check_out_actual: e.target.value.replace('T', ' ') })} />
              </div>
              <div className="col-span-2">
                <label className="label">核销人</label>
                <input className="input" value={form.verified_by}
                  onChange={e => setForm({ ...form, verified_by: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">客人证件核验（已核验证件列表）</label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[2rem]">
                {form.guest_ids_verified.map((id, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    ✅ {id}
                    <button
                      onClick={() => setForm({
                        ...form,
                        guest_ids_verified: form.guest_ids_verified.filter((_, j) => j !== i)
                      })}
                      className="text-emerald-500 hover:text-red-500"
                    >✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="输入证件号后回车添加"
                  value={guestId}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && guestId) {
                      e.preventDefault()
                      if (!form.guest_ids_verified.includes(guestId)) {
                        setForm({ ...form, guest_ids_verified: [...form.guest_ids_verified, guestId] })
                      }
                      setGuestId('')
                    }
                  }}
                  onChange={e => setGuestId(e.target.value)} />
                <button className="btn-secondary" onClick={() => {
                  if (guestId && !form.guest_ids_verified.includes(guestId)) {
                    setForm({ ...form, guest_ids_verified: [...form.guest_ids_verified, guestId] })
                    setGuestId('')
                  }
                }}>添加</button>
              </div>
            </div>

            <div>
              <label className="label">核销备注</label>
              <textarea rows="3" className="input" value={form.verification_note}
                onChange={e => setForm({ ...form, verification_note: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
