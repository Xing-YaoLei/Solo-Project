import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Filter, Clock, User } from 'lucide-react'
import { useTodoTickets } from '@/api/hooks'
import Empty from '@/components/Empty'
import type { TodoTicket, TodoStatus, TodoSourceType, TodoPriority } from '@/types'

const PRIORITY_COLORS: Record<TodoPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-green-400',
}

const SOURCE_LABELS: Record<TodoSourceType, string> = {
  damage_report: '物品损坏',
  damage: '物品损坏',
  appeal: '申诉',
  compensation: '赔付',
  settlement_dispute: '结算争议',
  other: '其他',
}

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部来源' },
  { value: 'damage_report', label: '物品损坏' },
  { value: 'appeal', label: '申诉' },
  { value: 'compensation', label: '赔付' },
  { value: 'settlement_dispute', label: '结算争议' },
  { value: 'other', label: '其他' },
]

interface ColumnConfig {
  key: string
  label: string
  statuses: TodoStatus[]
  color: string
}

const COLUMNS: ColumnConfig[] = [
  { key: 'pending', label: '待认领', statuses: ['pending', 'transferred'], color: 'border-amber-400' },
  { key: 'in_progress', label: '处理中', statuses: ['claimed', 'in_progress', 'supplement_requested', 'supplement_needed'], color: 'border-blue-400' },
  { key: 'done', label: '已完成', statuses: ['resolved', 'rejected', 'closed'], color: 'border-emerald-400' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function TicketCard({ ticket }: { ticket: TodoTicket }) {
  return (
    <Link
      to="/todo-pool/$ticketId"
      params={{ ticketId: ticket.id }}
      className="block overflow-hidden rounded-lg border border-surface-border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div className={`h-1.5 ${PRIORITY_COLORS[ticket.priority]}`} />
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{ticket.title}</span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]} text-white`}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
        </div>
        <div className="mb-2">
          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {SOURCE_LABELS[ticket.source_type]}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <User size={12} />
            {ticket.assignee_id ? ticket.assignee_id : '未分配'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDate(ticket.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function Column({ config, tickets }: { config: ColumnConfig; tickets: TodoTicket[] }) {
  return (
    <div className={`flex min-w-[300px] flex-1 flex-col rounded-lg border-t-4 ${config.color} bg-surface dark:bg-slate-900`}>
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{config.label}</h3>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {tickets.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {tickets.length === 0 ? (
          <Empty icon={Filter} message="暂无工单" className="min-h-[120px]" />
        ) : (
          tickets.map((t) => <TicketCard key={t.id} ticket={t} />)
        )}
      </div>
    </div>
  )
}

export default function TodoPool() {
  const [sourceFilter, setSourceFilter] = useState('')
  const { data, isLoading } = useTodoTickets({ page_size: 100 })

  const allTickets = useMemo(() => data?.items ?? [], [data])

  const filtered = useMemo(() => {
    if (!sourceFilter) return allTickets
    return allTickets.filter((t) => t.source_type === sourceFilter)
  }, [allTickets, sourceFilter])

  const grouped = useMemo(() => {
    const map: Record<string, TodoTicket[]> = { pending: [], in_progress: [], done: [] }
    for (const ticket of filtered) {
      const col = COLUMNS.find((c) => c.statuses.includes(ticket.status))
      if (col) map[col.key].push(ticket)
    }
    return map
  }, [filtered])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">待办池</h1>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-9 rounded-md border border-surface-border bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column key={col.key} config={col} tickets={grouped[col.key]} />
        ))}
      </div>
    </div>
  )
}
