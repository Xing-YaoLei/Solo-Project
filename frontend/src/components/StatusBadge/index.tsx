import { Tag } from 'antd';
import type { AppointmentStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'small' | 'default';
}

export default function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  return (
    <Tag 
      color={STATUS_COLORS[status]} 
      style={{ 
        fontSize: size === 'small' ? 12 : 14,
        padding: size === 'small' ? '0 8px' : '2px 10px',
      }}
    >
      {STATUS_LABELS[status]}
    </Tag>
  );
}
