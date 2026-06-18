import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Eye, Search, X, Car, User as UserIcon, Wrench, AlertCircle, Check } from 'lucide-react'
import api from '@/lib/api'
import type { WorkOrder, Vehicle, Station, User } from '@/types'
import dayjs from 'dayjs'

const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-slate-100 text-slate-600' },
  reworked: { label: '返修', color: 'bg-red-100 text-red-700' },
}

function RecordsListPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const [showCreate, setShowCreate] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [vehicleMode, setVehicleMode] = useState<'select' | 'new'>('select')
  const [form, setForm] = useState({
    vehicle_id: 0,
    station_id: 0,
    technician_id: 0,
    complaint: '',
    plate_number: '',
    vin: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    mileage: '',
    owner_name: '',
    owner_phone: '',
  })

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/work-orders', { params })
      let data = res.data
      if (search) {
        const q = search.toLowerCase()
        data = data.filter((o: WorkOrder) =>
          o.order_no.toLowerCase().includes(q) ||
          (o.complaint || '').toLowerCase().includes(q)
        )
      }
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }

  const loadCreateData = async () => {
    try {
      const [vRes, sRes, uRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/stations'),
        api.get('/auth/me').catch(() => ({ data: null })),
      ])
      setVehicles(vRes.data)
      setStations(sRes.data)
      setUsers([uRes.data].filter(Boolean) as User[])
    } catch {}
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter, search])

  const openCreate = async () => {
    setForm({
      vehicle_id: 0,
      station_id: 0,
      technician_id: 0,
      complaint: '',
      plate_number: '',
      vin: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      mileage: '',
      owner_name: '',
      owner_phone: '',
    })
    setVehicleMode('select')
    setShowCreate(true)
    await loadCreateData()
  }

  const resetForm = () => {
    setForm({
      vehicle_id: 0,
      station_id: 0,
      technician_id: 0,
      complaint: '',
      plate_number: '',
      vin: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      mileage: '',
      owner_name: '',
      owner_phone: '',
    })
    setVehicleMode('select')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let finalVehicleId = form.vehicle_id

      if (vehicleMode === 'new') {
        if (!form.plate_number || !form.brand || !form.model) {
          alert('请填写车牌号、品牌和车型')
          setSubmitting(false)
          return
        }
        const vPayload: any = {
          plate_number: form.plate_number,
          vin: form.vin || undefined,
          brand: form.brand,
          model: form.model,
          year: form.year ? Number(form.year) : undefined,
          color: form.color || undefined,
          mileage: form.mileage ? Number(form.mileage) : undefined,
          owner_name: form.owner_name || undefined,
          owner_phone: form.owner_phone || undefined,
        }
        const vRes = await api.post('/vehicles', vPayload)
        finalVehicleId = vRes.data.id
        setVehicles([vRes.data, ...vehicles])
      }

      if (!finalVehicleId) {
        alert('请选择或创建车辆')
        setSubmitting(false)
        return
      }

      const payload: any = {
        vehicle_id: finalVehicleId,
        complaint: form.complaint || undefined,
      }
      if (form.station_id) payload.station_id = form.station_id
      if (form.technician_id) payload.technician_id = form.technician_id

      const res = await api.post('/work-orders', payload)
      setShowCreate(false)
      resetForm()
      loadOrders()
      navigate({ to: `/records/$id`, params: { id: String(res.data.id) } })
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建工单失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">维修记录</h1>
          <p className="text-slate-500 mt-1">查看和管理所有维修工单</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          新建工单
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索工单号、故障描述..."
                className="input w-full pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-full md:w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="closed">已关闭</option>
              <option value="reworked">返修</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <p className="p-5 text-slate-500">加载中...</p>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">暂无工单记录</p>
              <p className="text-sm text-slate-400 mt-1">点击右上角「新建工单」开始</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>状态</th>
                  <th>是否返修</th>
                  <th>故障描述</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.order_no}</td>
                    <td>
                      <span className={`badge ${orderStatusMap[order.status]?.color}`}>
                        {orderStatusMap[order.status]?.label}
                      </span>
                    </td>
                    <td>
                      {order.is_rework ? (
                        <span className="badge bg-red-100 text-red-700">是</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600">否</span>
                      )}
                    </td>
                    <td className="text-slate-600 max-w-xs truncate">{order.complaint || '-'}</td>
                    <td>{dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}</td>
                    <td>
                      <button
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                        onClick={() => navigate({ to: `/records/$id`, params: { id: String(order.id) } })}
                      >
                        <Eye size={14} />
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Wrench size={18} className="text-primary-600" />
                新建维修工单
              </h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2">
                    <Car size={16} className="text-primary-600" />
                    车辆信息
                  </h4>
                  <div className="flex bg-slate-100 rounded-md p-0.5">
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs rounded ${vehicleMode === 'select' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                      onClick={() => setVehicleMode('select')}
                    >
                      选择已有
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs rounded ${vehicleMode === 'new' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                      onClick={() => setVehicleMode('new')}
                    >
                      新建车辆
                    </button>
                  </div>
                </div>

                {vehicleMode === 'select' ? (
                  <div>
                    <label className="label">选择车辆 *</label>
                    <select
                      className="input w-full"
                      value={form.vehicle_id}
                      onChange={(e) => setForm({ ...form, vehicle_id: Number(e.target.value) })}
                    >
                      <option value={0}>-- 请选择 --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate_number} - {v.brand} {v.model}
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        暂无车辆档案，请切换到「新建车辆」
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">车牌号 *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="如：京A12345"
                        value={form.plate_number}
                        onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">VIN码</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={form.vin}
                        onChange={(e) => setForm({ ...form, vin: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">品牌 *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="如：丰田"
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">车型 *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="如：凯美瑞"
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">年款</label>
                      <input
                        type="number"
                        className="input w-full"
                        placeholder="如：2023"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">颜色</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">里程数 (km)</label>
                      <input
                        type="number"
                        className="input w-full"
                        value={form.mileage}
                        onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">车主姓名</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={form.owner_name}
                        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">联系电话</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={form.owner_phone}
                        onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1">
                    <Wrench size={14} className="text-slate-500" />
                    分配工位
                  </label>
                  <select
                    className="input w-full"
                    value={form.station_id}
                    onChange={(e) => setForm({ ...form, station_id: Number(e.target.value) })}
                  >
                    <option value={0}>暂不分配</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.status !== 'idle'}>
                        {s.name} ({s.type || '通用'})
                        {s.status === 'idle' ? ' - 空闲' : s.status === 'occupied' ? ' - 使用中' : ' - 维护中'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1">
                    <UserIcon size={14} className="text-slate-500" />
                    负责技师
                  </label>
                  <select
                    className="input w-full"
                    value={form.technician_id}
                    onChange={(e) => setForm({ ...form, technician_id: Number(e.target.value) })}
                  >
                    <option value={0}>暂不分配</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">客户故障描述</label>
                <textarea
                  className="input w-full"
                  rows={4}
                  placeholder="请描述客户反映的故障现象，如：发动机异响、刹车抖动、空调不制冷等..."
                  value={form.complaint}
                  onChange={(e) => setForm({ ...form, complaint: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                <Check size={16} className="text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                  提交后将自动生成工单号，分配工位后工位状态将自动更新。可在详情页继续添加诊断记录和维修项目。
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '创建工单'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_app/records')({
  component: RecordsListPage,
})
