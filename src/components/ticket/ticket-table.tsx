'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, Check, X } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/ui/status-badge'
import type { Ticket, TicketStatus } from '@/lib/types'

type SortField = 'ticketNo' | 'title' | 'status' | 'department' | 'dueDate' | 'firstResolution'
type SortDir = 'asc' | 'desc'

interface TicketTableProps {
  tickets: Ticket[]
}

const statusMap: Record<TicketStatus, 'pending_remediation' | 'in_remediation' | 'pending_review' | 'closed'> = {
  pending_remediation: 'pending_remediation',
  in_remediation: 'in_remediation',
  pending_review: 'pending_review',
  closed: 'closed',
}

const TicketTable: React.FC<TicketTableProps> = ({ tickets }) => {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('ticketNo')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...tickets].sort((a, b) => {
    let cmp = 0
    const av = a[sortField]
    const bv = b[sortField]
    if (typeof av === 'string' && typeof bv === 'string') {
      cmp = av.localeCompare(bv)
    } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
      cmp = Number(av) - Number(bv)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium transition-colors',
        sortField === field ? 'text-amber-600' : 'text-slate-500 hover:text-navy-900'
      )}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3"><SortHeader field="ticketNo">工单编号</SortHeader></th>
            <th className="px-4 py-3"><SortHeader field="title">标题</SortHeader></th>
            <th className="px-4 py-3"><SortHeader field="status">状态</SortHeader></th>
            <th className="px-4 py-3"><SortHeader field="department">部门</SortHeader></th>
            <th className="px-4 py-3"><SortHeader field="dueDate">截止日期</SortHeader></th>
            <th className="px-4 py-3"><SortHeader field="firstResolution">首次解决</SortHeader></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => router.push(`/tickets/${ticket.id}`)}
              className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
            >
              <td className="px-4 py-3 font-mono text-sm font-medium text-navy-900">{ticket.ticketNo}</td>
              <td className="max-w-[240px] truncate px-4 py-3 text-sm text-slate-700">{ticket.title}</td>
              <td className="px-4 py-3"><StatusBadge status={statusMap[ticket.status]} /></td>
              <td className="px-4 py-3 text-sm text-slate-600">{ticket.department}</td>
              <td className="px-4 py-3 font-mono text-sm text-slate-600">{formatDate(ticket.dueDate)}</td>
              <td className="px-4 py-3">
                {ticket.firstResolution ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <X className="h-4 w-4 text-rose-600" />
                )}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">暂无工单数据</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default TicketTable
