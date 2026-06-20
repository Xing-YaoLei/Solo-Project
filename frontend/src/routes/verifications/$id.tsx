import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Route as rootRoute } from '../__root'
import { getVerification, transitionVerification } from '../../api/verifications'
import { getSeatingChart } from '../../api/seats'
import TicketTypePanel from '../../components/TicketTypePanel'
import OrderPanel from '../../components/OrderPanel'
import SeatingChart from '../../components/SeatingChart'
import StatusFlow from '../../components/StatusFlow'
import StatusBadge from '../../components/StatusBadge'
import type { VerificationTransition, TransitionRequest } from '../../types'
import { STATUS_LABELS } from '../../types'
import { formatDate } from '../../lib/utils'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verifications/$id',
  component: VerificationDetailPage,
})

function VerificationDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['verification', id],
    queryFn: () => getVerification(id),
  })

  const { data: seatingChart } = useQuery({
    queryKey: ['seating-chart', ticket?.event_id],
    queryFn: () => getSeatingChart(ticket!.event_id),
    enabled: !!ticket?.event_id,
  })

  const handleTransition = async (transition: VerificationTransition, note: string) => {
    const payload: TransitionRequest = {
      to_status: transition.to_status,
      operator: 'current_user',
      note: note || undefined,
    }
    if (transition.to_status === 'disputed') {
      payload.dispute_reason = note || undefined
    }
    if (transition.to_status === 'escalated') {
      payload.escalation_target = note || undefined
    }
    if (transition.to_status === 'supplementing') {
      payload.supplement_note = note || undefined
    }
    try {
      await transitionVerification(id, payload)
      queryClient.invalidateQueries({ queryKey: ['verification', id] })
      queryClient.invalidateQueries({ queryKey: ['verifications'] })
    } catch (err) {
      console.error('Transition failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">未找到核销单据</p>
        <button
          onClick={() => navigate({ to: '/verifications' })}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: '/verifications' })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          核销单据 {ticket.ticket_no}
        </h2>
        <StatusBadge status={ticket.status} />
        {ticket.assignee && (
          <span className="text-sm text-gray-500">负责人: {ticket.assignee}</span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-4">
          <TicketTypePanel ticketType={ticket.ticket_type} />
          <OrderPanel order={ticket.order} />
          {ticket.dispute_reason && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-2">争议原因</h3>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{ticket.dispute_reason}</p>
            </div>
          )}
          {ticket.supplement_note && (
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">补充材料</h3>
              <p className="text-sm text-amber-700 whitespace-pre-wrap">{ticket.supplement_note}</p>
            </div>
          )}
          {ticket.escalation_target && (
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-2">升级目标</h3>
              <p className="text-sm text-purple-700">{ticket.escalation_target}</p>
            </div>
          )}
          {ticket.conclusion && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">处理结论</h3>
              <p className="text-sm text-green-700">{ticket.conclusion}</p>
            </div>
          )}
        </div>

        <div className="col-span-6">
          <SeatingChart
            chart={seatingChart}
            currentSeatId={ticket.seat_id || undefined}
          />
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">来源线索</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">来源：</span>
                <span className="text-gray-900">{ticket.source || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">来源编号：</span>
                <span className="text-gray-900 font-mono">{ticket.source_reference || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">核销码：</span>
                <span className="text-gray-900 font-mono">{ticket.verification_code || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="text-gray-900">{formatDate(ticket.created_at)}</span>
              </div>
              {ticket.verified_at && (
                <div>
                  <span className="text-gray-500">核销时间：</span>
                  <span className="text-gray-900">{formatDate(ticket.verified_at)}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div>
                  <span className="text-gray-500">关闭时间：</span>
                  <span className="text-gray-900">{formatDate(ticket.closed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <StatusFlow
            currentStatus={ticket.status}
            actions={ticket.actions || []}
            onTransition={handleTransition}
          />
        </div>
      </div>
    </div>
  )
}
