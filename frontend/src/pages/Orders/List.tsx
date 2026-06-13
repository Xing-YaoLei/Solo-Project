import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ordersApi, basicApi } from '@/api'
import { StatusBadge } from '@/components/Badges'
import { Modal } from '@/components/Modal'
import { formatDate } from '@/utils'
import type { ReplenishmentOrderListItem, ReplenishmentStatus, Store } from '@/types'
import { STATUS_LABEL, RoleEnum } from '@/types'
import { useAuthStore } from '@/store/auth'

export function OrdersListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canCreate = user?.role && [RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN].includes(user.role)

  const [items, setItems] = useState<ReplenishmentOrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<ReplenishmentStatus | ''>('')
  const [storeId, setStoreId] = useState<number | ''>('')
  const [keyword, setKeyword] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchTarget, setBatchTarget] = useState<ReplenishmentStatus>('' as ReplenishmentStatus)
  const [batchRemark, setBatchRemark] = useState('')
  const [batchResult, setBatchResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    basicApi.listStores().then(setStores).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [page, pageSize, status, storeId, keyword])

  async function load() {
    setLoading(true)
    try {
      const res = await ordersApi.list({
        page, page_size: pageSize,
        status: status || undefined,
        store_id: storeId || undefined,
        keyword: keyword || undefined,
      })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === items.length && items.length > 0) setSelected(new Set())
    else setSelected(new Set(items.map((i) => i.id)))
  }

  async function handleBatch() {
    if (!batchTarget || selected.size === 0) return
    const res = await ordersApi.batchOperation([...selected], batchTarget, batchRemark || undefined)
    setBatchResult(res)
    setSelected(new Set())
    load()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="select w-auto"
            value={status}
            onChange={(e) => { setStatus(e.target.value as ReplenishmentStatus | ''); setPage(1) }}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="select w-auto"
            value={storeId}
            onChange={(e) => { setStoreId(e.target.value ? Number(e.target.value) : ''); setPage(1) }}
          >
            <option value="">全部门店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
          <input
            className="input w-56"
            placeholder="搜索单号/门店/车牌/装车单"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />
          <button className="btn-secondary" onClick={load}>刷新</button>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button className="btn-secondary" onClick={() => setShowBatchModal(true)}>
              批量操作（{selected.size}）
            </button>
          )}
          {canCreate && (
            <button className="btn-primary" onClick={() => navigate({ to: '/orders/create' })}>
              + 新建补货单
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-th w-10">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selected.size === items.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="table-th">单号</th>
                <th className="table-th">门店</th>
                <th className="table-th">计划日期</th>
                <th className="table-th">车牌</th>
                <th className="table-th">司机</th>
                <th className="table-th">装车单</th>
                <th className="table-th">状态</th>
                <th className="table-th">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr><td colSpan={9} className="table-td text-center text-slate-400 py-8">加载中...</td></tr>
              )}
              {!loading && items.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                    />
                  </td>
                  <td className="table-td">
                    <Link to="/orders/$orderId" params={{ orderId: String(o.id) }} className="link font-medium">
                      {o.order_no}
                    </Link>
                  </td>
                  <td className="table-td">{o.store_name}</td>
                  <td className="table-td">{formatDate(o.planned_date)}</td>
                  <td className="table-td">{o.truck_no || '-'}</td>
                  <td className="table-td">{o.driver_name || '-'}</td>
                  <td className="table-td">{o.loading_list_no || '-'}</td>
                  <td className="table-td">
                    <StatusBadge status={o.status} />
                    {o.has_alerts && <span className="ml-1 text-red-500" title="存在温度异常">🌡️</span>}
                    {o.has_discrepancies && <span className="ml-1 text-orange-500" title="存在未解决差异">⚠️</span>}
                  </td>
                  <td className="table-td">
                    <Link to="/orders/$orderId" params={{ orderId: String(o.id) }} className="link text-sm">
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={9} className="table-td text-center text-slate-400 py-8">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">共 {total} 条</div>
          <div className="flex items-center gap-2">
            <select className="select w-auto" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} 条/页</option>)}
            </select>
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
            <span className="text-sm text-slate-600 px-2">{page} / {totalPages || 1}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
        </div>
      </div>

      <Modal
        open={showBatchModal}
        onClose={() => { setShowBatchModal(false); setBatchResult(null); setBatchTarget('' as ReplenishmentStatus); setBatchRemark('') }}
        title={`批量状态变更（已选 ${selected.size} 条）`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowBatchModal(false)}>取消</button>
            <button className="btn-primary" disabled={!batchTarget} onClick={handleBatch}>确认</button>
          </>
        }
      >
        {batchResult ? (
          <div className="space-y-2">
            <div className="text-sm">成功：{batchResult.success_count}，失败：{batchResult.failed_count}</div>
            {batchResult.failed?.length > 0 && (
              <div className="text-xs text-red-600">
                {batchResult.failed.map((f: any) => <div key={f.id}>ID {f.id}: {f.reason}</div>)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">目标状态</label>
              <select className="select" value={batchTarget} onChange={(e) => setBatchTarget(e.target.value as ReplenishmentStatus)}>
                <option value="">请选择</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
              <textarea className="input" rows={3} value={batchRemark} onChange={(e) => setBatchRemark(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
