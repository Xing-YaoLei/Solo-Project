import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/main';
import ReactECharts from 'echarts-for-react';
import { RiskMatrixChart } from '@/components/RiskMatrixChart';
import {
  fetchStores,
  fetchRiskMatrix,
  fetchSyncDelayInfo,
  fetchVehicles,
  fetchDocumentMissingDistribution,
} from '@/services/endpoints';
import {
  mockStores,
  mockVehicles,
  mockMatrixBubbles,
  mockDocuments,
  mockSyncDelayInfo,
} from '@/data/mockData';
import { DOCUMENT_TYPES, RISK_COLORS, RISK_LABELS, STOCK_AGE_BUCKETS } from '@/utils/constants';
import { SyncDelayBadge } from '@/components/SyncDelayBadge';
import { cn } from '@/lib/utils';
import { formatPercent, formatDays } from '@/utils/format';
import { ChevronRight, Filter, Store, AlertTriangle, AlertCircle } from 'lucide-react';
import type { RiskLevel, DocumentType } from '@shared/types';

export default function RiskMatrixPage() {
  const navigate = useNavigate();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'all'>('all');
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocumentType[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 60]);

  const storeMapQuery = useQuery({
    queryKey: QUERY_KEYS.storeMap,
    queryFn: async () => (await fetchStores()).data,
    initialData: mockStores,
  });

  const matrixQuery = useQuery({
    queryKey: [...QUERY_KEYS.riskMatrix, { selectedStores, ageRange, selectedRisk, selectedDocTypes }],
    queryFn: async () =>
      (await fetchRiskMatrix({ days: 30, storeId: selectedStores[0] ?? undefined })).data,
    initialData: mockMatrixBubbles,
  });

  const vehiclesQuery = useQuery({
    queryKey: [...QUERY_KEYS.vehicles, { selectedStores, selectedRisk, ageRange }],
    queryFn: async () => {
      const r = await fetchVehicles({
        pageSize: 100,
        storeId: selectedStores[0] ?? undefined,
        riskLevel: selectedRisk === 'all' ? undefined : selectedRisk,
      });
      return r.data?.items ?? mockVehicles;
    },
    initialData: mockVehicles,
  });

  const missingDistQuery = useQuery({
    queryKey: QUERY_KEYS.documentMissing,
    queryFn: async () => (await fetchDocumentMissingDistribution()).data,
    initialData: [] as { documentType: string; documentName: string; count: number; byAgeBucket: Record<string, number> }[],
  });

  const delaysQuery = useQuery({
    queryKey: QUERY_KEYS.syncDelay,
    queryFn: async () => (await fetchSyncDelayInfo()).data,
    initialData: mockSyncDelayInfo,
  });

  const stores = storeMapQuery.data ?? mockStores;
  const matrixData = matrixQuery.data ?? mockMatrixBubbles;
  const vehicles = vehiclesQuery.data ?? mockVehicles;
  const delays = delaysQuery.data ?? mockSyncDelayInfo;

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (selectedStores.length && !selectedStores.includes(v.storeId)) return false;
      if (selectedRisk !== 'all' && v.riskLevel !== selectedRisk) return false;
      if (v.stockDays < ageRange[0] || v.stockDays > ageRange[1]) return false;
      if (selectedDocTypes.length) {
        const vehicleDocs = mockDocuments.filter((d) => d.vehicleId === v.id);
        const hasMissing = selectedDocTypes.some((dt) =>
          vehicleDocs.some((d) => d.type === dt && d.status !== 'present')
        );
        if (!hasMissing) return false;
      }
      return true;
    });
  }, [vehicles, selectedStores, selectedRisk, selectedDocTypes, ageRange]);

  const missingDist = missingDistQuery.data ?? [];

  const stackedBarData = useMemo(() => {
    const ages = STOCK_AGE_BUCKETS;
    const data: Record<string, Record<string, number>> = {};
    ages.forEach((a) => (data[a] = {}));
    if (missingDist.length > 0) {
      missingDist.forEach((item) => {
        ages.forEach((age) => {
          if (item.byAgeBucket[age]) {
            data[age][item.documentType] = item.byAgeBucket[age];
          }
        });
      });
    } else {
      const getBucket = (d: number) =>
        d <= 7 ? ages[0] : d <= 15 ? ages[1] : d <= 30 ? ages[2] : ages[3];
      filteredVehicles.forEach((v) => {
        const bucket = getBucket(v.stockDays);
        const vDocs = mockDocuments.filter((d) => d.vehicleId === v.id && d.status !== 'present');
        vDocs.forEach((d) => {
          data[bucket][d.type] = (data[bucket][d.type] ?? 0) + 1;
        });
      });
    }
    return data;
  }, [missingDist, filteredVehicles]);

  const barOption = {
    backgroundColor: 'transparent',
    legend: {
      top: 4,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      data: DOCUMENT_TYPES.map((d) => d.label),
      itemWidth: 10,
      itemHeight: 10,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(26,32,41,0.95)',
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
    },
    grid: { left: 45, right: 20, top: 40, bottom: 35 },
    xAxis: {
      type: 'category',
      data: STOCK_AGE_BUCKETS.map((s) => s + '天'),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
    },
    series: DOCUMENT_TYPES.map((dt, i) => ({
      name: dt.label,
      type: 'bar',
      stack: 'total',
      barWidth: 28,
      itemStyle: {
        color: ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#64748B'][i],
        borderRadius: [0, 0, 0, 0],
      },
      emphasis: { focus: 'series' },
      data: STOCK_AGE_BUCKETS.map((age) => stackedBarData[age][dt.key] ?? 0),
    })),
  };

  const toggleStore = (id: string) =>
    setSelectedStores((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleDoc = (dt: DocumentType) =>
    setSelectedDocTypes((s) => (s.includes(dt) ? s.filter((x) => x !== dt) : [...s, dt]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">过户材料风险矩阵</h1>
          <p className="text-sm text-slate-400 mt-0.5">库龄 × 材料完成度二维交叉分析</p>
        </div>
        <SyncDelayBadge delays={delays} />
      </div>

      <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-white">过滤器</span>
          <span className="text-[11px] text-slate-500">已筛选 {filteredVehicles.length} 台车</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5">门店 (多选)</div>
            <div className="flex flex-wrap gap-1.5">
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStore(s.id)}
                  className={cn(
                    'text-[11px] px-2 py-1 rounded-md border transition-colors',
                    selectedStores.includes(s.id)
                      ? 'bg-brand-500/20 border-brand-500/40 text-white'
                      : 'bg-white/[0.02] border-surface-border text-slate-400 hover:bg-white/5'
                  )}
                >
                  <Store size={10} className="inline -mt-0.5 mr-1" />
                  {s.name.slice(0, 6)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5">库龄范围: {ageRange[0]}-{ageRange[1]}天</div>
            <input
              type="range"
              min={0}
              max={60}
              value={ageRange[1]}
              onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
              className="w-full accent-brand-500"
            />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5">风险等级</div>
            <div className="flex gap-1.5">
              {(['all', 'low', 'medium', 'high', 'critical'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRisk(r)}
                  className={cn(
                    'text-[11px] px-2 py-1 rounded-md border transition-colors',
                    selectedRisk === r
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-surface-border text-slate-400 hover:bg-white/5'
                  )}
                >
                  {r === 'all' ? '全部' : RISK_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1.5">材料缺失类型 (多选)</div>
            <div className="flex flex-wrap gap-1.5">
              {DOCUMENT_TYPES.map((dt) => (
                <button
                  key={dt.key}
                  onClick={() => toggleDoc(dt.key)}
                  className={cn(
                    'text-[11px] px-2 py-1 rounded-md border transition-colors',
                    selectedDocTypes.includes(dt.key)
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-white/[0.02] border-surface-border text-slate-400 hover:bg-white/5'
                  )}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RiskMatrixChart bubbles={matrixData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden p-4">
          <div className="mb-2 px-2">
            <h3 className="text-sm font-semibold text-white">材料缺失 × 库龄堆叠分析</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">不同库龄段各类材料缺失情况</p>
          </div>
          <ReactECharts option={barOption} style={{ height: 320, width: '100%' }} />
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden flex flex-col">
          <div className="h-12 flex items-center justify-between px-5 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400" />
              <h3 className="text-sm font-semibold text-white">预警命中车辆</h3>
              <span className="text-[11px] text-slate-500">共 {filteredVehicles.length} 条</span>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-elevated/90 backdrop-blur-xl z-10">
                <tr className="text-slate-400 text-left">
                  <th className="px-4 py-2.5 font-medium">VIN</th>
                  <th className="px-2 py-2.5 font-medium">门店</th>
                  <th className="px-2 py-2.5 font-medium">品牌</th>
                  <th className="px-2 py-2.5 font-medium">库龄</th>
                  <th className="px-2 py-2.5 font-medium">完成度</th>
                  <th className="px-2 py-2.5 font-medium">风险等级</th>
                  <th className="px-2 py-2.5 font-medium">预警</th>
                  <th className="px-4 py-2.5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.slice(0, 20).map((v) => {
                  const store = stores.find((s) => s.id === v.storeId)!;
                  const alertsCount =
                    (v as unknown as { alertsCount?: number; alerts_count?: number }).alertsCount ??
                    (v as unknown as { alertsCount?: number; alerts_count?: number }).alerts_count ??
                    ('alerts' in v && Array.isArray((v as { alerts?: unknown[] }).alerts)
                      ? (v as { alerts: unknown[] }).alerts.length
                      : 0) ??
                    0;
                  return (
                    <tr
                      key={v.id}
                      className="border-t border-surface-border hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => navigate(`/review/${v.vin ?? v.id}`)}
                    >
                      <td className="px-4 py-2.5 font-mono text-slate-300">{v.vin.slice(-8)}</td>
                      <td className="px-2 py-2.5 text-slate-400">{store.name.slice(0, 5)}</td>
                      <td className="px-2 py-2.5 text-slate-200">{v.brand} {v.model}</td>
                      <td className="px-2 py-2.5 text-slate-300">{formatDays(v.stockDays)}</td>
                      <td className="px-2 py-2.5 tabular-nums text-slate-300">{formatPercent(v.documentCompletion)}</td>
                      <td className="px-2 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium"
                          style={{ background: `${RISK_COLORS[v.riskLevel]}20`, color: RISK_COLORS[v.riskLevel] }}
                        >
                          {RISK_LABELS[v.riskLevel]}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        {alertsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-medium">
                            <AlertCircle size={10} />
                            {alertsCount}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button className="inline-flex items-center gap-0.5 text-brand-400 hover:text-brand-300 text-[11px]">
                          复盘 <ChevronRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
