import React, { useState, useMemo } from 'react';
import { AlertCircle, Clock, User, FileText, Filter } from 'lucide-react';
import ChartCard from './ChartCard';
import { Badge } from '@/components/ui/Badge';
import {
  formatDateTime,
  formatDuration,
  getApprovalStatusLabel,
  getApprovalStatusColor,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ApprovalNodeExceptionItem, ApprovalStatus } from '@/types';

export interface ApprovalAnomalyTimelineProps {
  data: ApprovalNodeExceptionItem[];
  lastUpdated?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onNodeClick?: (item: ApprovalNodeExceptionItem) => void;
  className?: string;
}

const STATUS_FILTERS: { value: ApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '已完成' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'escalated', label: '已延迟' },
];

const getStatusIcon = (status: ApprovalStatus, isAnomaly: boolean) => {
  if (isAnomaly) {
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  }
  return <Clock className="w-5 h-5 text-[#94a3b8]" />;
};

export const ApprovalAnomalyTimeline: React.FC<ApprovalAnomalyTimelineProps> = ({
  data,
  lastUpdated,
  loading = false,
  onRefresh,
  onNodeClick,
  className,
}) => {
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') {
      return data;
    }
    return data.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  const anomalyCount = useMemo(() => {
    return data.filter((item) => item.status !== 'approved').length;
  }, [data]);

  const getAnomalyReason = (status: ApprovalStatus, delayDays: number): string => {
    switch (status) {
      case 'rejected':
        return '审批被驳回，请检查提交材料';
      case 'escalated':
        return `已升级处理，延迟 ${delayDays} 天`;
      case 'pending':
        return delayDays > 7 ? `审批超时，已延迟 ${delayDays} 天` : '等待审批中';
      default:
        return '正常处理中';
    }
  };

  return (
    <ChartCard
      title="审批节点异常"
      lastUpdated={lastUpdated}
      loading={loading}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-[#e2e8f0]">
              共 <span className="text-[#d4af37] font-semibold">{anomalyCount}</span> 个异常节点
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#94a3b8]" />
            <div className="flex rounded-lg overflow-hidden border border-[#334155]">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    statusFilter === filter.value
                      ? 'bg-[#d4af37] text-[#0f2540] font-medium'
                      : 'bg-[#0f2540] text-[#94a3b8] hover:bg-[#1e3a5f]'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#d4af37] via-[#334155] to-[#334155]" />

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {filteredData.length === 0 ? (
              <div className="text-center py-12 text-[#94a3b8]">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无异常审批节点</p>
              </div>
            ) : (
              filteredData.map((item, index) => {
                const isAnomaly = item.status !== 'approved';
                const isLast = index === filteredData.length - 1;

                return (
                  <div
                    key={`${item.node_name}-${index}`}
                    className={cn(
                      'relative pl-16 cursor-pointer transition-all duration-300',
                      'hover:translate-x-1'
                    )}
                    onClick={() => onNodeClick?.(item)}
                  >
                    <div
                      className={cn(
                        'absolute left-4 w-5 h-5 rounded-full border-4 flex items-center justify-center',
                        isAnomaly
                          ? 'bg-red-500 border-[#0f2540] shadow-lg shadow-red-500/50'
                          : 'bg-green-500 border-[#0f2540]',
                        'z-10'
                      )}
                    />

                    <div
                      className={cn(
                        'p-4 rounded-lg border transition-all duration-300',
                        isAnomaly
                          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/60'
                          : 'bg-[#0f2540] border-[#334155] hover:border-[#d4af37]/50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status, isAnomaly)}
                          <h4 className="font-semibold text-white">{item.node_name}</h4>
                        </div>
                        <Badge
                          className={cn(
                            getApprovalStatusColor(item.status),
                            isAnomaly && 'animate-pulse'
                          )}
                          variant="secondary"
                        >
                          {getApprovalStatusLabel(item.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-[#64748b]" />
                          <span className="text-[#94a3b8]">案件:</span>
                          <span className="text-[#e2e8f0]">{item.case_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-[#64748b]" />
                          <span className="text-[#94a3b8]">审批人:</span>
                          <span className="text-[#e2e8f0]">{item.approver_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[#64748b]" />
                          <span className="text-[#94a3b8]">提交时间:</span>
                          <span className="text-[#e2e8f0] font-mono">
                            {formatDateTime(item.submit_time)}
                          </span>
                        </div>

                        {isAnomaly && (
                          <div className="mt-3 pt-3 border-t border-[#334155]">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-red-400 font-medium">
                                  {getAnomalyReason(item.status, item.delay_days)}
                                </p>
                                <p className="text-xs text-[#94a3b8] mt-1">
                                  预计完成: {formatDateTime(item.expected_complete_time)}
                                  {item.delay_days > 0 && (
                                    <span className="text-red-400 ml-2">
                                      ({formatDuration(-item.delay_days)})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isLast && <div className="h-6" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ChartCard>
  );
};

export default ApprovalAnomalyTimeline;
