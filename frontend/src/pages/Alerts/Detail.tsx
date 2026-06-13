import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { alertsApi } from '@/api'
import { AlertStatusBadge, SeverityBadge } from '@/components/Badges'
import { Modal } from '@/components/Modal'
import { formatDateTime, formatTemp } from '@/utils'
import type { TemperatureAlert, AlertHistory, TemperatureAlertStatus } from '@/types'
import { ALERT_STATUS_LABEL } from '@/types'
import { useAuthStore } from '@/store/auth'
import { RoleEnum } from '@/types'

export function AlertDetailPage() {
  const { alertId } = useParams({ from: '/alerts/$alertId' })
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [alert, setAlert] = useState<TemperatureAlert | null>(null)
  const [history, setHistory] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(true)

  const [showAckModal, setShowAckModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [note, setNote] = useState('')
  const [resolution, setResolution] = useState('')

  useEffect(() => { load() }, [alertId])

  async function load() {
    setLoading(true)
    try {
      const [a, h] = await Promise.all([
        alertsApi.get(Number(alertId)),
        alertsApi.history(Number(alertId)),
      ])
      setAlert(a)
      setHistory(h)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !alert) return <div className="text-center py-20 text-slate-500">加载中...</div>

  const canHandle = user?.role && [RoleEnum.QC, RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN].includes(user.role)
  const canClose = user?.role && [RoleEnum.QC, RoleEnum.PURCHASER, RoleEnum.ADMIN].includes(user.role)

  const canAck = [TemperatureAlertStatus.OPEN, TemperatureAlertStatus.ACKNOWLEDGED].includes(alert.status)
  const canProcess = [TemperatureAlertStatus.OPEN, TemperatureAlertStatus.ACKNOWLEDGED].includes(alert.status) && canHandle
  const canResolve = [TemperatureAlertStatus.PROCESSING, TemperatureAlertStatus.ACKNOWLEDGED].includes(alert.status) && canHandle
  const canClose = alert.status === TemperatureAlertStatus.RESOLVED && canClose

  const doAction = async (fn: () => Promise<any>) => {
    await fn()
    setNote(''); setResolution('')
    setShowAckModal(false); setShowProcessModal(false); setShowResolveModal(false); setShowCloseModal(false)
    load()
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={() => navigate({ to: '/alerts' })}>← 返回列表</button>
        <h2 className="text-xl font-semibold text-slate-800">温度异常 #{alert.id}</h2>
        <SeverityBadge severity={alert.severity} />
        <AlertStatusBadge status={alert.status} />
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-slate-800">异常详情</h3></div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <Info label="关联补货单" value={
            <Link to="/orders/$orderId" params={{ orderId: String(alert.order_id) }} className="link">查看单据 →</Link>
          } />
          <Info label="触发来源" value={alert.source_type === 'auto' ? '自动检测（Celery任务）' : '人工录入'} />
          <Info label="异常类型" value={alert.alert_type} />
          <Info label="持续时长" value={alert.duration_minutes ? `${alert.duration_minutes} 分钟` : '-'} />
          <Info label="实际温度" value={<span className="text-red-600 font-semibold">{formatTemp(alert.actual_temp)}</span>} />
          <Info label="允许范围" value={`${alert.min_temp} ~ ${alert.max_temp}°C`} />
          <Info label="创建时间" value={formatDateTime(alert.created_at)} />
          <Info label="最后更新" value={formatDateTime(alert.updated_at)} />
          <Info label="确认时间" value={formatDateTime(alert.acknowledged_at)} />
          <Info label="处理人" value={alert.handler?.full_name || '-'} />
          <Info label="处理时间" value={formatDateTime(alert.handled_at)} />
          <Info label="关闭时间" value={formatDateTime(alert.closed_at)} />
          <div className="md:col-span-2">
            <div className="text-sm text-slate-500 mb-1">描述</div>
            <div className="text-sm text-slate-700 bg-slate-50 rounded p-3">{alert.description || '无'}</div>
          </div>
          {alert.resolution && (
            <div className="md:col-span-2">
              <div className="text-sm text-slate-500 mb-1">处理方案</div>
              <div className="text-sm text-slate-700 bg-green-50 rounded p-3 border border-green-200">{alert.resolution}</div>
            </div>
          )}
        </div>
      </div>

      {alert.trigger_record && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-slate-800">触发记录</h3></div>
          <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Info label="温度" value={<span className="text-red-600 font-medium">{formatTemp(alert.trigger_record.temperature)}</span>} />
            <Info label="范围" value={`${alert.trigger_record.min_temp}~${alert.trigger_record.max_temp}°C`} />
            <Info label="位置" value={alert.trigger_record.location || '-'} />
            <Info label="记录时间" value={formatDateTime(alert.trigger_record.recorded_at)} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">状态流转追踪</h3>
          <div className="flex items-center gap-2">
            {canAck && <button className="btn-secondary text-sm" onClick={() => { setNote(''); setShowAckModal(true) }}>确认</button>}
            {canProcess && <button className="btn-secondary text-sm" onClick={() => { setNote(''); setShowProcessModal(true) }}>开始处理</button>}
            {canResolve && <button className="btn-primary text-sm" onClick={() => { setResolution(''); setShowResolveModal(true) }}>标记解决</button>}
            {canClose && <button className="btn-secondary text-sm" onClick={() => { setResolution(alert.resolution || ''); setShowCloseModal(true) }}>关闭</button>}
          </div>
        </div>
        <div className="card-body">
          <ul className="relative border-l border-slate-200 ml-3 space-y-5">
            {history.length === 0 && <div className="text-sm text-slate-400 pl-6">暂无历史记录</div>}
            {history.map((h) => (
              <li key={h.id} className="pl-6 relative">
                <span className="absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {h.from_status && <AlertStatusBadge status={h.from_status} />}
                  {h.from_status && <span className="text-slate-400">→</span>}
                  <AlertStatusBadge status={h.to_status} />
                  <span className="text-sm text-slate-600 font-medium">{h.action}</span>
                </div>
                {h.note && <div className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1 inline-block mb-1">{h.note}</div>}
                <div className="text-xs text-slate-400">
                  {h.operator?.full_name || '系统'} · {formatDateTime(h.created_at)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal
        open={showAckModal}
        onClose={() => setShowAckModal(false)}
        title="确认告警"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowAckModal(false)}>取消</button>
          <button className="btn-primary" onClick={() => doAction(() => alertsApi.acknowledge(alert.id, note || undefined))}>确认</button>
        </>}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="可选填写确认说明" />
        </div>
      </Modal>

      <Modal
        open={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="开始处理"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowProcessModal(false)}>取消</button>
          <button className="btn-primary" onClick={() => doAction(() => alertsApi.startProcessing(alert.id, note || undefined))}>确认</button>
        </>}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">处理说明</label>
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="标记已解决"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowResolveModal(false)}>取消</button>
          <button className="btn-primary" onClick={() => doAction(() => alertsApi.resolve(alert.id, resolution || undefined))}>确认</button>
        </>}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">解决说明 <span className="text-red-500">*</span></label>
          <textarea className="input" rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="请填写问题处理方案和结果" />
        </div>
      </Modal>

      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="关闭告警"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowCloseModal(false)}>取消</button>
          <button className="btn-primary" onClick={() => doAction(() => alertsApi.close(alert.id, resolution || undefined))}>确认关闭</button>
        </>}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">最终说明</label>
          <textarea className="input" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm text-slate-800 font-medium">{value}</div>
    </div>
  )
}
