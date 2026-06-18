import { MetricCard } from '@/components/MetricCard';
import { StoreMap } from '@/components/StoreMap';
import { AlertTimeline } from '@/components/AlertTimeline';
import { SyncDelayBadge } from '@/components/SyncDelayBadge';
import {
  mockStores,
  mockAlerts,
  mockVehicles,
  mockSyncDelayInfo,
} from '@/data/mockData';

function buildTrend(len = 7, base = 50, amplitude = 10): number[] {
  return Array.from({ length: len }, (_, i) =>
    Math.round(base + Math.sin(i / 1.5) * amplitude + (Math.random() - 0.5) * 4)
  );
}

export default function DashboardPage() {
  const totalInStock = mockVehicles.length;
  const totalAlerts = mockAlerts.filter((a) => !a.resolved).length;
  const highRiskRatio = Math.round(
    (mockVehicles.filter((v) => v.riskLevel === 'high' || v.riskLevel === 'critical').length / totalInStock) * 100
  );
  const avgCompletion = Math.round(
    mockVehicles.reduce((acc, v) => acc + v.documentCompletion, 0) / totalInStock
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">风险监测总览</h1>
          <p className="text-sm text-slate-400 mt-0.5">实时追踪全国门店过户材料风险状态</p>
        </div>
        <SyncDelayBadge delays={mockSyncDelayInfo} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard variant="primary" title="在库车辆数" value={totalInStock} delta={{ value: 8, label: '台周环比' }} subTitle={`${mockStores.length}家门店覆盖`} />
        <MetricCard variant="primary" title="预警车辆数" value={totalAlerts} delta={{ value: 2, label: '条日新增' }} subTitle="待处理" />
        <MetricCard variant="primary" title="高风险占比" value={`${highRiskRatio}%`} delta={{ value: 1.2, label: '% 环比' }} subTitle="中高+严重" />
        <MetricCard variant="primary" title="平均材料完成度" value={`${avgCompletion}%`} delta={{ value: 3.5, label: '% 周环比' }} subTitle="六类材料综合" />

        <MetricCard variant="trend" title="日均补料时长" value="4.2d" delta={{ value: 0.3, label: 'd↓' }} data={buildTrend(7, 18, 4)} color="#F59E0B" />
        <MetricCard variant="trend" title="30天过户率" value="68.4%" delta={{ value: 5.2, label: '%↑' }} data={buildTrend(7, 65, 6)} color="#3B82F6" />
        <MetricCard variant="trend" title="整备完成率" value="74.1%" delta={{ value: 2.1, label: '%↑' }} data={buildTrend(7, 70, 5)} color="#10B981" />
        <MetricCard variant="trend" title="试驾转化率" value="28.6%" delta={{ value: 1.4, label: '%↓' }} data={buildTrend(7, 30, 4)} color="#8B5CF6" />

        <MetricCard
          variant="ring"
          title="Top3 缺失材料占比"
          total="57%"
          segments={[
            { label: '行驶证', value: 23, color: '#EF4444' },
            { label: '登记证', value: 19, color: '#F59E0B' },
            { label: '购置税', value: 15, color: '#8B5CF6' },
          ]}
          note="占全部预警来源 57%"
          className="xl:col-span-4"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <StoreMap stores={mockStores} />
        </div>
        <AlertTimeline alerts={mockAlerts} />
      </div>
    </div>
  );
}
