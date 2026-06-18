import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  FileText,
  Plus,
  Edit3,
  Save,
  X,
  ClipboardList,
  Package,
  AlertCircle,
} from 'lucide-react'
import api from '@/lib/api'
import type { WorkOrder, Diagnostic, WorkOrderItem } from '@/types'
import dayjs from 'dayjs'

const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-slate-100 text-slate-600' },
  reworked: { label: '返修', color: 'bg-red-100 text-red-700' },
}

function RecordsDetailPage() {
  const params = Route.useParams()
  const navigate = useNavigate()
  const orderId = Number(params.id)

  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [loading, setLoading] = useState(true)

  const [newDiag, setNewDiag] = useState<Partial<Diagnostic>>({})
  const [editingDiag, setEditingDiag] = useState<number | null>(null)
  const [editDiagData, setEditDiagData] = useState<Partial<Diagnostic>>({})

  const [newItem, setNewItem] = useState<Partial<WorkOrderItem>>({ item_type: 'labor', status: 'pending' })

  const [status, setStatus] = useState('')
  const [complaint, setComplaint] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [orderRes, diagRes, itemsRes] = await Promise.all([
        api.get(`/work-orders/${orderId}`),
        api.get(`/work-orders/${orderId}/diagnostics`),
        api.get(`/work-orders/${orderId}/items`),
      ])
      setOrder(orderRes.data)
      setDiagnostics(diagRes.data)
      setItems(itemsRes.data)
      setStatus(orderRes.data.status)
      setComplaint(orderRes.data.complaint || '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [orderId])

  const saveOrderChanges = async () => {
    try {
      await api.put(`/work-orders/${orderId}`, { status, complaint })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '保存失败')
    }
  }

  const addDiagnostic = async () => {
    if (!newDiag.conclusion && !newDiag.symptom) {
      alert('请填写症状或结论')
      return
    }
    try {
      await api.post(`/work-orders/${orderId}/diagnostics`, {
        work_order_id: orderId,
        ...newDiag,
      })
      setNewDiag({})
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '添加失败')
    }
  }

  const saveEditedDiagnostic = async (id: number) => {
    try {
      await api.put(`/diagnostics/${id}`, editDiagData)
      setEditingDiag(null)
      setEditDiagData({})
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '保存失败')
    }
  }

  const addWorkOrderItem = async () => {
    if (!newItem.name) {
      alert('请输入项目名称')
      return
    }
    try {
      await api.post(`/work-orders/${orderId}/items`, {
        work_order_id: orderId,
        ...newItem,
      })
      setNewItem({ item_type: 'labor', status: 'pending' })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '添加失败')
    }
  }

  const updateItemStatus = async (itemId: number, newStatus: string) => {
    try {
      await api.put(`/work-order-items/${itemId}`, { status: newStatus })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '更新失败')
    }
  }

  if (loading) {
    return <p className="text-slate-500">加载中...</p>
  }

  if (!order) {
    return <p className="text-slate-500">工单不存在</p>
  }

  const vehicle = order.vehicle
  const statusInfo = orderStatusMap[order.status] || orderStatusMap.pending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="btn btn-secondary" onClick={() => navigate({ to: '/records' })}>
            <ArrowLeft size={16} />
            返回
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">工单 {order.order_no}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
              {order.is_rework && <span className="badge bg-red-100 text-red-700">返修工单</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">工单状态</label>
              <select
                className="input w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="closed">已关闭</option>
                <option value="reworked">返修</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">客户故障描述</label>
              <textarea
                className="input w-full min-h-[42px]"
                rows={2}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" onClick={saveOrderChanges}>
              <Save size={14} />
              保存修改
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左栏：车辆档案 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-primary-600" />
              <h2 className="card-title">车辆档案</h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            {vehicle ? (
              <>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Car size={24} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{vehicle.plate_number}</p>
                      <p className="text-sm text-slate-500">
                        {vehicle.brand} {vehicle.model} {vehicle.year || ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FileText size={14} /> VIN码
                    </span>
                    <span className="text-slate-900 font-medium">{vehicle.vin || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">颜色</span>
                    <span className="text-slate-900 font-medium">{vehicle.color || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">里程数</span>
                    <span className="text-slate-900 font-medium">{vehicle.mileage ? `${vehicle.mileage} km` : '-'}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User size={14} /> 车主
                      </span>
                      <span className="text-slate-900 font-medium">{vehicle.owner_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Phone size={14} /> 联系电话
                      </span>
                      <span className="text-slate-900 font-medium">{vehicle.owner_phone || '-'}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">暂无车辆信息</p>
            )}
          </div>
        </div>

        {/* 中栏：诊断结果 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-primary-600" />
              <h2 className="card-title">诊断结果</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3 mb-4">
              {diagnostics.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">暂无诊断记录</p>
                </div>
              ) : (
                diagnostics.map((d) => (
                  <div key={d.id} className="border border-slate-200 rounded-lg p-3">
                    {editingDiag === d.id ? (
                      <div className="space-y-2">
                        <input
                          className="input w-full"
                          placeholder="故障码"
                          value={editDiagData.fault_code || ''}
                          onChange={(e) => setEditDiagData({ ...editDiagData, fault_code: e.target.value })}
                        />
                        <textarea
                          className="input w-full"
                          rows={2}
                          placeholder="故障现象"
                          value={editDiagData.symptom || ''}
                          onChange={(e) => setEditDiagData({ ...editDiagData, symptom: e.target.value })}
                        />
                        <textarea
                          className="input w-full"
                          rows={2}
                          placeholder="诊断分析"
                          value={editDiagData.analysis || ''}
                          onChange={(e) => setEditDiagData({ ...editDiagData, analysis: e.target.value })}
                        />
                        <textarea
                          className="input w-full"
                          rows={2}
                          placeholder="结论"
                          value={editDiagData.conclusion || ''}
                          onChange={(e) => setEditDiagData({ ...editDiagData, conclusion: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button
                            className="btn btn-primary text-xs"
                            onClick={() => saveEditedDiagnostic(d.id)}
                          >
                            <Save size={12} />
                            保存
                          </button>
                          <button
                            className="btn btn-secondary text-xs"
                            onClick={() => {
                              setEditingDiag(null)
                              setEditDiagData({})
                            }}
                          >
                            <X size={12} />
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          {d.fault_code && (
                            <span className="badge bg-orange-100 text-orange-700">{d.fault_code}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {dayjs(d.created_at).format('MM-DD HH:mm')}
                            </span>
                            <button
                              className="text-slate-400 hover:text-primary-600"
                              onClick={() => {
                                setEditingDiag(d.id)
                                setEditDiagData({
                                  symptom: d.symptom || '',
                                  fault_code: d.fault_code || '',
                                  analysis: d.analysis || '',
                                  conclusion: d.conclusion || '',
                                })
                              }}
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </div>
                        {d.symptom && (
                          <div className="mb-2">
                            <p className="text-xs text-slate-500">故障现象</p>
                            <p className="text-sm text-slate-900">{d.symptom}</p>
                          </div>
                        )}
                        {d.analysis && (
                          <div className="mb-2">
                            <p className="text-xs text-slate-500">诊断分析</p>
                            <p className="text-sm text-slate-900">{d.analysis}</p>
                          </div>
                        )}
                        {d.conclusion && (
                          <div>
                            <p className="text-xs text-slate-500">结论</p>
                            <p className="text-sm text-slate-900 font-medium">{d.conclusion}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">添加诊断记录</p>
              <div className="space-y-2">
                <input
                  className="input w-full"
                  placeholder="故障码（可选）"
                  value={newDiag.fault_code || ''}
                  onChange={(e) => setNewDiag({ ...newDiag, fault_code: e.target.value })}
                />
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="故障现象"
                  value={newDiag.symptom || ''}
                  onChange={(e) => setNewDiag({ ...newDiag, symptom: e.target.value })}
                />
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="诊断分析（可选）"
                  value={newDiag.analysis || ''}
                  onChange={(e) => setNewDiag({ ...newDiag, analysis: e.target.value })}
                />
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="诊断结论"
                  value={newDiag.conclusion || ''}
                  onChange={(e) => setNewDiag({ ...newDiag, conclusion: e.target.value })}
                />
                <button className="btn btn-primary w-full justify-center" onClick={addDiagnostic}>
                  <Plus size={14} />
                  提交诊断
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：工单项目 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-primary-600" />
              <h2 className="card-title">工单项目</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-2 mb-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">暂无维修项目</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${
                            item.item_type === 'part'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.item_type === 'part' ? '配件' : '工时'}
                        </span>
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      </div>
                    </div>
                    {item.description && <p className="text-xs text-slate-500 mb-2">{item.description}</p>}
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span>数量: {item.quantity}</span>
                      <span>单价: ¥{item.unit_price}</span>
                      <span className="font-medium text-slate-900">
                        ¥{(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                      </span>
                    </div>
                    <select
                      className="input w-full text-xs py-1"
                      value={item.status}
                      onChange={(e) => updateItemStatus(item.id, e.target.value)}
                    >
                      <option value="pending">待处理</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                    </select>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">添加项目</p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="input"
                    value={newItem.item_type || 'labor'}
                    onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}
                  >
                    <option value="labor">工时项目</option>
                    <option value="part">配件项目</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="数量"
                    value={newItem.quantity?.toString() || '1'}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value as any })}
                  />
                </div>
                <input
                  className="input w-full"
                  placeholder="项目名称"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  className="input w-full"
                  placeholder="单价（元）"
                  value={newItem.unit_price?.toString() || '0'}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value as any })}
                />
                <textarea
                  className="input w-full"
                  rows={2}
                  placeholder="项目描述（可选）"
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
                <button className="btn btn-primary w-full justify-center" onClick={addWorkOrderItem}>
                  <Plus size={14} />
                  添加项目
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app/records/$id')({
  component: RecordsDetailPage,
})
