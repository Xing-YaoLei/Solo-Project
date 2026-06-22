'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/ui/status-badge'
import type { BoardGroup, TicketStatus } from '@/lib/types'

interface BoardGroupProps {
  group: BoardGroup
  color?: string
  onTicketClick?: (ticketId: string) => void
}

type BadgeStatus = 'pending_remediation' | 'in_remediation' | 'pending_review' | 'closed' | 'approved' | 'rejected' | 'returned'

const statusMap: Record<string, BadgeStatus> = {
  pending_remediation: 'pending_remediation',
  in_remediation: 'in_remediation',
  pending_review: 'pending_review',
  closed: 'closed',
}

const BoardGroupCard: React.FC<BoardGroupProps> = ({ group, color, onTicketClick }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />}
          <span className="text-sm font-medium text-navy-900">{group.label}</span>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 font-mono text-xs font-medium text-slate-600">
            {group.count}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {expanded && group.children && (
        <div className="border-t border-slate-100 px-4 py-3">
          {group.children.map((child) => (
            <div key={child.key} className="mb-3 last:mb-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">{child.label}</span>
                <span className="font-mono text-xs text-slate-400">({child.count})</span>
              </div>
              <div className="space-y-1.5">
                {child.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onTicketClick?.(ticket.id)}
                    className={cn(
                      'flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 transition-colors',
                      onTicketClick && 'cursor-pointer hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 font-mono text-xs font-medium text-navy-900">
                        {ticket.ticketNo}
                      </span>
                      <span className="truncate text-xs text-slate-600">{ticket.title}</span>
                    </div>
                    <StatusBadge status={statusMap[ticket.status] ?? 'pending_remediation'} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BoardGroupCard
