import type { TicketType } from '../types'
import { formatCurrency } from '../lib/utils'

interface TicketTypePanelProps {
  ticketType?: TicketType
}

export default function TicketTypePanel({ ticketType }: TicketTypePanelProps) {
  if (!ticketType) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">票种规则</h3>
        <p className="text-sm text-gray-400">暂无票种信息</p>
      </div>
    )
  }

  const soldPercent = ticketType.quota > 0
    ? ((ticketType.sold_count / ticketType.quota) * 100).toFixed(1)
    : '0'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">票种规则</h3>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs text-gray-500">名称</dt>
          <dd className="text-sm font-medium text-gray-900">{ticketType.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">价格</dt>
          <dd className="text-sm font-medium text-gray-900">{formatCurrency(ticketType.price)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">配额 / 已售</dt>
          <dd className="text-sm font-medium text-gray-900">
            {ticketType.quota} / {ticketType.sold_count}
          </dd>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(Number(soldPercent), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">售出率 {soldPercent}%</p>
        </div>
        <div>
          <dt className="text-xs text-gray-500">状态</dt>
          <dd className="text-sm text-gray-900">{ticketType.status}</dd>
        </div>
      </dl>

      {ticketType.rules && Object.keys(ticketType.rules).length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 mb-2">规则详情</h4>
          <pre className="text-xs text-gray-500 bg-gray-50 rounded-md p-2 overflow-x-auto">
            {JSON.stringify(ticketType.rules, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
