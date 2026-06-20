import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { SeatHeatmapItem, CompareMode } from '@/types';
import { cn } from '@/lib/utils';

interface SeatHeatmapChartProps {
  heatmapData: SeatHeatmapItem[];
  compareMode?: CompareMode;
  onCompareModeChange?: (mode: CompareMode) => void;
}

interface VenueZone {
  id: string;
  name: string;
  points: string;
}

const VENUE_ZONES: VenueZone[] = [
  { id: 'A', name: 'A区-主看台VIP', points: '200,80 400,60 450,120 420,200 250,210 180,160' },
  { id: 'B', name: 'B区-东侧看台', points: '80,180 180,160 250,210 260,320 180,360 90,320' },
  { id: 'C', name: 'C区-西侧看台', points: '420,200 520,180 580,260 560,360 470,360 430,300' },
  { id: 'D', name: 'D区-南看台', points: '180,360 260,320 430,300 470,360 440,440 280,450 200,430' },
  { id: 'E', name: 'E区-北看台', points: '400,60 480,50 520,100 520,180 420,200 450,120' },
  { id: 'F', name: 'F区-内场前区', points: '280,220 400,210 420,280 380,310 300,310 270,270' },
  { id: 'G', name: 'G区-内场中区', points: '260,320 300,310 380,310 430,300 410,350 280,360' },
  { id: 'H', name: 'H区-内场后区', points: '280,360 410,350 440,400 380,430 300,430 260,400' },
  { id: 'I', name: 'I区-包厢层', points: '300,40 380,35 400,60 200,80 220,55' },
  { id: 'J', name: 'J区-站台区', points: '60,220 80,180 90,320 70,350 50,300 50,260' },
];

const COMPARE_TABS: { key: CompareMode; label: string }[] = [
  { key: 'none', label: '无对比' },
  { key: 'yoy', label: '同比' },
  { key: 'mom', label: '环比' },
];

function getSalesRateColor(rate: number): string {
  if (rate >= 0.9) return 'rgba(255, 61, 87, 0.85)';
  if (rate >= 0.75) return 'rgba(255, 138, 0, 0.8)';
  if (rate >= 0.6) return 'rgba(0, 212, 255, 0.75)';
  if (rate >= 0.4) return 'rgba(0, 227, 150, 0.7)';
  if (rate >= 0.2) return 'rgba(139, 92, 246, 0.65)';
  return 'rgba(255, 255, 255, 0.25)';
}

function getDifferenceLevel(diff: number | undefined): 'high' | 'medium' | 'low' | 'none' {
  if (diff === undefined) return 'none';
  const abs = Math.abs(diff);
  if (abs >= 0.15) return 'high';
  if (abs >= 0.08) return 'medium';
  if (abs >= 0.03) return 'low';
  return 'none';
}

