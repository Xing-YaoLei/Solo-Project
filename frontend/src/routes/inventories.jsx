import React, { useEffect, useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Warehouse, AlertTriangle, Search, Plus, Calendar, Edit3
} from 'lucide-react'
import { api } from '../lib/api'
import { SectionTitle, Modal, EmptyState } from '../components/ui'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/inventories')({
  component: InventoriesPage,
})

function InventoriesPage() {
  const [packages, setPackages] = useState([])
  const [pkgId, setPkgId] = useState(null)
  const [invData, setInvData] = useState([])
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 29); return d.toISOString().slice(0, 10)
  })
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(null)
  const [invForm, setInvForm] = useState({ total_quantity: '', sold_quantity: '', reserved_quantity: '', unit_price: '' })

  useEffect(() => {
    (async () => {
      const d = await api.listPackages({ page: 1, page_size: 100 })
      setPackages(d.items)
      if (d.items.length) setPkgId(d.items[0].id)
    })()
  }, [])

  useEffect(() => { if (pkgId) load() }, [pkgId, startDate, endDate])

  async function load() {
    try {
      const d = await api.listInventories({
        package_id: pkgId, start_date: startDate, end_date: endDate
      })
      setInvData(d)
    } catch (e) {
      console.warn(e)
      setInvData([])
    }
  }

  const { stats, oversold } = useMemo(() => {
    let total = 0, sold = 0, reserved = 0, available = 0
    const over = []
    invData.forEach(i => {
      total += i.total_quantity
      sold += i.sold_quantity
      reserved += i.reserved_quantity
      const a = i.total_quantity - i.sold_quantity - i.reserved_quantity
      available += a
      if (a < 0) over.push(i)
    })
    return {
      stats: { total, sold, reserved, available, rate: total > 0 ? Math.round(sold / total * 100) : 0 },
      oversold: over
    }
  }, [invData])

  const heat = (rate) => {
    if (rate >= 100) return 'bg-red-100 text-red-700 border-red-200'
    if (rate >= 80) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (rate >= 50) return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  function openEdit(i) {
    setEditing(i)
    setInvForm({
      total_quantity: i.total_quantity,
      sold_quantity: i.sold_quantity,
      reserved_quantity: i.reserved_quantity,
      unit_price: i.unit_price,
    })
    setShowEdit(true)
  }

  async function saveEdit() {
    try {
      await api.updateInventory(editing.id, {
        total_quantity: Number(invForm.total_quantity),
        sold_quantity: Number(invForm.sold_quantity),
        reserved_quantity: Number(invForm.reserved_quantity),
        unit_price: Number(invForm.unit_price),
      })
      toast.success('已更新')
      setShowEdit(false)
      load()
    } catch (e) { toast.error(e.message) }
  }

  const heatmap = useMemo(() => {
    const arr = []
    for (let i = 0; i < 7; i++) {
      const row = []
      for (let w = 0; w < 5; w++) {
        const idx = w * 7 + i
        if (idx < invData.length) row.push(invData[idx])
        else row.push(null)
      }
      arr.push(row)
    }
    return arr
  }, [invData])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">套餐库存</h1>
          <p className="text-sm text-gray-500 mt-1">
            查看每日库存变化热力图，快速发现超卖预警，并支持单个调整库存/单价
          </p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600">套餐：</label>
        <select className="input max-w-sm" value={pkgId || ''} onChange={e => setPkgId(Number(e.target.value))}>
          <option value="">-- 请选择 --</option>
          {packages.map(p => (
            <option key={p.id} value={p.id}>{p.name}（{p.homestay_name}）</option>
          ))}
        </select>
        <label className="text-sm text-gray-600 ml-2">日期：</label>
        <input type="date" className="input max-w-[160px]" value={startDate}
          onChange={e => setStartDate(e.target.value)} />
        <span className="text-gray-400">至</span>
        <input type="date" className="input max-w-[160px]" value={endDate}
          onChange={e => setEndDate(e.target.value)} />
        <div className="ml-auto text-xs text-gray-500">
          合计 <span className="font-semibold text-gray-800">{invData.length}</span> 天
        </div>
      </div>

      {oversold.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">检测到超卖风险 <span className="text-red-500">({oversold.length} 天)</span></p>
            <div className="flex flex-wrap gap-2 mt-2">
              {oversold.map(i => (
                <button
                  key={i.id}
                  onClick={() => openEdit(i)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white border border-red-200 hover:bg-red-100 text-red-700"
                >
                  {i.inventory_date} 超卖 {i.sold_quantity + i.reserved_quantity - i.total_quantity} 间
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!pkgId ? (
        <EmptyState title="请先选择套餐" icon={Warehouse} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">总库存（间夜）</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">已售</p>
              <p className="text-2xl font-bold text-orange-600">{stats.sold}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">可售</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">整体销售率</p>
              <p className="text-2xl font-bold text-primary-600">{stats.rate}%</p>
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle title="30日库存热力图" desc="色块代表销售率，颜色越深销售压力越大" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="th w-16">周</th>
                    {Array.from({ length: 5 }, (_, w) => {
                      const d = new Date(startDate)
                      d.setDate(d.getDate() + w * 7)
                      return (
                        <th key={w} className="th text-center">{`第${w + 1}周 · ${d.toISOString().slice(5, 10)}起`}</th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((row, wi) => (
                    <tr key={wi}>
                      <td className="td text-gray-500 text-center">{'日一二三四五六'[wi]}</td>
                      {row.map((i, k) => {
                        if (!i) return <td key={k} className="td bg-gray-50/50" />
                        const a = i.total_quantity - i.sold_quantity - i.reserved_quantity
                        const rate = i.total_quantity > 0
                          ? Math.round(i.sold_quantity / i.total_quantity * 100)
                          : 0
                        const oversold = a < 0
                        return (
                          <td key={k} className="td">
                            <button
                              onClick={() => openEdit(i)}
                              className={`w-full p-2 rounded-lg border text-center hover:shadow-md transition-all ${heat(rate)}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{i.inventory_date.slice(5)}</span>
                                {oversold && <span className="text-red-500">⚠</span>}
                              </div>
                              <div className="text-[10px] opacity-80">
                                {a < 0 ? <span className="font-bold text-red-600">超卖 {Math.abs(a)}</span> : `可售 ${a}`}
                              </div>
                              <div className="text-[10px] mt-0.5 font-medium">
                                售 {rate}% · ¥{i.unit_price}
                              </div>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span>销售率:</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />0-50%</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />50-80%</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />80-100%</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" />超卖</span>
            </div>
          </div>
        </>
      )}

      <Modal
        open={showEdit}
        title={`编辑库存 - ${editing?.inventory_date || ''}`}
        size="md"
        onClose={() => setShowEdit(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowEdit(false)}>取消</button>
            <button className="btn-primary" onClick={saveEdit}>保存</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">总库存</label>
            <input type="number" className="input" value={invForm.total_quantity}
              onChange={e => setInvForm({ ...invForm, total_quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">已售数量</label>
            <input type="number" className="input" value={invForm.sold_quantity}
              onChange={e => setInvForm({ ...invForm, sold_quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">预留数量</label>
            <input type="number" className="input" value={invForm.reserved_quantity}
              onChange={e => setInvForm({ ...invForm, reserved_quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">当日单价(元)</label>
            <input type="number" className="input" value={invForm.unit_price}
              onChange={e => setInvForm({ ...invForm, unit_price: e.target.value })} />
          </div>
        </div>
        {Number(invForm.total_quantity) < Number(invForm.sold_quantity) + Number(invForm.reserved_quantity) && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
            ⚠️ 当前配置将出现超卖，系统会记录一条异常单，建议及时处理。
          </div>
        )}
      </Modal>
    </div>
  )
}
