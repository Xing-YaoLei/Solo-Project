import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Plus, X, Check, Clock, User, FileText } from 'lucide-react'
import api from '@/lib/api'
import type { PartShortage } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: '待处理', color: 'bg-red-100 text-red-700' },
  processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-700' },
  closed: { label: '已关闭', color: 'bg-green-100 text-green-700' },
}

function ShortagesPage() {
  const [shortages, setShortages] = useState<PartShortage[]>([])
  const [loading, setLoading] = useState(true)
  const [openOnly, setOpenOnly] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showHandle, setShowHandle] = useState(false)
  const [selected, setSelected] = useState<PartShortage | null>(null)

  const [newShortage, setNewShortage] = useState({
    part_id: 0,
    work_order_id: undefined as number | undefined,
    required_quantity: 1,
  })
  const [handleForm, setHandleForm] = useState({
    status: 'processing' as 'processing' | 'closed',
    reason: '',
    action_taken: '',
  })

  const loadShortages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/shortages', { params: { open_only: openOnly || undefined } })
      setShortages(res.data)
    } finally {
      setLoading(false)
    }
  }, [openOnly])

  useEffect(() => {
    loadShortages()
    const interval = setInterval(loadShortages, 30000)
    return () => clearInterval(interval)
  }, [loadShortages])

  const openCount = shortages.filter((s) => s.status !== 'closed').length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/shortages', newShortage)
      setShowAdd(false)
      setNewShortage({ part_id: 0, work_order_id: undefined, required_quantity: 1 })
      loadShortages()
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建失败')
    }
  }

  const openHandle = (s: PartShortage) => {
    setSelected(s)
    setHandleForm({
      status: s.status === 'open' ? 'processing' : s.status === 'processing' ? 'closed' : 'closed',
      reason: s.reason || '',
      action_taken: s.action_taken || '',
    })
    setShowHandle(true)
  }

  const submitHandle = async () => {
    if (!selected) return
    try {
      if (handleForm.status === 'closed') {
        await api.post(`/shortages/${selected.id}/close`, handleForm)
      } else {
        await api.put(`/shortages/${selected.id}`, handleForm)
      }
      setShowHandle(false)
      setSelected(null)
      loadShortages()
    } catch (err: any) {
      alert(err.response?.data?.detail || '处理失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            缺货通知
            {openCount > 0 && (
              <span className="badge bg-red-100 text-red-700 animate-pulse">
                {openCount} 条待处理
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">配件缺货自动提醒，记录处理原因和动作，自动记录关闭时间</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">仅看未关闭</span>
          </label>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            新建缺货单
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">加载中...</p>
      ) : shortages.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <Check size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-slate-600 font-medium">暂无缺货记录</p>
            <p className="text-sm text-slate-400 mt-1">页面将每30秒自动刷新</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {shortages.map((s) => {
            const st = statusMap[s.status] || statusMap.open
            return (
              <div key={s.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          s.status === 'closed' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        <AlertTriangle size={20} className={s.status === 'closed' ? 'text-green-600' : 'text-red-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-slate-900">
                            {s.part?.name || `配件 #${s.part_id}`}
                          </h3>
                          <span className={`badge ${st.color}`}>{st.label}</span>
                          {s.part?.sku && (
                            <span className="text-xs text-slate-500 font-mono">SKU: {s.part.sku}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-slate-500">需求数量</p>
                            <p className="font-medium text-slate-900">{s.required_quantity}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 flex items-center gap-1">
                              <Clock size={12} /> 上报时间
                            </p>
                            <p className="font-medium text-slate-900">
                              {dayjs(s.reported_at).format('YYYY-MM-DD HH:mm')}
                            </p>
                          </div>
                          {s.closed_at && (
                            <div>
                              <p className="text-slate-500 flex items-center gap-1">
                                <Check size={12} /> 关闭时间
                              </p>
                              <p className="font-medium text-green-700">
                                {dayjs(s.closed_at).format('YYYY-MM-DD HH:mm')}
                              </p>
                            </div>
                          )}
                          {s.handler && (
                            <div>
                              <p className="text-slate-500 flex items-center gap-1">
                                <User size={12} /> 处理人
                              </p>
                              <p className="font-medium text-slate-900">{s.handler.full_name}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 space-y-2">
                          {s.reason && (
                            <div className="bg-slate-50 rounded-md p-2">
                              <p className="text-xs text-slate-500 mb-0.5">缺货原因</p>
                              <p className="text-sm text-slate-700">{s.reason}</p>
                            </div>
                          )}
                          {s.action_taken && (
                            <div className="bg-blue-50 rounded-md p-2">
                              <p className="text-xs text-blue-600 mb-0.5">处理动作</p>
                              <p className="text-sm text-blue-800">{s.action_taken}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {s.status !== 'closed' && (
                      <button className="btn btn-primary flex-shrink-0" onClick={() => openHandle(s)}>
                        <FileText size={14} />
                        处理
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">新建缺货单</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowAdd(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="label">配件ID *</label>
                <input
                  type="number"
                  className="input w-full"
                  required
                  min={1}
                  value={newShortage.part_id || ''}
                  onChange={(e) => setNewShortage({ ...newShortage, part_id: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">关联工单号（可选）</label>
                <input
                  type="number"
                  className="input w-full"
                  value={newShortage.work_order_id || ''}
                  onChange={(e) =>
                    setNewShortage({
                      ...newShortage,
                      work_order_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">需求数量 *</label>
                <input
                  type="number"
                  className="input w-full"
                  required
                  min={1}
                  value={newShortage.required_quantity}
                  onChange={(e) => setNewShortage({ ...newShortage, required_quantity: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  上报
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHandle && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">处理缺货单</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowHandle(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium">{selected.part?.name || `配件 #${selected.part_id}`}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  上报时间: {dayjs(selected.reported_at).format('YYYY-MM-DD HH:mm')}
                </p>
              </div>
              <div>
                <label className="label">处理状态</label>
                <select
                  className="input w-full"
                  value={handleForm.status}
                  onChange={(e) => setHandleForm({ ...handleForm, status: e.target.value as any })}
                >
                  <option value="processing">处理中</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>
              <div>
                <label className="label">缺货原因</label>
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="记录缺货原因..."
                  value={handleForm.reason}
                  onChange={(e) => setHandleForm({ ...handleForm, reason: e.target.value })}
                />
              </div>
              <div>
                <label className="label">处理动作</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="记录已采取的处理动作，如：已采购、调货、替代方案等"
                  value={handleForm.action_taken}
                  onChange={(e) => setHandleForm({ ...handleForm, action_taken: e.target.value })}
                />
              </div>
              {handleForm.status === 'closed' && (
                <p className="text-xs text-green-700 bg-green-50 rounded p-2">
                  <Check size={12} className="inline mr-1" />
                  关闭时将自动记录当前时间为关闭时间，并登记当前用户为处理人
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowHandle(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={submitHandle}>
                  {handleForm.status === 'closed' ? '关闭并保存' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_app/shortages')({
  component: ShortagesPage,
})
