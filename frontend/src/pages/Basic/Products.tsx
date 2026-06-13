import { useEffect, useState } from 'react'
import { basicApi } from '@/api'
import { Modal } from '@/components/Modal'
import type { Product } from '@/types'
import { useAuthStore } from '@/store/auth'
import { RoleEnum } from '@/types'

export function ProductsPage() {
  const { user } = useAuthStore()
  const canCreate = user?.role && [RoleEnum.ADMIN, RoleEnum.PURCHASER].includes(user.role)
  const [list, setList] = useState<Product[]>([])
  const [keyword, setKeyword] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('箱')
  const [minTemp, setMinTemp] = useState<number | ''>(0)
  const [maxTemp, setMaxTemp] = useState<number | ''>(8)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [keyword])

  async function load() {
    const data = await basicApi.listProducts(false, keyword || undefined)
    setList(data)
  }

  async function handleSubmit() {
    setError('')
    if (!sku || !name) { setError('请填写 SKU 和商品名称'); return }
    if (minTemp === '' || maxTemp === '' || Number(minTemp) > Number(maxTemp)) {
      setError('请填写正确的温度范围'); return
    }
    try {
      await basicApi.createProduct({
        sku, name, category: category || undefined, unit,
        min_temp: Number(minTemp), max_temp: Number(maxTemp),
      })
      setShowModal(false)
      resetForm()
      load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || '创建失败')
    }
  }

  function resetForm() {
    setSku(''); setName(''); setCategory(''); setUnit('箱'); setMinTemp(0); setMaxTemp(8); setError('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800">商品管理</h2>
        <div className="flex items-center gap-2">
          <input
            className="input w-56"
            placeholder="搜索 SKU 或名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {canCreate && <button className="btn-primary" onClick={() => setShowModal(true)}>+ 新增商品</button>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th">SKU</th>
                <th className="table-th">名称</th>
                <th className="table-th">分类</th>
                <th className="table-th">单位</th>
                <th className="table-th">温度范围</th>
                <th className="table-th">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="table-td font-mono font-medium">{p.sku}</td>
                  <td className="table-td">{p.name}</td>
                  <td className="table-td text-slate-500">{p.category || '-'}</td>
                  <td className="table-td">{p.unit}</td>
                  <td className="table-td"><span className="badge bg-cyan-100 text-cyan-800">{p.min_temp}~{p.max_temp}°C</span></td>
                  <td className="table-td">
                    {p.is_active
                      ? <span className="badge bg-green-100 text-green-800">启用</span>
                      : <span className="badge bg-gray-100 text-gray-600">停用</span>}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="table-td text-center text-slate-400 py-8">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title="新增商品"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>提交</button>
        </>}
      >
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU <span className="text-red-500">*</span></label>
            <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="如 SKU001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">商品名称 <span className="text-red-500">*</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">未分类</option>
                <option value="水产">水产</option>
                <option value="肉类">肉类</option>
                <option value="蔬菜">蔬菜</option>
                <option value="水果">水果</option>
                <option value="乳制品">乳制品</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
              <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最低温度 (°C)</label>
              <input type="number" step="0.1" className="input" value={minTemp} onChange={(e) => setMinTemp(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最高温度 (°C)</label>
              <input type="number" step="0.1" className="input" value={maxTemp} onChange={(e) => setMaxTemp(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
