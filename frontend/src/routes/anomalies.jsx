import React, { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search, AlertTriangle, Plus, User, Shield, MessageSquare,
  Edit3, Eye, CheckCircle2
} from 'lucide-react'
import { api } from '../lib/api'
import {
  ANOMALY_STATUS, ANOMALY_TYPE, IMPACT_LEVEL, RESPONSIBILITY_OWNER
} from '../lib/constants'
import { Pagination, Modal, EmptyState, StatusBadge } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/anomalies')({
  component: AnomaliesPage,
})

function AnomaliesPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ keyword: '', status: '', anomaly_type: '' })
  const [data, setData] = useState({ items: [], total: 0 })
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showAction, setShowAction] = useState(false)
  const [actionForm, setActionForm] = useState({ action: '', operator: '', note: '' })
  const [createForm, setCreateForm] = useState({
    order_id: '', package_id: '', anomaly_type: 'oversold', title: '',
    description: '', impact_level: 'medium', responsibility_owner: 'operations',
    responsible_person: '', root_cause: '', reported_by: '',
    impact_scope: { orders: [], dates: [] }
  })
  const [updateForm, setUpdateForm] = useState(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const [orders, setOrders] = useState([])
  const [packages, setPackages] = useState([])
  const [newOrder, setNewOrder] = useState('')
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    (async () => {
      const [o, p] = await Promise.all([
        api.listOrders({ page: 1, page_size: 50 }),
        api.listPackages({ page: 1, page_size: 100 }),
      ])
      setOrders(o.items)
      setPackages(p.items)
    })()
  }, [])

  useEffect(() => { load() }, [page, filters])

  async function load() {
    const p = { page, page_size: 10, ...filters }
    if (!p.keyword) delete p.keyword
    if (!p.status) delete p.status
    if (!p.anomaly_type) delete p.anomaly_type
    try {
      const d = await api.listAnomalies(p)
      setData(d)
    } catch (e) { console.warn(e); setData({ items: [], total: 0 }) }
  }

  const openStats = data.items.filter(a => a.status === 'open' || a.status === 'processing').length

  async function doCreate() {
    try {
      await api.createAnomaly({
        ...createForm,
        order_id: createForm.order_id ? Number(createForm.order_id) : null,
        package_id: createForm.package_id ? Number(createForm.package_id) : null,
      })
      toast.success('异常单已创建')
      setShowCreate(false)
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function doAction() {
    try {
      await api.addAnomalyAction(selected.id, actionForm)
      toast.success('处理步骤已记录')
      setShowAction(false)
      await loadDetail(selected.id)
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function loadDetail(id) {
    const d = await api.getAnomaly(id)
    setSelected(d)
  }

  async function openDetail(a) {
    await loadDetail(a.id)
    setShowDetail(true)
  }

  function openUpdate(a) {
    setSelected(a)
    setUpdateForm({
      status: a.status,
      title: a.title,
      description: a.description || '',
      impact_level: a.impact_level,
      responsibility_owner: a.responsibility_owner || '',
      responsible_person: a.responsible_person || '',
      root_cause: a.root_cause || '',
      resolution: a.resolution || '',
      compensation_amount: a.compensation_amount || 0,
      handled_by: a.handled_by || '',
    })
    setShowUpdate(true)
  }

  async function doUpdate() {
    try {
      await api.updateAnomaly(selected.id, {
        ...updateForm,
        compensation_amount: Number(updateForm.compensation_amount) || 0,
        responsibility_owner: updateForm.responsibility_owner || null,
      })
      toast.success('已更新')
      setShowUpdate(false)
      await loadDetail(selected.id)
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">异常单管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            记录套餐超卖、价格/库存异常、核销失败、押金问题等。包含影响范围、责任归属、处理过程、处理结果全链路留痕。
          </p>
        </div>
        <button className="btn-danger" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> 新建异常单
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '待处理', value: data.items.filter(a => a.status === 'open').length, color: 'text-red-600 bg-red-50' },
          { label: '处理中', value: data.items.filter(a => a.status === 'processing').length, color: 'text-amber-600 bg-amber-50' },
          { label: '已解决', value: data.items.filter(a => a.status === 'resolved').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: '已关闭', value: data.items.filter(a => a.status === 'closed').length, color: 'text-gray-600 bg-gray-50' },
          { label: '超卖异常', value: data.items.filter(a => a.anomaly_type === 'oversold').length, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`stat-card`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="搜索标题/异常单号..."
            value={filters.keyword}
            onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setPage(1) }} />
        </div>
        <select className="input max-w-[150px]" value={filters.status}
          onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
          <option value="">全部状态</option>
          {Object.entries(ANOMALY_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="input max-w-[180px]" value={filters.anomaly_type}
          onChange={e => { setFilters({ ...filters, anomaly_type: e.target.value }); setPage(1) }}>
          <option value="">全部类型</option>
          {Object.entries(ANOMALY_TYPE).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {data.items.length === 0 ? (
          <EmptyState title="暂无异常单" desc="继续保持 🎉" icon={CheckCircle2} />
        ) : (
          <>
            <div className="table-wrapper border-0">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">异常单号</th>
                    <th className="th">类型/标题</th>
                    <th className="th">影响</th>
                    <th className="th">责任</th>
                    <th className="th">责任人</th>
                    <th className="th">赔付</th>
                    <th className="th">状态</th>
                    <th className="th">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="td">
                        <p className="font-mono text-xs text-primary-600">{a.anomaly_no}</p>
                        <p className="text-[11px] text-gray-400">{a.reported_at?.slice(0, 10)}</p>
                      </td>
                      <td className="td max-w-[280px]">
                        <div className="flex items-start gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] text-white font-medium shrink-0 mt-0.5 ${ANOMALY_TYPE[a.anomaly_type]?.color}`}>
                            {ANOMALY_TYPE[a.anomaly_type]?.label}
                          </span>
                          <p className="font-medium text-sm line-clamp-2">{a.title}</p>
                        </div>
                      </td>
                      <td className="td">
                        <StatusBadge status={a.impact_level} map={IMPACT_LEVEL} />
                        {a.impact_scope?.orders?.length > 0 && (
                          <p className="text-[11px] text-gray-500 mt-1">影响 {a.impact_scope.orders.length} 单</p>
                        )}
                      </td>
                      <td className="td text-xs">
                        {a.responsibility_owner ? RESPONSIBILITY_OWNER[a.responsibility_owner] : '-'}
                      </td>
                      <td className="td text-xs">{a.responsible_person || '-'}</td>
                      <td className="td font-medium text-red-600 text-xs">
                        {Number(a.compensation_amount) > 0 ? `¥${a.compensation_amount}` : '-'}
                      </td>
                      <td className="td">
                        <StatusBadge status={a.status} map={ANOMALY_STATUS} />
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost text-xs" onClick={() => openDetail(a)}>
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="btn-ghost text-xs" onClick={() => openUpdate(a)}>
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button className="btn-ghost text-xs" onClick={() => {
                            setSelected(a); setActionForm({ action: '', operator: '', note: '' })
                            setShowAction(true)
                          }}>
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
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
        open={showDetail}
        title={selected?.title || '异常单详情'}
        size="xl"
        onClose={() => setShowDetail(false)}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">异常单号</p>
                <p className="font-mono text-primary-600">{selected.anomaly_no}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">当前状态</p>
                <StatusBadge status={selected.status} map={ANOMALY_STATUS} />
                <StatusBadge status={selected.impact_level} map={IMPACT_LEVEL} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">异常类型</p>
                <span className={`px-2 py-0.5 rounded text-xs text-white font-medium ${ANOMALY_TYPE[selected.anomaly_type]?.color}`}>
                  {ANOMALY_TYPE[selected.anomaly_type]?.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">赔付金额</p>
                <p className="font-semibold text-red-600">¥{selected.compensation_amount}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> 异常描述
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description || '无'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-500" /> 责任归属
                </h4>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-500 w-16 inline-block">归属:</span>
                    {selected.responsibility_owner ? RESPONSIBILITY_OWNER[selected.responsibility_owner] : '-'}</p>
                  <p><span className="text-gray-500 w-16 inline-block">责任人:</span>{selected.responsible_person || '-'}</p>
                  <p><span className="text-gray-500 w-16 inline-block">上报:</span>{selected.reported_by || '-'}</p>
                  <p><span className="text-gray-500 w-16 inline-block">处理:</span>{selected.handled_by || '-'}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 根本原因 & 处理结果
                </h4>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-500 block mb-1">根本原因:</span>
                    <span className="text-gray-700">{selected.root_cause || '待分析'}</span>
                  </p>
                  <p><span className="text-gray-500 block mb-1">处理结果:</span>
                    <span className="text-gray-700">{selected.resolution || '处理中'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 space-y-3">
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 影响范围
              </h4>
              {selected.impact_scope ? (
                <div className="space-y-2 text-sm">
                  {selected.impact_scope.orders?.length > 0 && (
                    <div>
                      <p className="text-xs text-red-600 mb-1">受影响订单 ({selected.impact_scope.orders.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.impact_scope.orders.map(o => (
                          <span key={o} className="px-2 py-0.5 rounded bg-white border border-red-200 text-xs font-mono text-red-600">{o}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.impact_scope.dates?.length > 0 && (
                    <div>
                      <p className="text-xs text-red-600 mb-1">受影响日期</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.impact_scope.dates.map(d => (
                          <span key={d} className="px-2 py-0.5 rounded bg-white border border-red-200 text-xs text-red-600">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.impact_scope.inventory_conflicts?.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-red-100">
                      <p className="text-xs text-red-600 mb-1">库存冲突详情</p>
                      <div className="space-y-1">
                        {selected.impact_scope.inventory_conflicts.map((c, i) => (
                          <p key={i} className="text-xs bg-white rounded p-1.5 border border-red-100">
                            {c.date}：需要{c.needed}，可售{c.available}
                            （总{c.total}/已售{c.sold}/预留{c.reserved}）
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <p className="text-sm text-gray-500">暂无详细范围</p>}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-500" /> 处理过程记录
                <button
                  className="ml-auto btn-ghost text-xs"
                  onClick={() => {
                    setActionForm({ action: '', operator: '', note: '' })
                    setShowDetail(false); setShowAction(true)
                  }}
                >
                  <Plus className="w-3 h-3" /> 追加步骤
                </button>
              </h4>
              {(selected.handling_process?.length || 0) === 0 ? (
                <p className="text-sm text-gray-400 p-4 rounded-lg bg-gray-50 text-center">暂无处理记录</p>
              ) : (
                <div className="relative pl-6 space-y-3">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                  {selected.handling_process.map((h, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-100" />
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800">{h.action}</p>
                          <span className="text-[11px] text-gray-400">{h.time?.slice(0, 19).replace('T', ' ')}</span>
                        </div>
                        <p className="text-xs text-gray-500">操作人：{h.operator || '未知'}</p>
                        {h.note && <p className="text-xs text-gray-600 mt-1.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showCreate}
        title="新建异常单"
        size="lg"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
            <button className="btn-primary" onClick={doCreate}>提交</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">异常类型 *</label>
              <select className="input" value={createForm.anomaly_type}
                onChange={e => setCreateForm({ ...createForm, anomaly_type: e.target.value })}>
                {Object.entries(ANOMALY_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">影响等级</label>
              <select className="input" value={createForm.impact_level}
                onChange={e => setCreateForm({ ...createForm, impact_level: e.target.value })}>
                {Object.entries(IMPACT_LEVEL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">关联订单</label>
              <select className="input" value={createForm.order_id}
                onChange={e => setCreateForm({ ...createForm, order_id: e.target.value })}>
                <option value="">-- 无关联 --</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.order_no} - {o.customer_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">关联套餐</label>
              <select className="input" value={createForm.package_id}
                onChange={e => setCreateForm({ ...createForm, package_id: e.target.value })}>
                <option value="">-- 无关联 --</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">异常标题 *</label>
            <input className="input" value={createForm.title}
              onChange={e => setCreateForm({ ...createForm, title: e.target.value })} />
          </div>
          <div>
            <label className="label">异常描述</label>
            <textarea rows="3" className="input" value={createForm.description}
              onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">责任归属</label>
              <select className="input" value={createForm.responsibility_owner}
                onChange={e => setCreateForm({ ...createForm, responsibility_owner: e.target.value })}>
                {Object.entries(RESPONSIBILITY_OWNER).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">责任人</label>
              <input className="input" value={createForm.responsible_person}
                onChange={e => setCreateForm({ ...createForm, responsible_person: e.target.value })} />
            </div>
            <div>
              <label className="label">上报人</label>
              <input className="input" value={createForm.reported_by}
                onChange={e => setCreateForm({ ...createForm, reported_by: e.target.value })} />
            </div>
            <div>
              <label className="label">根本原因</label>
              <input className="input" value={createForm.root_cause}
                onChange={e => setCreateForm({ ...createForm, root_cause: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label">影响订单列表</label>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
              {createForm.impact_scope.orders.map((o, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {o}
                  <button
                    onClick={() => setCreateForm({
                      ...createForm,
                      impact_scope: {
                        ...createForm.impact_scope,
                        orders: createForm.impact_scope.orders.filter((_, j) => j !== i)
                      }
                    })}
                    className="text-red-500 hover:text-red-700"
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="输入订单号回车添加"
                value={newOrder}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOrder) {
                    e.preventDefault()
                    if (!createForm.impact_scope.orders.includes(newOrder)) {
                      setCreateForm({
                        ...createForm,
                        impact_scope: {
                          ...createForm.impact_scope,
                          orders: [...createForm.impact_scope.orders, newOrder]
                        }
                      })
                    }
                    setNewOrder('')
                  }
                }}
                onChange={e => setNewOrder(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label">影响日期列表</label>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
              {createForm.impact_scope.dates.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  {d}
                  <button
                    onClick={() => setCreateForm({
                      ...createForm,
                      impact_scope: {
                        ...createForm.impact_scope,
                        dates: createForm.impact_scope.dates.filter((_, j) => j !== i)
                      }
                    })}
                    className="text-amber-600 hover:text-amber-800"
                  >✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="date" className="input flex-1" value={newDate}
                onChange={e => {
                  setNewDate(e.target.value)
                  if (e.target.value && !createForm.impact_scope.dates.includes(e.target.value)) {
                    setCreateForm({
                      ...createForm,
                      impact_scope: {
                        ...createForm.impact_scope,
                        dates: [...createForm.impact_scope.dates, e.target.value]
                      }
                    })
                  }
                }} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showUpdate}
        title="更新异常单"
        size="lg"
        onClose={() => setShowUpdate(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowUpdate(false)}>取消</button>
            <button className="btn-primary" onClick={doUpdate}>保存</button>
          </>
        }
      >
        {updateForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">处理状态</label>
                <select className="input" value={updateForm.status}
                  onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}>
                  {Object.entries(ANOMALY_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">影响等级</label>
                <select className="input" value={updateForm.impact_level}
                  onChange={e => setUpdateForm({ ...updateForm, impact_level: e.target.value })}>
                  {Object.entries(IMPACT_LEVEL).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">标题</label>
              <input className="input" value={updateForm.title}
                onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })} />
            </div>
            <div>
              <label className="label">描述</label>
              <textarea rows="2" className="input" value={updateForm.description}
                onChange={e => setUpdateForm({ ...updateForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">责任归属</label>
                <select className="input" value={updateForm.responsibility_owner}
                  onChange={e => setUpdateForm({ ...updateForm, responsibility_owner: e.target.value })}>
                  <option value="">-- 未指定 --</option>
                  {Object.entries(RESPONSIBILITY_OWNER).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">责任人</label>
                <input className="input" value={updateForm.responsible_person}
                  onChange={e => setUpdateForm({ ...updateForm, responsible_person: e.target.value })} />
              </div>
              <div>
                <label className="label">赔付金额</label>
                <input type="number" className="input" value={updateForm.compensation_amount}
                  onChange={e => setUpdateForm({ ...updateForm, compensation_amount: e.target.value })} />
              </div>
              <div>
                <label className="label">处理人</label>
                <input className="input" value={updateForm.handled_by}
                  onChange={e => setUpdateForm({ ...updateForm, handled_by: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">根本原因</label>
              <textarea rows="2" className="input" value={updateForm.root_cause}
                onChange={e => setUpdateForm({ ...updateForm, root_cause: e.target.value })} />
            </div>
            <div>
              <label className="label">处理结果</label>
              <textarea rows="3" className="input" value={updateForm.resolution}
                onChange={e => setUpdateForm({ ...updateForm, resolution: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showAction}
        title="记录处理步骤"
        size="md"
        onClose={() => setShowAction(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowAction(false)}>取消</button>
            <button className="btn-primary" onClick={doAction}>提交</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">处理动作 *</label>
            <input className="input" placeholder="如：联系客户协商退款、紧急调房、运营复核库存等"
              value={actionForm.action}
              onChange={e => setActionForm({ ...actionForm, action: e.target.value })} />
          </div>
          <div>
            <label className="label">操作人 *</label>
            <input className="input" value={actionForm.operator}
              onChange={e => setActionForm({ ...actionForm, operator: e.target.value })} />
          </div>
          <div>
            <label className="label">备注</label>
            <textarea rows="3" className="input" value={actionForm.note}
              onChange={e => setActionForm({ ...actionForm, note: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
