import { PreparationTrendChart } from '@/components/charts/PreparationTrendChart';
import { TestDriveDistributionChart } from '@/components/charts/TestDriveDistributionChart';
import { QuoteCandleChart } from '@/components/charts/QuoteCandleChart';
import {
  mockPreparationTrend,
  mockTestDriveDistribution,
  mockQuoteCandles,
  mockSyncDelayInfo,
} from '@/data/mockData';
import { AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const hasDelay = mockSyncDelayInfo.some((d) => d.isDelayed);
  const maxDelay = Math.max(...mockSyncDelayInfo.filter((d) => d.isDelayed).map((d) => d.delayHours), 0);
  const delayedSource = mockSyncDelayInfo.find((d) => d.isDelayed);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">图表分析中心</h1>
          <p className="text-sm text-slate-400 mt-0.5">多维度趋势、分布与波动分析</p>
        </div>
      </div>

      {hasDelay && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <div className="text-sm">
            <span className="text-rose-300 font-semibold">⚠ {delayedSource?.sourceName}数据延迟 {maxDelay.toFixed(0)} 小时</span>
            <span className="text-slate-400 ml-2">图表区间已标记数据延迟影响范围，请谨慎解读</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <PreparationTrendChart data={mockPreparationTrend} delays={mockSyncDelayInfo} />
        <TestDriveDistributionChart data={mockTestDriveDistribution} delays={mockSyncDelayInfo} />
      </div>

      <QuoteCandleChart data={mockQuoteCandles} delays={mockSyncDelayInfo} />
    </div>
  );
}
