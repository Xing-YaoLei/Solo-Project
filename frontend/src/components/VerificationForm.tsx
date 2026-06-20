import { useState } from 'react'
import type { Event, SourceType, CreateVerificationRequest } from '../types'
import { SOURCE_LABELS } from '../types'
import { getTicketTypes } from '../api/ticket-types'
import { getOrders } from '../api/orders'

interface VerificationFormProps {
  events: Event[]
  onSubmit: (data: CreateVerificationRequest) => void
  loading?: boolean
}

export default function VerificationForm({
  events,
  onSubmit,
  loading,
}: VerificationFormProps) {
  const [ticketNo, setTicketNo] = useState('')
  const [eventId, setEventId] = useState('')
  const [ticketTypeId, setTicketTypeId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [assignee, setAssignee] = useState('')
  const [source, setSource] = useState<SourceType>('online')
  const [sourceReference, setSourceReference] = useState('')

  const [ticketTypes, setTicketTypes] = useState<{ id: string; name: string }[]>([])
  const [orders, setOrders] = useState<{ id: string; order_no: string; buyer_name: string }[]>([])

  const handleEventChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setEventId(id)
    setTicketTypeId('')
    setOrderId('')
    if (id) {
      try {
        const [tt, ord] = await Promise.all([
          getTicketTypes(id),
          getOrders(id),
        ])
        setTicketTypes(tt)
        setOrders(ord)
      } catch {
        setTicketTypes([])
        setOrders([])
      }
    } else {
      setTicketTypes([])
      setOrders([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ticket_no: ticketNo,
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      order_id: orderId,
      verification_code: verificationCode || undefined,
      assignee: assignee || undefined,
      source: source || undefined,
      source_reference: sourceReference || undefined,
    })
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div>
        <label className={labelClass}>核销单号 *</label>
        <input
          type="text"
          value={ticketNo}
          onChange={(e) => setTicketNo(e.target.value)}
          required
          placeholder="自动生成或手动输入"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>活动 *</label>
        <select
          value={eventId}
          onChange={handleEventChange}
          required
          className={inputClass}
        >
          <option value="">请选择活动</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>票种 *</label>
          <select
            value={ticketTypeId}
            onChange={(e) => setTicketTypeId(e.target.value)}
            required
            disabled={!eventId}
            className={inputClass}
          >
            <option value="">请选择票种</option>
            {ticketTypes.map((tt) => (
              <option key={tt.id} value={tt.id}>
                {tt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>订单 *</label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            disabled={!eventId}
            className={inputClass}
          >
            <option value="">请选择订单</option>
            {orders.map((ord) => (
              <option key={ord.id} value={ord.id}>
                {ord.order_no} - {ord.buyer_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>核销码</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="请输入核销码"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>负责人</label>
          <input
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="请输入负责人"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>来源</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as SourceType)}
            className={inputClass}
          >
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>来源线索</label>
          <input
            type="text"
            value={sourceReference}
            onChange={(e) => setSourceReference(e.target.value)}
            placeholder="来源线索编号"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '提交中...' : '创建核销单'}
        </button>
      </div>
    </form>
  )
}
