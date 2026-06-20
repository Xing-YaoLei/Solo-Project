import type { Order } from '../types'
import { formatCurrency, formatDate } from '../lib/utils'
import { SOURCE_LABELS, STATUS_LABEL_MAP } from '../types'

interface OrderPanelProps {
  order?: Order
}

export default function OrderPanel({ order }: OrderPanelProps) {
  if (!order) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">购票订单</h3>
        <p className="text-sm text-gray-400">暂无订单信息</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">购票订单</h3>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs text-gray-500">订单号</dt>
          <dd className="text-sm font-medium text-gray-900 font-mono">
            {order.order_no}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">买家</dt>
          <dd className="text-sm text-gray-900">{order.buyer_name}</dd>
          <dd className="text-xs text-gray-400 mt-0.5">{order.buyer_phone}</dd>
          {order.buyer_email && (
            <dd className="text-xs text-gray-400">{order.buyer_email}</dd>
          )}
        </div>
        <div>
          <dt className="text-xs text-gray-500">数量 / 金额</dt>
          <dd className="text-sm text-gray-900">
            {order.quantity} 张 · {formatCurrency(order.total_amount)}
          </dd>
        </div>
        {order.source && (
          <div>
            <dt className="text-xs text-gray-500">来源</dt>
            <dd className="text-sm text-gray-900">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {SOURCE_LABELS[order.source] || order.source}
              </span>
            </dd>
          </div>
        )}
        {order.source_reference && (
          <div>
            <dt className="text-xs text-gray-500">来源线索</dt>
            <dd className="text-sm text-gray-900 font-mono">{order.source_reference}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-gray-500">状态</dt>
          <dd className="text-sm text-gray-900">
            {STATUS_LABEL_MAP[order.status] || order.status}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">创建时间</dt>
          <dd className="text-sm text-gray-500">{formatDate(order.created_at)}</dd>
        </div>
      </dl>
    </div>
  )
}
