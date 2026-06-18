import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/main';
import { PreparationTrendChart } from '@/components/charts/PreparationTrendChart';
import { TestDriveDistributionChart } from '@/components/charts/TestDriveDistributionChart';
import { QuoteCandleChart } from '@/components/charts/QuoteCandleChart';
import {
  fetchPreparationTrend,
  fetchTestDriveDistribution,
  fetchQuoteCandles,
  fetchSyncDelayInfo,
} from '@/services/endpoints';
import {
  mockPreparationTrend,
  mockTestDriveDistribution,
  mockQuoteCandles,
  mockSyncDelayInfo,
} from '@/data/mockData';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  const delaysQuery = useQuery({
    queryKey: QUERY_KEYS.syncDelay,
    queryFn: async () => (await fetchSyncDelayInfo()).data,
    select: (data) => data ?? mockSyncDelayInfo,
  });

  const prepQuery = useQuery({
    queryKey: [...QUERY_KEYS.preparationTrend, rangeDays],
    queryFn: async () => (await fetchPreparationTrend(rangeDays)).data,
    select: (data) => data ?? mockPreparationTrend,
  });

  const testQuery = useQuery({
    queryKey: [...QUERY_KEYS.testDriveDist, rangeDays],
    queryFn: async () => (await fetchTestDriveDistribution({ days: rangeDays })).data,
    select: (data) => data ?? mockTestDriveDistribution,
  });

  const quoteQuery = useQuery({
    queryKey: [...QUERY_KEYS.quoteCandles, rangeDays],
    queryFn: async () => (await fetchQuoteCandles(rangeDays)).data,
    select: (data) => data ?? mockQuoteCandles,
  });

  const delaysData = delaysQuery.data ?? mockSyncDelayInfo;
  const hasDelay = delaysData.some((d) => d.isDelayed);
  const maxDelay = Math.max(...delaysData.filter((d) => d.isDelayed).map((d) => d.delayHours), 0);
  const delayedSource = delaysData.find((d) => d.isDelayed);

  const Skeleton = () => (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 300 }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="text-brand-400 animate-spin" />
        <span className="text-xs text-slate-500">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">图表分析中心</h1>
          <p className="text-sm text-slate-400 mt-0.5">多维度趋势、分布与波动分析</p>
        </div>
        <div className="flex gap-1.5 bg-surface-card border border-surface-border rounded-lg p-1">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={cn(
                'h-8 px-3 rounded-md text-xs font-medium transition',
                rangeDays === d ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {hasDelay && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <div className="text-sm">
            <span className="text-rose-300 font-semibold">
              ⚠ {delayedSource?.sourceName}数据延迟 {maxDelay.toFixed(0)} 小时
            </span>
            <span className="text-slate-400 ml-2">图表区间已标记数据延迟影响范围，请谨慎解读</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {prepQuery.isLoading ? (
          <div className="rounded-2xl bg-surface-card border border-surface-border p-5">
            <Skeleton />
          </div>
        ) : (
          <PreparationTrendChart
            data={prepQuery.data ?? mockPreparationTrend}
            delays={delaysData}
          />
        )}
        {testQuery.isLoading ? (
          <div className="rounded-2xl bg-surface-card border border-surface-border p-5">
            <Skeleton />
          </div>
        ) : (
          <TestDriveDistributionChart
            data={testQuery.data ?? mockTestDriveDistribution}
            delays={delaysData}
          />
        )}
      </div>

      {quoteQuery.isLoading ? (
        <div className="rounded-2xl bg-surface-card border border-surface-border p-5">
          <Skeleton />
        </div>
      ) : (
        <QuoteCandleChart
          data={quoteQuery.data ?? mockQuoteCandles}
          delays={delaysData}
        />
      )}
    </div>
  );
}
