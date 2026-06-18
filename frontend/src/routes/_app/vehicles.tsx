import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Search, Edit3, Trash2, Car } from 'lucide-react'
import api from '@/lib/api'
import type { Vehicle } from '@/types'
import dayjs from 'dayjs'

function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState({
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

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res = await api.get('/vehicles', { params: { q: search || undefined } })
      setVehicles(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [search])

  const openAdd = () => {
    setEditing(null)
    setForm({
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
    setShowModal(true)
  }

  const openEdit = (v: Vehicle) => {
    setEditing(v)
    setForm({
      plate_number: v.plate_number,
      vin: v.vin || '',
      brand: v.brand,
      model: v.model,
      year: v.year?.toString() || '',
      color: v.color || '',
      mileage: v.mileage?.toString() || '',
      owner_name: v.owner_name || '',
      owner_phone: v.owner_phone || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
        mileage: form.mileage ? Number(form.mileage) : null,
      }
      if (editing) {
        await api.put(`/vehicles/${editing.id}`, payload)
      } else {
        await api.post('/vehicles', payload)
      }
      setShowModal(false)
      loadVehicles()
    } catch (err: any) {
      alert(err.response?.data?.detail || '保存失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该车辆档案吗？')) return
    try {
      await api.delete(`/vehicles/${id}`)
      loadVehicles()
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">车辆档案</h1>
          <p className="text-slate-500 mt-1">管理所有维修车辆的档案信息</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          新增车辆
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索车牌号、VIN、品牌..."
              className="input w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <p className="p-5 text-slate-500">加载中...</p>
          ) : vehicles.length === 0 ? (
            <p className="p-5 text-center text-slate-500">暂无车辆档案</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>车牌号</th>
                  <th>VIN</th>
                  <th>品牌车型</th>
                  <th>年款/颜色</th>
                  <th>里程</th>
                  <th>车主/电话</th>
                  <th>建档时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="font-bold text-slate-900">{v.plate_number}</td>
                    <td className="text-slate-600 text-xs">{v.vin || '-'}</td>
                    <td>
                      {v.brand} {v.model}
                    </td>
                    <td>
                      {v.year || '-'} / {v.color || '-'}
                    </td>
                    <td>{v.mileage ? `${v.mileage} km` : '-'}</td>
                    <td>
                      <p className="text-sm">{v.owner_name || '-'}</p>
                      <p className="text-xs text-slate-500">{v.owner_phone || ''}</p>
                    </td>
                    <td className="text-sm text-slate-500">{dayjs(v.created_at).format('YYYY-MM-DD')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-primary-600 hover:text-primary-700"
                          onClick={() => openEdit(v)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{editing ? '编辑车辆' : '新增车辆'}</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">车牌号 *</label>
                  <input
                    type="text"
                    className="input w-full"
                    required
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
                    required
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">车型 *</label>
                  <input
                    type="text"
                    className="input w-full"
                    required
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">年款</label>
                  <input
                    type="number"
                    className="input w-full"
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_app/vehicles')({
  component: VehiclesPage,
})
