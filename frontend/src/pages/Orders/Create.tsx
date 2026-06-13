import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { basicApi, ordersApi } from '@/api'
import type { Store, Product } from '@/types'
import dayjs from 'dayjs'

interface ItemRow {
  product_id: number
  planned_qty: number
}

export function OrderCreatePage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productKeyword, setProductKeyword] = useState('')
  const [storeId, setStoreId] = useState<number | ''>('')
  const [plannedDate, setPlannedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [truckNo, setTruckNo] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [loadingListNo, setLoadingListNo] = useState('')
  const [remark, setRemark] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ product_id: 0, planned_qty: 0 }])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    basicApi.listStores().then(setStores).catch(() => {})
    basicApi.listProducts(true, productKeyword).then(setProducts).catch(() => {})
  }, [productKeyword])

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems([...items, { product_id: 0, planned_qty: 0 }])
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!storeId) { alert('请选择门店'); return }
    const validItems = items.filter((i) => i.product_id > 0 && i.planned_qty > 0)
    if (validItems.length === 0) { alert('请至少添加一条商品明细'); return }
    setSubmitting(true)
    try {
      const order = await ordersApi.create({
        store_id: Number(storeId),
        planned_date: plannedDate,
        truck_no: truckNo || undefined,
        driver_name: driverName || undefined,
        driver_phone: driverPhone || undefined,
        loading_list_no: loadingListNo || undefined,
        remark: remark || undefined,
        items: validItems,
      })
      navigate({ to: '/orders/$orderId', params: { orderId: String(order.id) } })
    } catch (err: any) {
      alert(err?.response?.data?.detail || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">新建补货单</h2>
        <button className="btn-secondary" onClick={() => navigate({ to: '/orders' })}>返回列表</button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">门店 <span className="text-red-500">*</span></label>
            <select className="select" value={storeId} onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">请选择门店</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">计划日期 <span className="text-red-500">*</span></label>
            <input type="date" className="input" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">车牌号</label>
            <input className="input" value={truckNo} onChange={(e) => setTruckNo(e.target.value)} placeholder="如：京A12345" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">装车单号</label>
            <input className="input" value={loadingListNo} onChange={(e) => setLoadingListNo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">司机姓名</label>
            <input className="input" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">司机电话</label>
            <input className="input" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea className="input" rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">商品明细</label>
            <button type="button" className="btn-secondary text-sm" onClick={addItem}>+ 添加商品</button>
          </div>
          <input
            className="input mb-2"
            placeholder="搜索商品..."
            value={productKeyword}
            onChange={(e) => setProductKeyword(e.target.value)}
          />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-th">商品</th>
                  <th className="table-th">温区</th>
                  <th className="table-th">单位</th>
                  <th className="table-th">数量</th>
                  <th className="table-th w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => {
                  const p = products.find((x) => x.id === it.product_id)
                  return (
                    <tr key={idx}>
                      <td className="table-td">
                        <select
                          className="select min-w-[260px]"
                          value={it.product_id}
                          onChange={(e) => updateItem(idx, { product_id: Number(e.target.value) })}
                        >
                          <option value={0}>请选择商品</option>
                          {products.map((pp) => (
                            <option key={pp.id} value={pp.id}>{pp.sku} - {pp.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td text-slate-500">{p ? `${p.min_temp}~${p.max_temp}°C` : '-'}</td>
                      <td className="table-td text-slate-500">{p?.unit || '-'}</td>
                      <td className="table-td">
                        <input
                          type="number"
                          className="input w-24"
                          min="0"
                          step="0.01"
                          value={it.planned_qty || ''}
                          onChange={(e) => updateItem(idx, { planned_qty: Number(e.target.value) })}
                        />
                      </td>
                      <td className="table-td">
                        <button type="button" className="text-red-500 hover:text-red-700" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                          删除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button type="button" className="btn-secondary" onClick={() => navigate({ to: '/orders' })}>取消</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  )
}
