import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Search, Package, AlertTriangle, Edit3, History, ArrowRight, X } from 'lucide-react'
import api from '@/lib/api'
import type { Part, StockChangeLog } from '@/types'
import dayjs from 'dayjs'

function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [logs, setLogs] = useState<StockChangeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)

  const [newPart, setNewPart] = useState({
    sku: '',
    name: '',
    brand: '',
    specification: '',
    unit: '个',
    safety_stock: 0,
  })
  const [adjustForm, setAdjustForm] = useState({
    quantity: 0,
    change_reason: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/parts', {
        params: { q: search || undefined, low_stock_only: lowStockOnly || undefined },
      })
      setParts(res.data)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (partId?: number) => {
    const res = await api.get('/stock-logs', { params: { part_id: partId || undefined, limit: 100 } })
    setLogs(res.data)
  }

  useEffect(() => {
    loadData()
  }, [search, lowStockOnly])

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/parts', newPart)
      setShowAdd(false)
      setNewPart({ sku: '', name: '', brand: '', specification: '', unit: '个', safety_stock: 0 })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建失败')
    }
  }

  const openAdjust = (part: Part) => {
    setSelectedPart(part)
    setAdjustForm({ quantity: part.stock?.quantity || 0, change_reason: '' })
    setShowAdjust(true)
  }

  const handleAdjust = async () => {
    if (!selectedPart) return
    try {
      await api.post(`/parts/${selectedPart.id}/adjust-stock`, adjustForm)
      setShowAdjust(false)
      setSelectedPart(null)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || '调整失败')
    }
  }

  const viewLogs = (part?: Part) => {
    setSelectedPart(part || null)
    loadLogs(part?.id)
    setShowLogs(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">配件库存</h1>
          <p className="text-slate-500 mt-1">管理配件库存，所有变动自动记录前后值</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={() => viewLogs()}>
            <History size={16} />
            变更记录
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            新增配件
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索SKU、名称、品牌..."
              className="input w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">仅看低于安全库存</span>
          </label>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <p className="p-5 text-slate-500">加载中...</p>
          ) : parts.length === 0 ? (
            <p className="p-5 text-center text-slate-500">暂无配件数据</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>配件名称</th>
                  <th>品牌/规格</th>
                  <th>单位</th>
                  <th>当前库存</th>
                  <th>安全库存</th>
                  <th>库位</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => {
                  const qty = p.stock?.quantity || 0
                  const low = qty <= p.safety_stock
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td className="font-medium">{p.name}</td>
                      <td className="text-slate-600 text-sm">
                        {p.brand || '-'} / {p.specification || '-'}
                      </td>
                      <td>{p.unit}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${low ? 'text-red-600' : 'text-slate-900'}`}>
                            {qty}
                          </span>
                          {low && (
                            <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              低库存
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-slate-600">{p.safety_stock}</td>
                      <td className="text-slate-600 text-sm">{p.stock?.location || '-'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-primary-600 hover:text-primary-700"
                            onClick={() => openAdjust(p)}
                            title="调整库存"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="text-slate-600 hover:text-slate-900"
                            onClick={() => viewLogs(p)}
                            title="查看变更记录"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">新增配件</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowAdd(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddPart} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">SKU *</label>
                  <input
                    type="text"
                    className="input w-full"
                    required
                    value={newPart.sku}
                    onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">单位</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newPart.unit}
                    onChange={(e) => setNewPart({ ...newPart, unit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">配件名称 *</label>
                <input
                  type="text"
                  className="input w-full"
                  required
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">品牌</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newPart.brand}
                    onChange={(e) => setNewPart({ ...newPart, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">安全库存</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newPart.safety_stock}
                    onChange={(e) => setNewPart({ ...newPart, safety_stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="label">规格</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newPart.specification}
                  onChange={(e) => setNewPart({ ...newPart, specification: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjust && selectedPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">调整库存 - {selectedPart.name}</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowAdjust(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">当前库存</span>
                  <span className="font-bold text-slate-900">{selectedPart.stock?.quantity || 0} {selectedPart.unit}</span>
                </div>
                <div className="flex items-center justify-center my-3">
                  <ArrowRight size={20} className="text-slate-400" />
                </div>
                <div>
                  <label className="label">调整后数量</label>
                  <input
                    type="number"
                    className="input w-full text-lg font-bold"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-slate-500">变动量：</span>
                  <span className={`font-bold ${adjustForm.quantity - (selectedPart.stock?.quantity || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adjustForm.quantity - (selectedPart.stock?.quantity || 0) >= 0 ? '+' : ''}
                    {adjustForm.quantity - (selectedPart.stock?.quantity || 0)} {selectedPart.unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="label">变动原因</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="例如：采购入库、工单领料、盘点调整..."
                  value={adjustForm.change_reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, change_reason: e.target.value })}
                />
              </div>
              <p className="text-xs text-slate-500">
                <History size={12} className="inline mr-1" />
                系统将自动记录调整前后值和操作人
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjust(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleAdjust}>
                  确认调整
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">库存变更记录</h3>
                {selectedPart && (
                  <p className="text-sm text-slate-500 mt-0.5">{selectedPart.name} ({selectedPart.sku})</p>
                )}
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowLogs(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {logs.length === 0 ? (
                <p className="p-8 text-center text-slate-500">暂无变更记录</p>
              ) : (
                <table className="table">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th>时间</th>
                      <th>配件</th>
                      <th>变更前</th>
                      <th>变更后</th>
                      <th>变动量</th>
                      <th>原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const diff = log.after_quantity - log.before_quantity
                      return (
                        <tr key={log.id}>
                          <td className="text-sm text-slate-600">{dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}</td>
                          <td className="text-sm">{log.part?.name || `#${log.part_id}`}</td>
                          <td className="font-mono">{log.before_quantity}</td>
                          <td className="font-mono font-bold">{log.after_quantity}</td>
                          <td>
                            <span className={`font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {diff >= 0 ? '+' : ''}{diff}
                            </span>
                          </td>
                          <td className="text-sm text-slate-600">{log.change_reason || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_app/inventory')({
  component: InventoryPage,
})
