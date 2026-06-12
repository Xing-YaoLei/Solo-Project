import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  MapPin,
  Cpu,
  User,
  Clock,
  ClipboardCheck,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cleaningApi } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { OfflineAlert } from '@/components/OfflineAlert'
import {
  cn,
  formatDateTime,
  SOURCE_CHANNEL_LABELS,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_COLORS,
  STATUS_LABELS,
  CLOSE_REASON_LABELS,
} from '@/lib/utils'
import type { CleaningRecord, CloseReason } from '@/lib/types'

export default function RecordDetailPage() {
  const { recordId } = useParams({ strict: false })
  const navigate = useNavigate()
  const [record, setRecord] = useState<CleaningRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [reviewResult, setReviewResult] = useState('')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [needSupplement, setNeedSupplement] = useState(false)
  const [closeReason, setCloseReason] = useState<CloseReason>('qualified')
  const [closeRemarks, setCloseRemarks] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (recordId) loadRecord(Number(recordId))
  }, [recordId])

  const loadRecord = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await cleaningApi.get(id)
      setRecord(res.data)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '加载单据失败，请检查后端服务'
      setError(msg)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!record) return
    setProcessing(true)
    try {
      await cleaningApi.submitReview(record.id)
      await loadRecord(record.id)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '提交复核失败'
      setError(msg)
    } finally {
      setProcessing(false)
    }
  }

  const handleStartReview = async () => {
    if (!record) return
    setProcessing(true)
    try {
      await cleaningApi.startReview(record.id)
      await loadRecord(record.id)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '开始复核失败'
      setError(msg)
    } finally {
      setProcessing(false)
    }
  }

  const handleReview = async () => {
    if (!record || !reviewResult) return
    setProcessing(true)
    try {
      await cleaningApi.review(record.id, {
        review_result: reviewResult,
        review_remarks: reviewRemarks,
        need_supplement: needSupplement,
        review_photos: [],
      })
      await loadRecord(record.id)
      setShowReviewModal(false)
      setReviewResult('')
      setReviewRemarks('')
      setNeedSupplement(false)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '提交复核结果失败'
      setError(msg)
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = async () => {
    if (!record) return
    setProcessing(true)
    try {
      await cleaningApi.close(record.id, {
        close_reason: closeReason,
        close_remarks: closeRemarks,
      })
      await loadRecord(record.id)
      setShowCloseModal(false)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '关闭单据失败'
      setError(msg)
    } finally {
      setProcessing(false)
    }
  }

  const handleOffline = async () => {
    if (!record) return
    try {
      await cleaningApi.handleOffline(record.id, '现场确认已恢复')
      await loadRecord(record.id)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '处理离线异常失败'
      setError(msg)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>
  }
  if (error && !record) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-red-800">加载失败</p>
          <p className="text-sm text-red-600 mt-2">{error}</p>
          <button
            onClick={() => recordId && loadRecord(Number(recordId))}
            className="btn-primary mt-4 gap-2"
          >
            <RefreshCw className="w-4 h-4" /> 重新加载
          </button>
        </div>
      </div>
    )
  }
  if (!record) {
    return <div className="p-8 text-center text-gray-500">单据不存在</div>
  }

  const completedCount = record.cleaning_items.filter((i) => i.completed).length
  const isClosed = record.status === 'closed'

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">操作失败</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-sm text-red-600 hover:text-red-800">
            关闭
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/records' })}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{record.record_no}</h1>
              <StatusBadge status={record.status} />
              {record.is_device_offline && !record.offline_handled && (
                <span className="badge bg-red-100 text-red-800 animate-pulse">设备离线</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              来源：{SOURCE_CHANNEL_LABELS[record.source_channel]} · 创建于 {formatDateTime(record.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {record.status === 'draft' && (
            <button onClick={handleSubmitReview} disabled={processing} className="btn-primary gap-2">
              <Send className="w-4 h-4" /> 提交复核
            </button>
          )}
          {record.status === 'supplement_info' && (
            <button onClick={handleSubmitReview} disabled={processing} className="btn-primary gap-2">
              <Send className="w-4 h-4" /> 再次提交复核
            </button>
          )}
          {record.status === 'pending_review' && (
            <button onClick={handleStartReview} disabled={processing} className="btn-primary gap-2">
              <Play className="w-4 h-4" /> 开始复核
            </button>
          )}
          {record.status === 'reviewing' && (
            <button onClick={() => setShowReviewModal(true)} className="btn-primary gap-2">
              <ClipboardCheck className="w-4 h-4" /> 提交复核结果
            </button>
          )}
          {(record.status === 'completed' || record.status === 'closed') && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="btn-secondary gap-2"
              disabled={isClosed}
            >
              <CheckCircle2 className="w-4 h-4" /> {isClosed ? '已关闭' : '关闭单据'}
            </button>
          )}
        </div>
      </div>

      {record.is_device_offline && (
        <OfflineAlert
          deviceName={record.device.device_name}
          handled={record.offline_handled}
          remarks={record.offline_remarks}
          onHandle={!record.offline_handled && !isClosed ? handleOffline : undefined}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <MapPin className="w-5 h-5 text-coffee-600" />
                <h3 className="font-semibold">门店点位</h3>
              </div>
              <div className="card-body space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">名称</span>
                  <span className="font-medium">{record.store_point.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">编号</span>
                  <span>{record.store_point.store_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">区域</span>
                  <span>{record.store_point.region || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">地址</span>
                  <span className="text-right max-w-[60%]">{record.store_point.address || '-'}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Cpu className="w-5 h-5 text-coffee-600" />
                <h3 className="font-semibold">设备信息</h3>
              </div>
              <div className="card-body space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">名称</span>
                  <span className="font-medium">{record.device.device_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">编号</span>
                  <span>{record.device.device_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">状态</span>
                  <span className={cn('badge', DEVICE_STATUS_COLORS[record.device.status])}>
                    {DEVICE_STATUS_LABELS[record.device.status]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最后心跳</span>
                  <span>{formatDateTime(record.device.last_heartbeat)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-coffee-600" />
                <h3 className="font-semibold">清洁项目清单</h3>
              </div>
              <div className="text-sm text-gray-600">
                完成度 <span className="font-semibold text-coffee-700">
                  {completedCount}/{record.cleaning_items.length}
                </span>
              </div>
            </div>
            <div className="card-body">
              {record.cleaning_items.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">暂无清洁项目</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {record.cleaning_items.map((item, idx) => (
                    <li key={idx} className="py-3 flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={cn(
                        'flex-1',
                        item.completed ? 'text-gray-900' : 'text-gray-500'
                      )}>{item.name}</span>
                      {item.remarks && (
                        <span className="text-sm text-gray-500">{item.remarks}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {record.cleaning_remarks && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">清洁备注</div>
                  <p className="text-sm text-gray-700">{record.cleaning_remarks}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">复查结果</h3>
            </div>
            <div className="card-body space-y-3">
              {!record.review_result ? (
                <p className="text-gray-500 text-sm py-4 text-center">暂无复查结果</p>
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">巡检结果</div>
                      <div className="font-medium mt-1">
                        {record.review_result === 'qualified' ? '合格' :
                          record.review_result === 'partially_qualified' ? '部分合格' :
                          record.review_result === 'unqualified' ? '不合格' : record.review_result}
                      </div>
                    </div>
                    {record.qualified_rate != null && (
                      <div>
                        <div className="text-sm text-gray-500">合格率</div>
                        <div className="font-medium text-coffee-700 mt-1">{record.qualified_rate}%</div>
                      </div>
                    )}
                  </div>
                  {record.review_remarks && (
                    <div>
                      <div className="text-sm text-gray-500">复查备注</div>
                      <p className="text-sm text-gray-700 mt-1">{record.review_remarks}</p>
                    </div>
                  )}
                  {record.review_date && (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 复核于 {formatDateTime(record.review_date)}
                    </div>
                  )}
                </>
              )}
              {record.supplement_notes && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-xs text-orange-700 font-medium flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" /> 补资料说明
                  </div>
                  <p className="text-sm text-orange-800">{record.supplement_notes}</p>
                </div>
              )}
            </div>
          </div>

          {isClosed && (
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">关闭信息</h3>
              </div>
              <div className="card-body space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">关闭原因</span>
                  <span className="font-medium">
                    {record.close_reason ? CLOSE_REASON_LABELS[record.close_reason] : '-'}
                  </span>
                </div>
                {record.close_remarks && (
                  <div>
                    <div className="text-gray-500 mb-1">关闭备注</div>
                    <p className="text-gray-700">{record.close_remarks}</p>
                  </div>
                )}
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 关闭于 {formatDateTime(record.closed_at)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <User className="w-5 h-5 text-coffee-600" />
              <h3 className="font-semibold">人员信息</h3>
            </div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">清洁人员</span>
                <span className="font-medium">{record.cleaning_person?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">复核人员</span>
                <span>{record.reviewer?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">关闭操作人</span>
                <span>{record.closed_by?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">清洁时间</span>
                <span>{formatDateTime(record.cleaning_date)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">状态流转日志</h3>
            </div>
            <div className="card-body">
              <ol className="relative border-l border-gray-200 ml-2">
                {record.status_logs.length === 0 ? (
                  <li className="ml-4 pb-2 text-sm text-gray-500">暂无日志</li>
                ) : (
                  record.status_logs.map((log, idx) => (
                    <li key={idx} className="ml-4 pb-4 last:pb-0">
                      <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-coffee-500 border-2 border-white" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {STATUS_LABELS[log.to_status]}
                        </span>
                        {log.from_status && (
                          <span className="text-xs text-gray-500">
                            ← {STATUS_LABELS[log.from_status]}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {log.operator?.name || '系统'} · {formatDateTime(log.created_at)}
                      </div>
                      {log.remarks && (
                        <div className="text-xs text-gray-600 mt-1">{log.remarks}</div>
                      )}
                    </li>
                  ))
                )}
              </ol>
            </div>
          </div>

          {isClosed && (
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 text-sm">
              <div className="flex items-center gap-2 text-purple-800 font-medium mb-1">
                <FileText className="w-4 h-4" />
                单据已归档
              </div>
              <p className="text-purple-700 text-xs">
                已关闭单据的所有记录永久保留，可用于后续查证和统计汇总。
              </p>
            </div>
          )}
        </div>
      </div>

      {showReviewModal && (
        <Modal title="提交复核结果" onClose={() => setShowReviewModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">巡检结果 <span className="text-red-500">*</span></label>
              <select value={reviewResult} onChange={(e) => setReviewResult(e.target.value)} className="input">
                <option value="">请选择</option>
                <option value="qualified">合格</option>
                <option value="partially_qualified">部分合格</option>
                <option value="unqualified">不合格</option>
              </select>
            </div>
            <div>
              <label className="label">复核备注</label>
              <textarea
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                rows={3}
                className="input"
                placeholder="说明复核情况..."
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needSupplement}
                onChange={(e) => setNeedSupplement(e.target.checked)}
                className="rounded border-gray-300 text-coffee-600 focus:ring-coffee-500"
              />
              <span className="text-sm text-gray-700">需要补充资料（退回补资料状态）</span>
            </label>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleReview} disabled={processing || !reviewResult} className="btn-primary">
                确认提交
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCloseModal && (
        <Modal title="关闭单据" onClose={() => setShowCloseModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">关闭原因 <span className="text-red-500">*</span></label>
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value as CloseReason)}
                className="input"
              >
                {Object.entries(CLOSE_REASON_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">备注</label>
              <textarea
                value={closeRemarks}
                onChange={(e) => setCloseRemarks(e.target.value)}
                rows={3}
                className="input"
                placeholder="关闭说明（可选）..."
              />
            </div>
            <div className="p-3 bg-blue-50 rounded text-xs text-blue-700">
              关闭后单据将进入归档状态，所有记录保留用于后续查证。
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setShowCloseModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleClose} disabled={processing} className="btn-primary">确认关闭</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

