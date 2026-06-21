'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { LockRecordsTable } from '@/components/tables/LockRecordsTable';
import { AlertTriangle, Clock, CheckCircle, XCircle, ExternalLink, Info } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { AnomalyTypeLabels } from '@/types';

export default function LockRecordsPage() {
  const { lockRecords, lockRecordsTotal, anomalyCount, isLoading, fetchLockRecords } = useDashboardStore();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchLockRecords(page, pageSize);
  }, [fetchLockRecords, page, pageSize]);

  const activeCount = lockRecords.filter(r => r.status === 'active').length;
  const expiredCount = lockRecords.filter(r => r.status === 'expired').length;
  const releasedCount = lockRecords.filter(r => r.status === 'released').length;

  const anomalyByType = lockRecords
    .filter(r => r.isAnomaly && r.anomalyType)
    .reduce((acc, r) => {
      acc[r.anomalyType!] = (acc[r.anomalyType!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  if (isLoading && lockRecords.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-neutral-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">锁座记录管理</h1>
          <p className="mt-1 text-neutral-400">监控锁座状态，及时处理异常记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 animate-fade-in-stagger">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">总记录数</p>
              <p className="font-mono text-xl font-bold text-white">
                {formatNumber(lockRecordsTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">进行中</p>
              <p className="font-mono text-xl font-bold text-warning">
                {formatNumber(activeCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">已释放</p>
              <p className="font-mono text-xl font-bold text-success">
                {formatNumber(releasedCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-neutral-700/50 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-neutral-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">已过期</p>
              <p className="font-mono text-xl font-bold text-neutral-400">
                {formatNumber(expiredCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-danger/30 anomaly-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">异常记录</p>
              <p className="font-mono text-xl font-bold text-danger">
                {formatNumber(anomalyCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {anomalyCount > 0 && (
        <div className="card border-danger/30 bg-danger/5 p-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-danger flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-white mb-3">异常类型分布</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(anomalyByType).map(([type, count]) => (
                  <div key={type} className="rounded-lg bg-neutral-800/50 p-3">
                    <p className="text-xs text-neutral-400">
                      {AnomalyTypeLabels[type as keyof typeof AnomalyTypeLabels]}
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-danger">
                      {formatNumber(count)} 条
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-primary/10 border border-primary/30 p-4">
          <Info className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-white mb-1">异常记录说明</p>
            <p className="text-neutral-400">
              系统会自动检测锁座过程中的异常情况，包括超时未释放、重复锁座、金额不匹配和人工覆盖等。
              点击右侧的「查看原始」按钮可跳转至票务平台原始记录进行核对，确保数据口径一致。
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>原始记录跳转功能用于排查数据口径偏差，便于数据核对和问题定位。</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { type: 'timeout', desc: '锁座超过预设时长仍未释放，可能导致座位资源浪费' },
            { type: 'duplicate', desc: '同一座位被多次锁定，可能存在数据同步问题' },
            { type: 'amount_mismatch', desc: '支付金额与票价规则不匹配，需核实订单详情' },
            { type: 'manual_override', desc: '人工介入覆盖了系统自动锁座规则，需特别关注' },
          ].map((item) => (
            <div key={item.type} className="flex items-start gap-3 rounded-lg bg-neutral-800/30 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-danger flex-shrink-0" />
              <div>
                <p className="font-medium text-white text-sm">
                  {AnomalyTypeLabels[item.type as keyof typeof AnomalyTypeLabels]}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LockRecordsTable
        data={lockRecords}
        totalRecords={lockRecordsTotal}
        anomalyCount={anomalyCount}
        onLoadMore={() => setPage(p => p + 1)}
      />
    </div>
  );
}
