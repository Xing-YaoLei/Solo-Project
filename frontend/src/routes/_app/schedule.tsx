import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Eye, Clock, Wrench, Ban, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import type { Station, WorkOrder } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<string, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'bg-green-100 text-green-700' },
  occupied: { label: '使用中', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-700' },
}

const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-slate-100 text-slate-600' },
  reworked: { label: '返修', color: 'bg-red-100 text-red-700' },
}

function SchedulePage() {
  const [stations, setStations] = useState<Station[]>([])
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      const [stationsRes, ordersRes] = await Promise.all([
        api.get('/stations'),
        api.get('/work-orders', { params: { status: 'pending' } }),
      ])
      setStations(stationsRes.data)
      setOrders(ordersRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <p className="text-slate-500">加载中...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工位排班</h1>
          <p className="text-slate-500 mt-1">查看所有工位状态和待分配工单</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate({ to: '/records' })}>
          <Plus size={16} />
          新建工单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stations.map((station) => {
          const status = statusMap[station.status] || statusMap.idle
          return (
            <div key={station.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="font-semibold text-slate-900">{station.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{station.type || '通用工位'}</p>
                </div>
                <span className={`badge ${status.color}`}>{status.label}</span>
              </div>
              <div className="card-body">
                {station.current_work_order ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{station.current_work_order.order_no}</p>
                        <p className="text-sm text-slate-500">{station.current_work_order.complaint || '无故障描述'}</p>
                      </div>
                      <span className={`badge ${orderStatusMap[station.current_work_order.status]?.color}`}>
                        {orderStatusMap[station.current_work_order.status]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} />
                      开始: {dayjs(station.current_work_order.actual_start || station.current_work_order.created_at).format('MM-DD HH:mm')}
                    </div>
                    <button
                      className="btn btn-secondary w-full justify-center"
                      onClick={() => navigate({ to: `/records/$id`, params: { id: String(station.current_work_order!.id) } })}
                    >
                      <Eye size={14} />
                      查看详情
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <Ban size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">当前无工单</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">待分配工单</h2>
          <span className="text-sm text-slate-500">共 {orders.length} 条</span>
        </div>
        <div className="card-body">
          {orders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">暂无待分配工单</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>车辆ID</th>
                  <th>故障描述</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.order_no}</td>
                    <td>#{order.vehicle_id}</td>
                    <td className="text-slate-600">{order.complaint || '-'}</td>
                    <td>{dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}</td>
                    <td>
                      <button
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                        onClick={() => navigate({ to: `/records/$id`, params: { id: String(order.id) } })}
                      >
                        处理 <ChevronRight size={14} />
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

export const Route = createFileRoute('/_app/schedule')({
  component: SchedulePage,
})
