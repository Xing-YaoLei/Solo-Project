'use client';

import DataTable, { type Column } from '@/components/common/DataTable';
import type { OwnerDrillStats } from '@scenic/shared';
import { formatDuration } from '@/lib/utils';
import { Star, Clock, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

interface OwnerDrillTableProps {
  data: OwnerDrillStats[];
  loading?: boolean;
}

export default function OwnerDrillTable({ data, loading }: OwnerDrillTableProps) {
  const columns: Column<OwnerDrillStats>[] = [
    {
      key: 'ownerName',
      title: '负责人',
      dataIndex: 'ownerName',
      render: (record) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {record.ownerName?.[0] || '-'}
            </span>
          </div>
          <span className="font-medium">{record.ownerName}</span>
        </div>
      ),
    },
    {
      key: 'totalCount',
      title: '总工单',
      dataIndex: 'totalCount',
      align: 'center',
      render: (record) => (
        <div className="inline-flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{record.totalCount}</span>
        </div>
      ),
    },
    {
      key: 'closedCount',
      title: '已关闭',
      dataIndex: 'closedCount',
      align: 'center',
      render: (record) => (
        <div className="inline-flex items-center gap-1 text-success">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="font-medium">{record.closedCount}</span>
        </div>
      ),
    },
    {
      key: 'overdueCount',
      title: '超时数',
      dataIndex: 'overdueCount',
      align: 'center',
      render: (record) => (
        <div
          className={`inline-flex items-center gap-1 ${
            record.overdueCount > 0 ? 'text-danger' : 'text-slate-400'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-medium">{record.overdueCount}</span>
        </div>
      ),
    },
    {
      key: 'avgDuration',
      title: '平均处理时长',
      dataIndex: 'avgDurationMinutes',
      align: 'center',
      render: (record) => (
        <div className="inline-flex items-center gap-1 text-slate-600">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(record.avgDurationMinutes || 0)}</span>
        </div>
      ),
    },
    {
      key: 'avgSatisfaction',
      title: '平均满意度',
      dataIndex: 'avgSatisfaction',
      align: 'center',
      render: (record) => (
        <div className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-warning fill-warning" />
          <span className="font-medium text-slate-700">
            {record.avgSatisfaction ? record.avgSatisfaction.toFixed(1) : '-'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey="ownerId"
      loading={loading}
      emptyText="暂无负责人数据"
    />
  );
}
