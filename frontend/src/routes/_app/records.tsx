import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Eye, Search } from 'lucide-react'
import api from '@/lib/api'
import type { WorkOrder } from '@/types'
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

  useEffect(() => {
    loadOrders()
  }, [statusFilter, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">维修记录</h1>
          <p className="text-slate-500 mt-1">查看和管理所有维修工单</p>
        </div>
        <button className="btn btn-primary" onClick={() => {}}>
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
            <p className="p-5 text-center text-slate-500">暂无工单记录</p>
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
    </div>
  )
}

export const Route = createFileRoute('/_app/records')({
  component: RecordsListPage,
})
