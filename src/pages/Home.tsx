import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EChartsOption } from 'echarts';
import KPICard from '@/components/KPICard';
import Chart from '@/components/Chart';
import { getKPI, getTrend, getYoyMom } from '@/api';
import type { KPIData, TrendDataPoint } from '@/types';

const KPI_ROUTES: Record<string, string> = {
  total_sales: '/ticket-types',
  total_revenue: '/ticket-types',
  verification_rate: '/verification',
  refund_rate: '/refund-dispute',
};

function buildTrendOption(data: TrendDataPoint[]): EChartsOption {
  const seriesMap = new Map<string, TrendDataPoint[]>();
  const dateSet = new Set<string>();

  for (const point of data) {
    if (!seriesMap.has(point.seriesName)) seriesMap.set(point.seriesName, []);
    seriesMap.get(point.seriesName)!.push(point);
    dateSet.add(point.date);
  }

  const dates = [...dateSet].sort();
  const areaColors = [
    ['rgba(6, 182, 212, 0.3)', 'rgba(6, 182, 212, 0.02)'],
    ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.02)'],
  ];

  return {
    title: { text: '赞助权益使用趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: [...seriesMap.keys()], top: 30 },
    grid: { left: 60, right: 30, top: 70, bottom: 30 },
    xAxis: { type: 'category', data: dates, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [...seriesMap.entries()].map(([name, points], idx) => ({
      name,
      type: 'line' as const,
      smooth: true,
      symbolSize: 4,
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: areaColors[idx % areaColors.length][0] },
            { offset: 1, color: areaColors[idx % areaColors.length][1] },
          ],
        },
      },
      data: dates.map((date) => {
        const p = points.find((pt) => pt.date === date);
        return p ? p.value : null;
      }),
    })),
  };
}

function buildYoyMomOption(
  data: { yoy: TrendDataPoint[]; mom: TrendDataPoint[] },
): { option: EChartsOption; anomalies: string[] } {
  const metrics = data.yoy.map((d) => d.seriesName);
  const anomalies: string[] = [];

  for (let i = 0; i < data.yoy.length; i++) {
    if (data.yoy[i].value < 0 || data.mom[i].value < 0) {
      anomalies.push(data.yoy[i].seriesName);
    }
  }

  const option: EChartsOption = {
    title: { text: '同比 / 环比对比', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['同比', '环比'], top: 30 },
    grid: { left: 100, right: 40, top: 70, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: metrics,
    },
    series: [
      {
        name: '同比',
        type: 'bar',
        data: data.yoy.map((d) => ({
          value: d.value,
          itemStyle: {
            color: d.value >= 0 ? '#22C55E' : '#F97316',
            borderColor: anomalies.includes(d.seriesName)
              ? '#F97316'
              : 'transparent',
            borderWidth: anomalies.includes(d.seriesName) ? 2 : 0,
          },
        })),
      },
      {
        name: '环比',
        type: 'bar',
        data: data.mom.map((d) => ({
          value: d.value,
          itemStyle: {
            color: d.value >= 0 ? '#22C55E' : '#F97316',
            borderColor: anomalies.includes(d.seriesName)
              ? '#F97316'
              : 'transparent',
            borderWidth: anomalies.includes(d.seriesName) ? 2 : 0,
          },
        })),
      },
    ],
  };

  return { option, anomalies };
}

export default function Home() {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [yoyMomData, setYoyMomData] = useState<{
    yoy: TrendDataPoint[];
    mom: TrendDataPoint[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [kpiRes, trendRes, yoyMomRes] = await Promise.all([
          getKPI(),
          getTrend(),
          getYoyMom(),
        ]);
        setKpiData(kpiRes.data);
        setTrendData(trendRes.data);
        setYoyMomData(yoyMomRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-4 rounded-lg border border-orange-500/20 p-8">
        <span className="text-4xl text-orange-400">⚠</span>
        <p className="text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-cyan-500/20 px-4 py-2 text-sm text-cyan-400 transition-colors hover:bg-cyan-500/30"
        >
          重试
        </button>
      </div>
    );
  }

  const { option: yoyMomOption, anomalies } = yoyMomData
    ? buildYoyMomOption(yoyMomData)
    : { option: {} as EChartsOption, anomalies: [] };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            data={kpi}
            onClick={(d) => navigate(KPI_ROUTES[d.id] ?? '/')}
          />
        ))}
      </div>

      <Chart option={buildTrendOption(trendData)} className="h-96" />

      <div>
        <Chart option={yoyMomOption} className="h-80" />
        {anomalies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {anomalies.map((name) => (
              <span
                key={name}
                className="animate-pulse rounded-md border border-orange-500/60 bg-orange-500/10 px-3 py-1 text-xs text-orange-400"
              >
                ⚠ {name} 异常
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
