import React from 'react';
import { WorkOrderStatus, WorkOrderStatusText, QuoteStatus, QuoteStatusText, RiskLevel, RiskLevelText, RiskLevelColor } from '@/types';

type StatusType = WorkOrderStatus | QuoteStatus | RiskLevel;

interface StatusBadgeProps {
  status: StatusType;
  type?: 'workOrder' | 'quote' | 'risk';
}

const WorkOrderColor: Record<WorkOrderStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  InProgress: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-800',
  Rework: 'bg-red-100 text-red-800',
};

const QuoteColor: Record<QuoteStatus, string> = {
  Draft: 'bg-gray-100 text-gray-800',
  PendingApproval: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Expired: 'bg-gray-100 text-gray-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'workOrder' }) => {
  let colorClass = '';
  let text = '';

  if (type === 'workOrder') {
    colorClass = WorkOrderColor[status as WorkOrderStatus];
    text = WorkOrderStatusText[status as WorkOrderStatus];
  } else if (type === 'quote') {
    colorClass = QuoteColor[status as QuoteStatus];
    text = QuoteStatusText[status as QuoteStatus];
  } else if (type === 'risk') {
    colorClass = RiskLevelColor[status as RiskLevel];
    text = RiskLevelText[status as RiskLevel];
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
};

export default StatusBadge;
