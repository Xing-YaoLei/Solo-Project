import { useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Route as rootRoute } from '../__root'
import { getVerifications } from '../../api/verifications'
import { getEvents } from '../../api/events'
import StatusBadge from '../../components/StatusBadge'
import type { VerificationTicket, VerificationStatus, SourceType } from '../../types'
import { STATUS_LABELS, SOURCE_LABELS } from '../../types'
import { formatDate } from '../../lib/utils'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verifications',
  component: VerificationsListPage,
})

function VerificationsListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceType | ''>('')
  const [eventFilter, setEventFilter] = useState('')

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  })

  const { data, isLoading } = useQuery({
    queryKey: [
      'verifications',
      statusFilter,
      assigneeFilter,
      sourceFilter,
      eventFilter,
    ],
    queryFn: () =>
      getVerifications({
        status: statusFilter || undefined,
        assignee: assigneeFilter || undefined,
        source: sourceFilter || undefined,
        event_id: eventFilter || undefined,
      }),
  })

  const tickets: VerificationTicket[] = Array.isArray(data) ? data : []

  const selectClass =
    'rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">核销单据列表</h2>
        <button
          onClick={() => navigate({ to: '/verifications/new' })}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          + 新建核销单
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">状态</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | '')}
              className={selectClass}
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">负责人</label>
            <input
              type="text"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              placeholder="搜索负责人"
              className={`${selectClass} w-36`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">来源</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceType | '')}
              className={selectClass}
            >
              <option value="">全部来源</option>
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">活动</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">全部活动</option>
              {events?.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="ml-2 text-sm text-gray-500">加载中...</span>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">活动</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">票种</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">负责人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.length > 0 ? (
                tickets.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate({ to: '/verifications/$id', params: { id: item.id } })}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">
                      {item.ticket_no}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.event?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.ticket_type?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.assignee || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.source ? (SOURCE_LABELS[item.source] || item.source) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({ to: '/verifications/$id', params: { id: item.id } })
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    暂无核销单据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
