import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ordersApi, basicApi, alertsApi } from '@/api'
import { StatusBadge, AlertStatusBadge, DiscrepancyTypeBadge, SeverityBadge } from '@/components/Badges'
import { Modal } from '@/components/Modal'
import { formatDateTime, formatDate, formatFileSize, formatTemp, classNames } from '@/utils'
import type { ReplenishmentOrder, BatchCode, QCRecord, Discrepancy, TemperatureRecord, TemperatureAlert, Attachment, ActionLog, ReplenishmentStatus, DiscrepancyType, Product, Store, TemperatureAlertStatus } from '@/types'
import { STATUS_LABEL, ROLE_LABEL, RoleEnum } from '@/types'
import { useAuthStore } from '@/store/auth'

type TabKey = 'overview' | 'items' | 'batches' | 'qc' | 'discrepancies' | 'temperature' | 'alerts' | 'attachments' | 'logs'

const STATUS_TRANSITIONS: Record<ReplenishmentStatus, ReplenishmentStatus[]> = {
  draft: ['pending_load', 'cancelled'],
  pending_load: ['loaded', 'cancelled'],
  loaded: ['in_transit'],
  in_transit: ['arrived'],
  arrived: ['qc_pending'],
  qc_pending: ['qc_done', 'discrepancy'],
  discrepancy: ['qc_done'],
  qc_done: ['completed'],
  completed: [],
  cancelled: [],
} as any

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<ReplenishmentOrder | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [showTransitionModal, setShowTransitionModal] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<ReplenishmentStatus>('' as ReplenishmentStatus)
  const [transitionRemark, setTransitionRemark] = useState('')

  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchProductId, setBatchProductId] = useState<number>(0)
  const [batchNo, setBatchNo] = useState('')
  const [batchQty, setBatchQty] = useState(0)
  const [batchProductionDate, setBatchProductionDate] = useState('')
  const [batchExpiryDate, setBatchExpiryDate] = useState('')

  const [showQcModal, setShowQcModal] = useState(false)
  const [qcProductId, setQcProductId] = useState<number>(0)
  const [qcBatchId, setQcBatchId] = useState<number | ''>('')
  const [qcTemp, setQcTemp] = useState<number | ''>('')
  const [qcAppearance, setQcAppearance] = useState(true)
  const [qcPackaging, setQcPackaging] = useState(true)
  const [qcTempOk, setQcTempOk] = useState(true)
  const [qcPassed, setQcPassed] = useState(true)
  const [qcRemark, setQcRemark] = useState('')
  const [qcImages, setQcImages] = useState<{ file_path: string; file_name: string }[]>([])

  const [showDiscModal, setShowDiscModal] = useState(false)
  const [discProductId, setDiscProductId] = useState<number>(0)
  const [discType, setDiscType] = useState<DiscrepancyType>(DiscrepancyType.OTHER)
  const [discExpected, setDiscExpected] = useState<number | ''>('')
  const [discActual, setDiscActual] = useState<number | ''>('')
  const [discDesc, setDiscDesc] = useState('')

  const [showTempModal, setShowTempModal] = useState(false)
  const [tempValue, setTempValue] = useState<number | ''>('')
  const [tempMin, setTempMin] = useState<number | ''>('')
  const [tempMax, setTempMax] = useState<number | ''>('')
  const [tempLocation, setTempLocation] = useState('')

  const [resolveDiscId, setResolveDiscId] = useState<number | null>(null)
  const [resolveNote, setResolveNote] = useState('')

  useEffect(() => {
    loadAll()
    basicApi.listStores().then(setStores).catch(() => {})
    basicApi.listProducts().then(setProducts).catch(() => {})
  }, [orderId])

  async function loadAll() {
    setLoading(true)
    try {
      const o = await ordersApi.get(Number(orderId))
      setOrder(o)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !order) {
    return <div className="text-center py-20 text-slate-500">加载中...</div>
  }

  const canEdit = user?.role && [RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN].includes(user.role)
  const canAddBatch = user?.role && [RoleEnum.WAREHOUSE, RoleEnum.DRIVER, RoleEnum.ADMIN].includes(user.role)
  const canVerifyBatch = user?.role && [RoleEnum.WAREHOUSE, RoleEnum.QC, RoleEnum.ADMIN].includes(user.role)
  const canQC = user?.role && [RoleEnum.QC, RoleEnum.ADMIN].includes(user.role)
  const canResolveDisc = user?.role && [RoleEnum.PURCHASER, RoleEnum.ADMIN].includes(user.role)

  const nextTargets = STATUS_TRANSITIONS[order.status] || []

  async function handleTransition() {
    if (!transitionTarget) return
    await ordersApi.transition(order.id, transitionTarget, transitionRemark || undefined)
    setShowTransitionModal(false)
    setTransitionTarget('' as ReplenishmentStatus)
    setTransitionRemark('')
    loadAll()
  }

  async function handleAddBatch() {
    if (!batchProductId || !batchNo || !batchQty) { alert('请填写完整信息'); return }
    await ordersApi.addBatch(order.id, {
      product_id: batchProductId, batch_no: batchNo, qty: batchQty,
      production_date: batchProductionDate || undefined, expiry_date: batchExpiryDate || undefined,
    })
    setShowBatchModal(false)
    resetBatchForm()
    loadAll()
  }

  function resetBatchForm() {
    setBatchProductId(0); setBatchNo(''); setBatchQty(0); setBatchProductionDate(''); setBatchExpiryDate('')
  }

  async function handleVerifyBatch(b: BatchCode, verified: boolean) {
    await ordersApi.verifyBatch(order.id, b.id, { verified })
    loadAll()
  }

  async function handleQCSubmit() {
    if (!qcProductId) { alert('请选择商品'); return }
    await ordersApi.createQC(order.id, {
      product_id: qcProductId, batch_code_id: qcBatchId || undefined,
      temperature: qcTemp === '' ? undefined : Number(qcTemp),
      appearance_ok: qcAppearance, packaging_ok: qcPackaging, temperature_ok: qcTempOk,
      passed: qcPassed, remark: qcRemark || undefined, images: qcImages,
    })
    setShowQcModal(false)
    resetQCForm()
    loadAll()
  }

  function resetQCForm() {
    setQcProductId(0); setQcBatchId(''); setQcTemp(''); setQcAppearance(true); setQcPackaging(true)
    setQcTempOk(true); setQcPassed(true); setQcRemark(''); setQcImages([])
  }

  async function handleQcImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      try {
        const a = await ordersApi.uploadAttachment(order.id, f, 'qc_image')
        setQcImages((prev) => [...prev, { file_path: a.file_path, file_name: a.file_name }])
      } catch {}
    }
    e.target.value = ''
  }

  async function handleDiscSubmit() {
    if (!discProductId) { alert('请选择商品'); return }
    await ordersApi.createDiscrepancy(order.id, {
      product_id: discProductId, type: discType,
      expected_qty: discExpected === '' ? undefined : Number(discExpected),
      actual_qty: discActual === '' ? undefined : Number(discActual),
      diff_qty: discExpected !== '' && discActual !== '' ? Number(discActual) - Number(discExpected) : undefined,
      description: discDesc || undefined,
    })
    setShowDiscModal(false)
    resetDiscForm()
    loadAll()
  }

  function resetDiscForm() {
    setDiscProductId(0); setDiscType(DiscrepancyType.OTHER); setDiscExpected(''); setDiscActual(''); setDiscDesc('')
  }

  async function handleResolveDisc() {
    if (resolveDiscId === null || !resolveNote) { alert('请填写解决说明'); return }
    await ordersApi.resolveDiscrepancy(order.id, resolveDiscId, resolveNote)
    setResolveDiscId(null)
    setResolveNote('')
    loadAll()
  }

  async function handleTempSubmit() {
    if (tempValue === '') { alert('请填写温度'); return }
    await ordersApi.addTemperature(order.id, {
      temperature: Number(tempValue),
      min_temp: tempMin === '' ? undefined : Number(tempMin),
      max_temp: tempMax === '' ? undefined : Number(tempMax),
      location: tempLocation || undefined,
    })
    setShowTempModal(false)
    setTempValue(''); setTempMin(''); setTempMax(''); setTempLocation('')
    loadAll()
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      try { await ordersApi.uploadAttachment(order.id, files[i]) } catch {}
    }
    e.target.value = ''
    loadAll()
  }

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'overview', label: '概览' },
    { key: 'items', label: `商品明细 (${order.items.length})` },
    { key: 'batches', label: `批次码 (${order.batches.length})` },
    { key: 'qc', label: `质检记录 (${order.qc_records.length})` },
    { key: 'discrepancies', label: `到货差异 (${order.discrepancies.length})` },
    { key: 'temperature', label: `温度记录 (${order.temperature_records.length})` },
    { key: 'alerts', label: `异常告警 (${order.alerts.length})` },
    { key: 'attachments', label: `附件 (${order.attachments.length})` },
    { key: 'logs', label: `操作日志 (${order.logs.length})` },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={() => navigate({ to: '/orders' })}>← 返回列表</button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-800">{order.order_no}</h2>
              <StatusBadge status={order.status} />
              {order.alerts.some((a) => a.status !== TemperatureAlertStatus.CLOSED) && <span className="text-red-500 text-sm" title="存在未关闭温度异常">🌡️ 异常</span>}
              {order.discrepancies.some((d) => !d.resolved) && <span className="text-orange-500 text-sm" title="存在未解决差异">⚠️ 差异</span>}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {order.store?.name} · 计划日期 {formatDate(order.planned_date)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextTargets.length > 0 && (
            <button className="btn-primary" onClick={() => setShowTransitionModal(true)}>
              变更状态
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={classNames(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'overview' && <OverviewTab order={order} />}
          {tab === 'items' && <ItemsTab items={order.items} />}
          {tab === 'batches' && (
            <BatchesTab
              batches={order.batches}
              products={products}
              canAdd={!!canAddBatch}
              canVerify={!!canVerifyBatch}
              onAdd={() => setShowBatchModal(true)}
              onVerify={handleVerifyBatch}
            />
          )}
          {tab === 'qc' && (
            <QCTab
              qcList={order.qc_records}
              products={products}
              canAdd={!!canQC}
              onAdd={() => setShowQcModal(true)}
            />
          )}
          {tab === 'discrepancies' && (
            <DiscrepanciesTab
              list={order.discrepancies}
              products={products}
              canAdd={true}
              canResolve={!!canResolveDisc}
              onAdd={() => setShowDiscModal(true)}
              onResolve={(id) => { setResolveDiscId(id); setResolveNote('') }}
            />
          )}
          {tab === 'temperature' && (
            <TemperatureTab
              list={order.temperature_records}
              onAdd={() => setShowTempModal(true)}
            />
          )}
          {tab === 'alerts' && (
            <AlertsInline list={order.alerts} />
          )}
          {tab === 'attachments' && (
            <AttachmentsTab list={order.attachments} onUpload={handleAttachmentUpload} />
          )}
          {tab === 'logs' && <LogsTab list={order.logs} />}
        </div>
      </div>

      <Modal
        open={showTransitionModal}
        onClose={() => { setShowTransitionModal(false); setTransitionTarget('' as ReplenishmentStatus); setTransitionRemark('') }}
        title="状态变更"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowTransitionModal(false)}>取消</button>
            <button className="btn-primary" disabled={!transitionTarget} onClick={handleTransition}>确认</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">当前状态</label>
            <div className="text-sm"><StatusBadge status={order.status} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">目标状态</label>
            <select className="select" value={transitionTarget} onChange={(e) => setTransitionTarget(e.target.value as ReplenishmentStatus)}>
              <option value="">请选择</option>
              {nextTargets.map((t) => <option key={t} value={t}>{STATUS_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea className="input" rows={3} value={transitionRemark} onChange={(e) => setTransitionRemark(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showBatchModal}
        onClose={() => { setShowBatchModal(false); resetBatchForm() }}
        title="添加批次码"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowBatchModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleAddBatch}>确认</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">商品 <span className="text-red-500">*</span></label>
            <select className="select" value={batchProductId} onChange={(e) => setBatchProductId(Number(e.target.value))}>
              <option value={0}>请选择</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">批次号 <span className="text-red-500">*</span></label>
            <input className="input" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">数量 <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" className="input" value={batchQty || ''} onChange={(e) => setBatchQty(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">生产日期</label>
              <input type="date" className="input" value={batchProductionDate} onChange={(e) => setBatchProductionDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">保质期至</label>
              <input type="date" className="input" value={batchExpiryDate} onChange={(e) => setBatchExpiryDate(e.target.value)} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showQcModal}
        onClose={() => { setShowQcModal(false); resetQCForm() }}
        title="新增质检记录"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowQcModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleQCSubmit}>提交</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">商品 <span className="text-red-500">*</span></label>
            <select className="select" value={qcProductId} onChange={(e) => setQcProductId(Number(e.target.value))}>
              <option value={0}>请选择</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">批次码</label>
            <select className="select" value={qcBatchId} onChange={(e) => setQcBatchId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">无</option>
              {order.batches.filter((b) => !qcProductId || b.product_id === qcProductId).map((b) => (
                <option key={b.id} value={b.id}>{b.batch_no}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">温度 (°C)</label>
            <input type="number" step="0.1" className="input" value={qcTemp} onChange={(e) => setQcTemp(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={qcAppearance} onChange={(e) => setQcAppearance(e.target.checked)} /> 外观合格</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={qcPackaging} onChange={(e) => setQcPackaging(e.target.checked)} /> 包装合格</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={qcTempOk} onChange={(e) => setQcTempOk(e.target.checked)} /> 温度合格</label>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={qcPassed} onChange={(e) => setQcPassed(e.target.checked)} /> <span className="text-sm font-medium">整体通过</span></label>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">质检图片</label>
            <input type="file" accept="image/*" multiple className="input" onChange={handleQcImageUpload} />
            {qcImages.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {qcImages.map((img, i) => (
                  <span key={i} className="badge bg-green-100 text-green-800">✓ {img.file_name}</span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea className="input" rows={2} value={qcRemark} onChange={(e) => setQcRemark(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showDiscModal}
        onClose={() => { setShowDiscModal(false); resetDiscForm() }}
        title="报告到货差异"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowDiscModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleDiscSubmit}>提交</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">商品 <span className="text-red-500">*</span></label>
            <select className="select" value={discProductId} onChange={(e) => setDiscProductId(Number(e.target.value))}>
              <option value={0}>请选择</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">差异类型</label>
            <select className="select" value={discType} onChange={(e) => setDiscType(e.target.value as DiscrepancyType)}>
              {Object.entries(DiscrepancyType).map(([k, v]) => (
                <option key={k} value={v}>{k}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">期望数量</label>
              <input type="number" step="0.01" className="input" value={discExpected} onChange={(e) => setDiscExpected(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">实际数量</label>
              <input type="number" step="0.01" className="input" value={discActual} onChange={(e) => setDiscActual(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">问题描述</label>
            <textarea className="input" rows={3} value={discDesc} onChange={(e) => setDiscDesc(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={resolveDiscId !== null}
        onClose={() => { setResolveDiscId(null); setResolveNote('') }}
        title="解决差异"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setResolveDiscId(null)}>取消</button>
            <button className="btn-primary" onClick={handleResolveDisc}>确认解决</button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">解决说明 <span className="text-red-500">*</span></label>
          <textarea className="input" rows={4} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="请填写差异处理方案和结果..." />
        </div>
      </Modal>

      <Modal
        open={showTempModal}
        onClose={() => { setShowTempModal(false); setTempValue(''); setTempMin(''); setTempMax(''); setTempLocation('') }}
        title="添加温度记录"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowTempModal(false)}>取消</button>
            <button className="btn-primary" onClick={handleTempSubmit}>提交</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">实际温度 (°C) <span className="text-red-500">*</span></label>
            <input type="number" step="0.1" className="input" value={tempValue} onChange={(e) => setTempValue(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最低温度</label>
              <input type="number" step="0.1" className="input" value={tempMin} onChange={(e) => setTempMin(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最高温度</label>
              <input type="number" step="0.1" className="input" value={tempMax} onChange={(e) => setTempMax(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">测量位置</label>
            <input className="input" value={tempLocation} onChange={(e) => setTempLocation(e.target.value)} placeholder="如：车厢中部、冷藏柜" />
          </div>
          <div className="text-xs text-slate-500">提示：若实际温度超出温度范围，将自动生成温度越界告警</div>
        </div>
      </Modal>
    </div>
  )
}

function OverviewTab({ order }: { order: ReplenishmentOrder }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 border-b pb-2">基础信息</h4>
        <InfoRow label="门店" value={order.store?.name || '-'} />
        <InfoRow label="门店编码" value={order.store?.code || '-'} />
        <InfoRow label="计划日期" value={formatDate(order.planned_date)} />
        <InfoRow label="车牌号" value={order.truck_no || '-'} />
        <InfoRow label="司机姓名" value={order.driver_name || '-'} />
        <InfoRow label="司机电话" value={order.driver_phone || '-'} />
        <InfoRow label="装车单号" value={order.loading_list_no || '-'} />
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 border-b pb-2">流程节点</h4>
        <InfoRow label="创建时间" value={formatDateTime(order.created_at)} />
        <InfoRow label="创建人" value={order.creator?.full_name || '-'} />
        <InfoRow label="装车时间" value={formatDateTime(order.loading_time)} />
        <InfoRow label="发车时间" value={formatDateTime(order.departure_time)} />
        <InfoRow label="到货时间" value={formatDateTime(order.arrival_time)} />
        <InfoRow label="复核人" value={order.reviewed_by ? (order.creator?.full_name || '-') : '-'} />
        <InfoRow label="复核时间" value={formatDateTime(order.reviewed_at)} />
      </div>
      <div className="md:col-span-2">
        <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">备注</h4>
        <div className="text-sm text-slate-600 whitespace-pre-wrap">{order.remark || '无'}</div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  )
}

function ItemsTab({ items }: { items: ReplenishmentOrder['items'] }) {
  if (items.length === 0) return <Empty />
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="table-th">商品</th>
            <th className="table-th">分类</th>
            <th className="table-th">单位</th>
            <th className="table-th">计划数量</th>
            <th className="table-th">装车数量</th>
            <th className="table-th">实收数量</th>
            <th className="table-th">温区</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((it) => (
            <tr key={it.id}>
              <td className="table-td font-medium">{it.product?.sku} - {it.product?.name}</td>
              <td className="table-td text-slate-500">{it.product?.category || '-'}</td>
              <td className="table-td">{it.product?.unit}</td>
              <td className="table-td">{it.planned_qty}</td>
              <td className="table-td">{it.loaded_qty}</td>
              <td className="table-td">{it.received_qty}</td>
              <td className="table-td">{it.product ? `${it.product.min_temp}~${it.product.max_temp}°C` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BatchesTab({ batches, products, canAdd, canVerify, onAdd, onVerify }: {
  batches: BatchCode[]; products: Product[]; canAdd: boolean; canVerify: boolean;
  onAdd: () => void; onVerify: (b: BatchCode, verified: boolean) => void
}) {
  return (
    <div>
      {canAdd && (
        <div className="mb-4"><button className="btn-primary" onClick={onAdd}>+ 添加批次码</button></div>
      )}
      {batches.length === 0 ? <Empty /> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">商品</th>
                <th className="table-th">批次号</th>
                <th className="table-th">数量</th>
                <th className="table-th">生产日期</th>
                <th className="table-th">保质期至</th>
                <th className="table-th">状态</th>
                <th className="table-th">核对时间</th>
                <th className="table-th">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="table-td">{b.product?.name || products.find((p) => p.id === b.product_id)?.name || '-'}</td>
                  <td className="table-td font-mono">{b.batch_no}</td>
                  <td className="table-td">{b.qty}</td>
                  <td className="table-td">{formatDate(b.production_date)}</td>
                  <td className="table-td">{formatDate(b.expiry_date)}</td>
                  <td className="table-td">
                    {b.verified ? (
                      <span className="badge bg-green-100 text-green-800">✓ 已核对</span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-800">待核对</span>
                    )}
                  </td>
                  <td className="table-td">{formatDateTime(b.verified_at)}</td>
                  <td className="table-td">
                    {canVerify && (
                      <button className="link text-sm" onClick={() => onVerify(b, !b.verified)}>
                        {b.verified ? '取消核对' : '核对确认'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function QCTab({ qcList, products, canAdd, onAdd }: {
  qcList: QCRecord[]; products: Product[]; canAdd: boolean; onAdd: () => void
}) {
  return (
    <div>
      {canAdd && <div className="mb-4"><button className="btn-primary" onClick={onAdd}>+ 新增质检</button></div>}
      {qcList.length === 0 ? <Empty /> : (
        <div className="space-y-4">
          {qcList.map((q) => (
            <div key={q.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{q.product?.name || products.find((p) => p.id === q.product_id)?.name}</span>
                  {q.passed ? <span className="badge bg-green-100 text-green-800">✓ 合格</span> : <span className="badge bg-red-100 text-red-800">✗ 不合格</span>}
                </div>
                <span className="text-sm text-slate-500">{formatDateTime(q.checked_at)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div><span className="text-slate-500">温度：</span>{formatTemp(q.temperature)}</div>
                <div><span className="text-slate-500">外观：</span>{q.appearance_ok ? '✓' : '✗'}</div>
                <div><span className="text-slate-500">包装：</span>{q.packaging_ok ? '✓' : '✗'}</div>
                <div><span className="text-slate-500">温度合格：</span>{q.temperature_ok ? '✓' : '✗'}</div>
              </div>
              {q.remark && <div className="text-sm text-slate-600 mb-2">备注：{q.remark}</div>}
              {q.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {q.images.map((img) => (
                    <a key={img.id} href={img.file_path.startsWith('/') ? img.file_path : `/api${img.file_path}`} target="_blank" rel="noreferrer" className="w-24 h-24 rounded-md bg-slate-100 flex items-center justify-center text-xs text-slate-500 overflow-hidden">
                      {img.file_name?.slice(0, 10)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiscrepanciesTab({ list, products, canAdd, canResolve, onAdd, onResolve }: {
  list: Discrepancy[]; products: Product[]; canAdd: boolean; canResolve: boolean;
  onAdd: () => void; onResolve: (id: number) => void
}) {
  return (
    <div>
      {canAdd && <div className="mb-4"><button className="btn-primary" onClick={onAdd}>+ 报告差异</button></div>}
      {list.length === 0 ? <Empty /> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">商品</th>
                <th className="table-th">类型</th>
                <th className="table-th">期望</th>
                <th className="table-th">实际</th>
                <th className="table-th">差异</th>
                <th className="table-th">描述</th>
                <th className="table-th">状态</th>
                <th className="table-th">报告人</th>
                <th className="table-th">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((d) => (
                <tr key={d.id}>
                  <td className="table-td">{d.product?.name || products.find((p) => p.id === d.product_id)?.name || '-'}</td>
                  <td className="table-td"><DiscrepancyTypeBadge type={d.type} /></td>
                  <td className="table-td">{d.expected_qty ?? '-'}</td>
                  <td className="table-td">{d.actual_qty ?? '-'}</td>
                  <td className="table-td text-red-600">{d.diff_qty ?? '-'}</td>
                  <td className="table-td max-w-[200px] truncate">{d.description || '-'}</td>
                  <td className="table-td">
                    {d.resolved ? <span className="badge bg-green-100 text-green-800">已解决</span> : <span className="badge bg-orange-100 text-orange-800">未解决</span>}
                  </td>
                  <td className="table-td">{formatDateTime(d.reported_at)}</td>
                  <td className="table-td">
                    {canResolve && !d.resolved && (
                      <button className="link text-sm" onClick={() => onResolve(d.id)}>解决</button>
                    )}
                    {d.resolved && d.resolution_note && (
                      <span className="text-xs text-slate-500" title={d.resolution_note}>已处理</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TemperatureTab({ list, onAdd }: { list: TemperatureRecord[]; onAdd: () => void }) {
  return (
    <div>
      <div className="mb-4"><button className="btn-primary" onClick={onAdd}>+ 录入温度</button></div>
      {list.length === 0 ? <Empty /> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">时间</th>
                <th className="table-th">温度</th>
                <th className="table-th">允许范围</th>
                <th className="table-th">位置</th>
                <th className="table-th">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="table-td">{formatDateTime(t.recorded_at)}</td>
                  <td className={classNames('table-td font-medium', t.is_out_of_range ? 'text-red-600' : '')}>{formatTemp(t.temperature)}</td>
                  <td className="table-td">{t.min_temp !== undefined && t.max_temp !== undefined ? `${t.min_temp}~${t.max_temp}°C` : '-'}</td>
                  <td className="table-td">{t.location || '-'}</td>
                  <td className="table-td">
                    {t.is_out_of_range ? <span className="badge bg-red-100 text-red-800">越界</span> : <span className="badge bg-green-100 text-green-800">正常</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AlertsInline({ list }: { list: TemperatureAlert[] }) {
  if (list.length === 0) return <Empty />
  return (
    <div className="space-y-3">
      {list.map((a) => (
        <div key={a.id} className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">#{a.id}</span>
              <SeverityBadge severity={a.severity} />
              <AlertStatusBadge status={a.status} />
            </div>
            <Link to="/alerts/$alertId" params={{ alertId: String(a.id) }} className="link text-sm">查看详情 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-slate-500">实际：</span><span className="text-red-600 font-medium">{formatTemp(a.actual_temp)}</span></div>
            <div><span className="text-slate-500">范围：</span>{a.min_temp}~{a.max_temp}°C</div>
            <div><span className="text-slate-500">来源：</span>{a.source_type === 'auto' ? '自动检测' : '人工录入'}</div>
            <div><span className="text-slate-500">创建：</span>{formatDateTime(a.created_at)}</div>
          </div>
          {a.description && <div className="text-sm text-slate-600 mt-2">{a.description}</div>}
        </div>
      ))}
    </div>
  )
}

function AttachmentsTab({ list, onUpload }: { list: Attachment[]; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <div className="mb-4">
        <label className="btn-primary cursor-pointer inline-block">
          + 上传附件
          <input type="file" multiple className="hidden" onChange={onUpload} />
        </label>
      </div>
      {list.length === 0 ? <Empty /> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">文件名</th>
                <th className="table-th">分类</th>
                <th className="table-th">大小</th>
                <th className="table-th">上传时间</th>
                <th className="table-th">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="table-td">{a.file_name}</td>
                  <td className="table-td">{a.category || '-'}</td>
                  <td className="table-td">{formatFileSize(a.file_size)}</td>
                  <td className="table-td">{formatDateTime(a.uploaded_at)}</td>
                  <td className="table-td">
                    <a href={a.file_path.startsWith('/') ? a.file_path : `/api${a.file_path}`} target="_blank" rel="noreferrer" className="link text-sm">查看</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LogsTab({ list }: { list: ActionLog[] }) {
  if (list.length === 0) return <Empty />
  return (
    <ul className="relative border-l border-slate-200 ml-3 space-y-5">
      {list.map((log) => (
        <li key={log.id} className="pl-6 relative">
          <span className="absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-800">{log.user?.full_name || log.user_id}</span>
            <span className="text-xs text-slate-500">{log.action}</span>
          </div>
          {log.detail && Object.keys(log.detail).length > 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1 inline-block mb-1">
              {JSON.stringify(log.detail)}
            </div>
          )}
          <div className="text-xs text-slate-400">{formatDateTime(log.created_at)}</div>
        </li>
      ))}
    </ul>
  )
}

function Empty() {
  return <div className="text-center text-slate-400 py-12 text-sm">暂无数据</div>
}
