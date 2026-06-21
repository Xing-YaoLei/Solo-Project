'use client';

import { useState } from 'react';
import { ExternalLink, AlertTriangle, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import type { LockRecordDetail } from '@/types';
import { AnomalyTypeLabels } from '@/types';
import { formatDate, formatDuration, cn } from '@/lib/utils';

interface LockRecordsTableProps {
  data: LockRecordDetail[];
  totalRecords: number;
  anomalyCount: number;
  className?: string;
  onLoadMore?: () => void;
}

export function LockRecordsTable({
  data,
  totalRecords,
  anomalyCount,
  className,
  onLoadMore,
}: LockRecordsTableProps) {
  const [filterAnomalyOnly, setFilterAnomalyOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(record => {
    const matchesAnomaly = !filterAnomalyOnly || record.isAnomaly;
    const matchesSearch = searchTerm === '' ||
      record.seatInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.lockReason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAnomaly && matchesSearch;
  });

  const getStatusBadge = (status: LockRecordDetail['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="badge-warning">
            <Clock className="h-3 w-3 mr-1" />
            进行中
          </span>
        );
      case 'expired':
        return (
          <span className="badge-danger">
            <XCircle className="h-3 w-3 mr-1" />
            已过期
          </span>
        );
      case 'released':
        return (
          <span className="badge-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            已释放
          </span>
        );
    }
  };

  const handleJumpToOriginal = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 p-4">
        <div className="flex items-center gap-4">
          <h3 className="font-display font-semibold text-white">锁座记录明细</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400">共 {totalRecords} 条</span>
            <span className="text-neutral-600">|</span>
            <span className="text-danger">
              <AlertTriangle className="h-3 w-3 mr-1 inline" />
              {anomalyCount} 条异常
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="搜索座位、操作人、原因..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 w-64"
            />
          </div>

          <button
            onClick={() => setFilterAnomalyOnly(!filterAnomalyOnly)}
            className={cn(
              'btn gap-2',
              filterAnomalyOnly
                ? 'bg-danger/20 text-danger border border-danger/50 hover:bg-danger/30'
                : 'btn-secondary'
            )}
          >
            <Filter className="h-4 w-4" />
            {filterAnomalyOnly ? '显示全部' : '仅显示异常'}
          </button>
        </div>
      </div>

      <div className="table-container max-h-[600px]">
        <table className="table">
          <thead>
            <tr>
              <th className="w-10">状态</th>
              <th>座位信息</th>
              <th>关联订单</th>
              <th>操作人</th>
              <th>锁座原因</th>
              <th>锁座时长</th>
              <th>锁座时间</th>
              <th>过期时间</th>
              <th>异常类型</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-neutral-500">
                  暂无符合条件的记录
                </td>
              </tr>
            ) : (
              filteredData.map((record, index) => (
                <tr
                  key={record.id}
                  className={cn(
                    record.isAnomaly && 'anomaly-row anomaly-pulse',
                    'transition-all duration-300'
                  )}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td>{getStatusBadge(record.status)}</td>
                  <td>
                    <div className="font-medium text-white">{record.seatInfo}</div>
                    <div className="text-xs text-neutral-500">
                      {record.area}区 · {record.row}排 · {record.seatNumber}号
                    </div>
                  </td>
                  <td>
                    {record.orderNo ? (
                      <span className="font-mono text-neutral-300">{record.orderNo}</span>
                    ) : (
                      <span className="text-neutral-500">-</span>
                    )}
                  </td>
                  <td>
                    <span className="text-neutral-300">{record.operatorName}</span>
                  </td>
                  <td>
                    <span className="text-neutral-300">{record.lockReason}</span>
                  </td>
                  <td>
                    <span className="font-mono text-neutral-300">{formatDuration(record.lockDuration)}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-neutral-400">{formatDate(record.lockedAt)}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-neutral-400">{formatDate(record.expiredAt)}</span>
                  </td>
                  <td>
                    {record.isAnomaly && record.anomalyType ? (
                      <div className="space-y-1">
                        <span className="badge-danger">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {AnomalyTypeLabels[record.anomalyType]}
                        </span>
                        {record.anomalyDescription && (
                          <p className="text-xs text-danger/80">{record.anomalyDescription}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-500">-</span>
                    )}
                  </td>
                  <td className="text-right">
                    {record.originalRecordUrl ? (
                      <button
                        onClick={() => handleJumpToOriginal(record.originalRecordUrl)}
                        className="btn-ghost gap-1 text-xs text-primary hover:text-primary-light"
                        title="跳转至原始记录"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        查看原始
                      </button>
                    ) : (
                      <span className="text-neutral-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onLoadMore && filteredData.length > 0 && filteredData.length < totalRecords && (
        <div className="border-t border-neutral-800 p-4 text-center">
          <button onClick={onLoadMore} className="btn-secondary">
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
