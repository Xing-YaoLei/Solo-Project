import ReactECharts from 'echarts-for-react';
import type { QuoteCandlePoint, SyncDelayInfo } from '@shared/types';
import { cn } from '@/lib/utils';
import { buildDelayMarkOptions } from '../DelayMarkArea';
import { CandlestickChart } from 'lucide-react';

interface Props {
  data: QuoteCandlePoint[];
  delays: SyncDelayInfo[];
  className?: string;
  compact?: boolean;
}

export function QuoteCandleChart({ data, delays, className, compact }: Props) {
  const dates = data.map((d) => d.date.slice(5));
  const marks = buildDelayMarkOptions(delays, data.map((d) => d.date));
  const upColor = '#EF4444';
  const downColor = '#10B981';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 32, 41, 0.95)',
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      axisPointer: { type: 'cross', lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    legend: compact ? undefined : {
      top: 4,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 10,
      data: ['K线', '成交量', '成交价'],
    },
    grid: compact
      ? { left: 40, right: 20, top: 15, bottom: 25 }
      : [
          { left: 50, right: 30, top: 40, height: '55%' },
          { left: 50, right: 30, top: '72%', height: '20%' },
        ],
    xAxis: compact
      ? {
          type: 'category',
          data: dates,
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
          axisLabel: { color: '#94a3b8', fontSize: 9, interval: 4 },
          axisTick: { show: false },
        }
      : [
          {
            type: 'category',
            data: dates,
            gridIndex: 0,
            axisLine: { show: false },
            axisLabel: { show: false },
            axisTick: { show: false },
          },
          {
            type: 'category',
            data: dates,
            gridIndex: 1,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            axisTick: { show: false },
          },
        ],
    yAxis: compact
      ? {
          type: 'value',
          scale: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#94a3b8', fontSize: 9, formatter: (v: number) => (v / 10000).toFixed(0) + 'w' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
        }
      : [
          {
            type: 'value',
            scale: true,
            gridIndex: 0,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => (v / 10000).toFixed(0) + '万' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
          },
          {
            type: 'value',
            gridIndex: 1,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            splitLine: { show: false },
          },
        ],
    series: compact
      ? [
          {
            type: 'candlestick',
            data: data.map((d) => [d.open, d.close, d.low, d.high]),
            itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
            markArea: marks.markArea,
            markLine: marks.markLine,
          },
        ]
      : [
          {
            name: 'K线',
            type: 'candlestick',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: data.map((d) => [d.open, d.close, d.low, d.high]),
            itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
            markArea: marks.markArea,
            markLine: marks.markLine,
          },
          {
            name: '成交价',
            type: 'scatter',
            xAxisIndex: 0,
            yAxisIndex: 0,
            symbol: 'path://M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            symbolSize: 18,
            data: data
              .map((d, i) => (d.dealPrice ? { value: [i, d.dealPrice] } : null))
              .filter(Boolean),
            itemStyle: { color: '#EF4444', borderColor: '#fff', borderWidth: 1.5, shadowBlur: 10, shadowColor: 'rgba(239,68,68,0.5)' },
            z: 10,
          },
          {
            name: '成交量',
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: data.map((d, i) => ({
              value: d.volume,
              itemStyle: { color: d.close >= d.open ? upColor + '99' : downColor + '99' },
            })),
            barWidth: '55%',
          },
        ],
  };

  if (compact) {
    return (
      <div className={cn('w-full', className)}>
        <ReactECharts option={option} style={{ height: 180, width: '100%' }} />
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-2xl bg-surface-card border border-surface-border overflow-hidden p-4', className)}>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
            <CandlestickChart size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">报价历史波动</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">K线 + 成交量 + 成交标记</p>
          </div>
        </div>
        <span className="text-[11px] text-slate-500">近30天</span>
      </div>
      <ReactECharts option={option} style={{ height: 400, width: '100%' }} />
    </div>
  );
}
