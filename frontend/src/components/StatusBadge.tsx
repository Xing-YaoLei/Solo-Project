import React from 'react';
import { Tag } from 'antd';
import {
  BatchStatus,
  ArrivalStatus,
  SettlementStatus,
  ExceptionSeverity,
  ExceptionResolution,
} from '../types';

const batchStatusConfig: Record<BatchStatus, { color: string; label: string }> = {
  [BatchStatus.Draft]: { color: 'default', label: '草稿' },
  [BatchStatus.Open]: { color: 'blue', label: '开团中' },
  [BatchStatus.Closed]: { color: 'orange', label: '已截单' },
  [BatchStatus.Delivering]: { color: 'cyan', label: '配送中' },
  [BatchStatus.Delivered]: { color: 'green', label: '已送达' },
  [BatchStatus.Completed]: { color: 'green', label: '已完成' },
  [BatchStatus.Cancelled]: { color: 'red', label: '已取消' },
};

const arrivalStatusConfig: Record<ArrivalStatus, { color: string; label: string }> = {
  [ArrivalStatus.Pending]: { color: 'default', label: '待到货' },
  [ArrivalStatus.PartialArrival]: { color: 'orange', label: '部分到货' },
  [ArrivalStatus.Arrived]: { color: 'blue', label: '已到货' },
  [ArrivalStatus.Inspected]: { color: 'green', label: '已验收' },
  [ArrivalStatus.Exception]: { color: 'red', label: '异常' },
};

const settlementStatusConfig: Record<SettlementStatus, { color: string; label: string }> = {
  [SettlementStatus.Pending]: { color: 'default', label: '待处理' },
  [SettlementStatus.Calculating]: { color: 'blue', label: '计算中' },
  [SettlementStatus.Confirmed]: { color: 'orange', label: '已确认' },
  [SettlementStatus.Settled]: { color: 'green', label: '已结算' },
  [SettlementStatus.Disputed]: { color: 'red', label: '有争议' },
};

const severityConfig: Record<ExceptionSeverity, { color: string; label: string }> = {
  [ExceptionSeverity.Low]: { color: 'blue', label: '低' },
  [ExceptionSeverity.Medium]: { color: 'orange', label: '中' },
  [ExceptionSeverity.High]: { color: 'red', label: '高' },
  [ExceptionSeverity.Critical]: { color: 'magenta', label: '严重' },
};

const resolutionConfig: Record<ExceptionResolution, { color: string; label: string }> = {
  [ExceptionResolution.Pending]: { color: 'default', label: '待处理' },
  [ExceptionResolution.Refunded]: { color: 'blue', label: '退款' },
  [ExceptionResolution.Reshipped]: { color: 'green', label: '补发' },
  [ExceptionResolution.Discarded]: { color: 'default', label: '丢弃' },
  [ExceptionResolution.Compromised]: { color: 'orange', label: '协商' },
};

type StatusType = BatchStatus | ArrivalStatus | SettlementStatus | ExceptionSeverity | ExceptionResolution;

const allConfigs: Record<string, Record<string, { color: string; label: string }>> = {
  batch: batchStatusConfig,
  arrival: arrivalStatusConfig,
  settlement: settlementStatusConfig,
  severity: severityConfig,
  resolution: resolutionConfig,
};

interface StatusBadgeProps {
  status: StatusType;
  type: 'batch' | 'arrival' | 'settlement' | 'severity' | 'resolution';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const config = allConfigs[type];
  if (!config || !config[status]) {
    return <Tag>{status}</Tag>;
  }
  const { color, label } = config[status];
  return <Tag color={color}>{label}</Tag>;
};

export default StatusBadge;
