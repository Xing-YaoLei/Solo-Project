import { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { RefreshCw, BarChart3, PieChart } from 'lucide-react';
import SeatHeatmapChart from '@/components/charts/SeatHeatmapChart';
import CheckinTrendChart from '@/components/charts/CheckinTrendChart';
import type { SeatHeatmapItem, CompareMode } from '@/types';
import { seatmapApi } from '@/api/modules/seatmap';
import { cn } from '@/lib/utils';

const COMPARE_CHIPS: { key: CompareMode; label: string }[] = [
  { key: 'none', label: '无对比' },
  { key: 'yoy', label: '同比' },
  { key: 'mom', label: '环比' },
];

const ZONE_NAMES = [
  'A区-主看台VIP', 'B区-东侧看台', 'C区-西侧看台', 'D区-南看台',
  'E区-北看台', 'F区-内场前区', 'G区-内场中区', 'H区-内场后区',
  'I区-包厢层', 'J区-站台区',
];

function generateZoneRankData() {
  return ZONE_NAMES.map((name, idx) => ({
    name,
    value: 120 + Math.floor(Math.random() * 480),
    rate: 0.3 + Math.random() * 0.65,
    diff: -0.18 + Math.random() * 0.32,
    idx,
  })).sort((a, b) => b.value - a.value);
}

function generateDistributionData() {
  return [
    { name: '热销 (≥75%)', value: 2 + Math.floor(Math.random() * 2), color: '#FF3D57' },
    { name: '良好 (60-75%)', value: 2 + Math.floor(Math.random() * 2), color: '#FF8A00' },
    { name: '正常 (40-60%)', value: 2 + Math.floor(Math.random() * 2), color: '#00D4FF' },
    { name: '待提升 (20-40%)', value: 1 + Math.floor(Math.random() * 2), color: '#00E396' },
    { name: '低迷 (<20%)', value: Math.floor(Math.random() * 2), color: '#8B5CF6' },
  ].filter((d) => d.value > 0);
}

export default function SeatmapPage() {
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [heatmapData, setHeatmapData] = useState<SeatHeatmapItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [zoneRankData] = useState(generateZoneRankData);
  const [distributionData] = useState(generateDistributionData);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await seatmapApi.getHeatmap();
      if (res && Array.isArray(res)) {
        setHeatmapData(res);
      }
    } catch {
      const mock: SeatHeatmapItem[] = [];
      const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      zones.forEach((z) => {
        for (let r = 0; r < 15; r++) {
          for (let s = 0; s < 20; s++) {
            mock.push({
              areaCode: `${z}-${r}-${s}`,
              areaName: `${z}区-${r + 1}排-${s + 1}座`,
              totalSeats: 1,
              soldSeats: Math.random() > 0.35 ? 1 : 0,
              salesRate: Math.random() * 0.8 + 0.2,
              section: `${z}区`,
              status: Math.random() > 0.35 ? 'sold' : 'available',
              price: 280 + Math.floor(Math.random() * 1500),
            } as any);
          }
        }
      });
      setHeatmapData(mock);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  const zoneRankOption = useMemo<EChartsOption>(() => {
    const sorted = [...zoneRankData].reverse();
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 8,
        left: 10,
        right: 50,
        bottom: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: unknown) => {
          const p = (params as { data: { name: string; value: number; rate: number; diff: number } }[])[0];
          const d = p.data;
          const diffColor = d.diff >= 0 ? '#00E396' : '#FF3D57';
          const diffSign = d.diff >= 0 ? '+' : '';
          return `<div style="font-weight:600;color:#00F0FF;margin-bottom:6px">${d.name}</div>
                  <div>销量：<b>${d.value}</b> 张</div>
                  <div>销售率：<b style="color:#00D4FF">${(d.rate * 100).toFixed(1)}%</b></div>
                  <div>环比：<b style="color:${diffColor}">${diffSign}${(d.diff * 100).toFixed(1)}%</b></div>`;
        },
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((d) => d.name.replace('区-', '·').replace('看台', '')),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((d) => ({
            value: d.value,
            ...d,
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: d.diff >= 0 ? 'rgba(0, 212, 255, 0.55)' : 'rgba(255, 138, 0, 0.55)' },
                  { offset: 1, color: d.diff >= 0 ? 'rgba(0, 212, 255, 0.95)' : 'rgba(255, 138, 0, 0.95)' },
                ],
              },
              borderRadius: [0, 4, 4, 0],
            },
          })) as any,
          barWidth: 14,
          label: {
            show: true,
            position: 'right',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 11,
            fontWeight: 600,
            formatter: (p: any) => `${p.data.value}`,
          },
        },
      ] as any,
    } as EChartsOption;
  }, [zoneRankData]);

  const distributionOption = useMemo<EChartsOption>(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(6, 18, 41, 0.95)',
      borderColor: 'rgba(0, 212, 255, 0.4)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `<div style="font-weight:600;color:#00F0FF;margin-bottom:4px">${p.name}</div>
                <div>区域数：<b>${p.value}</b> 个</div>
                <div>占比：<b style="color:#00D4FF">${p.percent}%</b></div>`;
      },
    },
    legend: {
      show: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 10,
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: 'rgba(6, 18, 41, 0.9)',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
          },
          itemStyle: {
            shadowBlur: 16,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: { show: false },
        data: distributionData.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color },
        })),
      },
    ],
  }), [distributionData]);

  const totalStats = useMemo(() => {
    const total = zoneRankData.reduce((s, d) => s + d.value, 0);
    const avgRate = zoneRankData.reduce((s, d) => s + d.rate, 0) / zoneRankData.length;
    return { total, avgRate };
  }, [zoneRankData]);

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-4">
            <h2 className="panel-title">场馆座位热力分析</h2>
            <div className="flex items-center gap-1.5 bg-ocean-dark/60 rounded-full p-0.5 border border-panel-border/60">
              {COMPARE_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setCompareMode(chip.key)}
                  className={cn(
                    'px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200',
                    compareMode === chip.key
                      ? 'bg-cyan-primary/20 text-cyan-glow shadow-glow-cyan'
                      : 'text-white/60 hover:text-white/85'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="stat-label">总销量</span>
                <span className="stat-value text-base glow-text">{totalStats.total.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="stat-label">平均销售率</span>
                <span className="stat-value text-base text-green-success">{(totalStats.avgRate * 100).toFixed(1)}%</span>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                'bg-cyan-primary/10 border border-cyan-primary/30 text-cyan-glow',
                'hover:bg-cyan-primary/20 hover:shadow-glow-cyan',
                refreshing && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              刷新数据
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title text-base">座位销售热力图</h3>
            </div>
            <div className="panel-body" style={{ height: '500px' }}>
              <SeatHeatmapChart
                heatmapData={heatmapData}
                compareMode={compareMode}
                onCompareModeChange={setCompareMode}
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
          <div className="panel flex-1">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-primary" />
                <h3 className="panel-title text-base">区域销售排行</h3>
              </div>
            </div>
            <div className="panel-body" style={{ height: '260px' }}>
              <ReactECharts
                option={zoneRankOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>

          <div className="panel flex-1">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-sponsor" />
                <h3 className="panel-title text-base">销售率分布</h3>
              </div>
            </div>
            <div className="panel-body" style={{ height: '200px' }}>
              <ReactECharts
                option={distributionOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title text-base">签到核销趋势（近30天）</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-primary/80" />
              <span className="text-white/60">生成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-success" />
              <span className="text-white/60">核销</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-purple-sponsor" />
              <span className="text-white/60">同比生成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dotted border-orange-warning" />
              <span className="text-white/60">环比核销</span>
            </div>
          </div>
        </div>
        <div className="panel-body" style={{ height: '320px' }}>
          <CheckinTrendChart />
        </div>
      </div>
    </div>
  );
}