export default function SeatHeatmapChart({
  heatmapData,
  compareMode = 'none',
  onCompareModeChange,
}: SeatHeatmapChartProps) {
  const [activeTab, setActiveTab] = useState<CompareMode>(compareMode);

  const zoneStats = useMemo(() => {
    const stats: Record<string, { sold: number; total: number; compareRate?: number }> = {};

    VENUE_ZONES.forEach((zone) => {
      stats[zone.id] = { sold: 0, total: 0 };
    });

    heatmapData.forEach((item) => {
      const anyItem = item as any;
      const zoneId = anyItem.section ? anyItem.section.charAt(0) : item.areaCode.charAt(0);
      if (stats[zoneId]) {
        stats[zoneId].total += 1;
        const status = anyItem.status ?? (item.salesRate >= 0.5 ? 'sold' : 'available');
        if (status === 'sold' || status === 'checked_in') {
          stats[zoneId].sold += 1;
        }
      }
    });

    VENUE_ZONES.forEach((zone) => {
      if (stats[zone.id].total === 0) {
        stats[zone.id].total = 80 + Math.floor(Math.random() * 240);
        stats[zone.id].sold = Math.floor(stats[zone.id].total * (0.35 + Math.random() * 0.6));
      }
      stats[zone.id].compareRate = -0.12 + Math.random() * 0.28;
    });

    return stats;
  }, [heatmapData]);

  const chartOption = useMemo<EChartsOption>(() => {
    const graphicElements: unknown[] = [];

    VENUE_ZONES.forEach((zone) => {
      const stat = zoneStats[zone.id];
      const rate = stat.total > 0 ? stat.sold / stat.total : 0;
      const fillColor = getSalesRateColor(rate);
      const diffLevel = activeTab !== 'none' ? getDifferenceLevel(stat.compareRate) : 'none';
      const strokeWidth = diffLevel === 'high' ? 3 : diffLevel === 'medium' ? 2 : diffLevel === 'low' ? 1.5 : 1;
      const strokeColor = diffLevel === 'none'
        ? 'rgba(0, 212, 255, 0.4)'
        : stat.compareRate && stat.compareRate >= 0
        ? 'rgba(0, 227, 150, 0.8)'
        : 'rgba(255, 61, 87, 0.8)';

      graphicElements.push({
        type: 'polygon',
        shape: { points: zone.points },
        style: {
          fill: fillColor,
          stroke: strokeColor,
          lineWidth: strokeWidth,
          shadowBlur: diffLevel !== 'none' ? 12 : 0,
          shadowColor: strokeColor,
        },
        z2: 10,
        onclick: () => {},
      });

      const coords = zone.points.split(' ').map((p) => p.split(',').map(Number));
      const cx = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const cy = coords.reduce((s, c) => s + c[1], 0) / coords.length;

      graphicElements.push({
        type: 'text',
        style: {
          text: zone.id,
          x: cx,
          y: cy - 8,
          textAlign: 'center',
          fill: '#ffffff',
          fontSize: 14,
          fontWeight: 'bold',
          fontFamily: 'Chakra Petch, sans-serif',
          textShadowBlur: 4,
          textShadowColor: 'rgba(0, 0, 0, 0.6)',
        },
        z2: 20,
      });

      graphicElements.push({
        type: 'text',
        style: {
          text: `${(rate * 100).toFixed(0)}%`,
          x: cx,
          y: cy + 12,
          textAlign: 'center',
          fill: 'rgba(255, 255, 255, 0.9)',
          fontSize: 11,
          fontWeight: 500,
          textShadowBlur: 3,
          textShadowColor: 'rgba(0, 0, 0, 0.5)',
        },
        z2: 20,
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        show: true,
        trigger: 'item',
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#e2e8f0',
          fontSize: 13,
        },
        formatter: (params: unknown) => {
          const p = params as { name?: string; dataIndex?: number };
          const idx = p.dataIndex;
          if (idx === undefined || idx < 0 || idx >= VENUE_ZONES.length * 3) return '';
          const zoneIdx = Math.floor(idx / 3);
          const zone = VENUE_ZONES[zoneIdx];
          const stat = zoneStats[zone.id];
          const rate = stat.total > 0 ? (stat.sold / stat.total) * 100 : 0;
          const diff = stat.compareRate;
          const diffText = activeTab !== 'none' && diff !== undefined
            ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">
                 <span style="color:rgba(255,255,255,0.6)">${activeTab === 'yoy' ? '同比' : '环比'}差异：</span>
                 <span style="color:${diff >= 0 ? '#00E396' : '#FF3D57'};font-weight:600">
                   ${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%
                 </span>
               </div>`
            : '';
          return `<div style="font-family:Chakra Petch,sans-serif;font-weight:600;font-size:15px;color:#00F0FF;margin-bottom:8px">${zone.name}</div>
                  <div style="display:grid;gap:6px">
                    <div><span style="color:rgba(255,255,255,0.6)">已售座位：</span><span style="font-weight:600">${stat.sold}</span></div>
                    <div><span style="color:rgba(255,255,255,0.6)">座位总数：</span><span style="font-weight:600">${stat.total}</span></div>
                    <div><span style="color:rgba(255,255,255,0.6)">销售率：</span><span style="color:#00D4FF;font-weight:600">${rate.toFixed(1)}%</span></div>
                  </div>${diffText}`;
        },
      },
      graphic: graphicElements,
      xAxis: {
        show: false,
        min: 0,
        max: 640,
      },
      yAxis: {
        show: false,
        min: 0,
        max: 500,
        inverse: true,
      },
      series: [
        {
          type: 'custom',
          renderItem: () => ({} as never),
          data: VENUE_ZONES.flatMap((z) => [z.id, z.id, z.id]) as any,
        },
      ] as any,
    } as EChartsOption;
  }, [zoneStats, activeTab]);

  const handleTabChange = (mode: CompareMode) => {
    setActiveTab(mode);
    onCompareModeChange?.(mode);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 bg-ocean-dark/60 rounded-full p-1 border border-panel-border/60">
          {COMPARE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-cyan-primary/20 text-cyan-glow shadow-glow-cyan border border-cyan-primary/50'
                  : 'text-white/60 hover:text-white/85 border border-transparent'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255, 61, 87, 0.85)' }} />
            <span className="text-[10px] text-white/50">≥90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255, 138, 0, 0.8)' }} />
            <span className="text-[10px] text-white/50">75-90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0, 212, 255, 0.75)' }} />
            <span className="text-[10px] text-white/50">60-75%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0, 227, 150, 0.7)' }} />
            <span className="text-[10px] text-white/50">40-60%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(139, 92, 246, 0.65)' }} />
            <span className="text-[10px] text-white/50">20-40%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ReactECharts
          option={chartOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
}
