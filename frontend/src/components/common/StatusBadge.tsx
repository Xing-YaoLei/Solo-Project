import React from 'react';
import { Badge } from 'antd';
import { getStatusColor, getStatusText } from '../../utils/format';

interface StatusBadgeProps {
  status: string;
  text?: string;
  color?: string;
  showDot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  color,
  showDot = true,
}) => {
  const badgeColor = color || getStatusColor(status);
  const displayText = text || getStatusText(status);

  return (
    <Badge
      status={badgeColor as unknown as 'success' | 'processing' | 'default' | 'error' | 'warning'}
      text={displayText}
      color={showDot ? undefined : 'transparent'}
    />
  );
};

export default StatusBadge;
