'use client';

import StatusBadge from '@/components/common/StatusBadge';
import PriorityBadge from '@/components/common/PriorityBadge';
import CountdownTimer from '@/components/common/CountdownTimer';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';
import { User, MapPin, Phone, Ticket } from 'lucide-react';
import Link from 'next/link';
import type { Complaint } from '@scenic/shared';
import { SOURCE_LABELS } from '@scenic/shared';
import { formatPhone as maskPhone } from '@/lib/utils';

interface ComplaintCardProps {
  complaint: Complaint;
  selected?: boolean;
  onClick?: () => void;
}

export default function ComplaintCard({
  complaint,
  selected,
  onClick,
}: ComplaintCardProps) {
  const { isExpired } = useCountdown(complaint.deadlineAt);

  return (
    <Link
      href={`/complaints/${complaint.id}`}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'block p-4 bg-white rounded-lg border transition-all cursor-pointer card-hover',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-slate-200 hover:border-primary/50',
        isExpired && 'card-overdue'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 font-mono">
              {complaint.code}
            </span>
            <StatusBadge status={complaint.status} />
          </div>
          <h3 className="text-sm font-medium text-slate-800 truncate">
            {complaint.title}
          </h3>
        </div>
        <PriorityBadge priority={complaint.priority} />
      </div>

      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
        {complaint.content}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-3">
        <span className="inline-flex items-center gap-1">
          <User className="w-3 h-3" />
          {complaint.visitorName}
        </span>
        <span className="inline-flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {maskPhone(complaint.visitorPhone)}
        </span>
        {complaint.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {complaint.location}
          </span>
        )}
        {complaint.ticketNo && (
          <span className="inline-flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            {complaint.ticketNo}
          </span>
        )}
      </div>

      {complaint.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {complaint.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                border: `1px solid ${tag.color}30`,
              }}
            >
              {tag.name}
            </span>
          ))}
          {complaint.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-500 bg-slate-100">
              +{complaint.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {SOURCE_LABELS[complaint.source]}
        </span>
        <div className="flex items-center gap-3">
          {complaint.owner && (
            <span className="text-xs text-slate-500">
              负责人：{complaint.owner.name}
            </span>
          )}
          <CountdownTimer deadline={complaint.deadlineAt} />
        </div>
      </div>
    </Link>
  );
}
