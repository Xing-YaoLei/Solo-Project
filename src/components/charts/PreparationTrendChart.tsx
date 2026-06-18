import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { PreparationTrendPoint, SyncDelayInfo } from '@shared/types';
import { cn } from '@/lib/utils';
import { buildDelayMarkOptions } from '../DelayMarkArea';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: PreparationTrendPoint[];
  delays: SyncDelayInfo[];
  className?: string;
}

type RangeKey = '30' | '60' | '90';

export function PreparationTrendChart({ data, delays, className }: Props) {
  const [range, setRange] = useState<RangeKey>('30');

  const sliced = useMemo(() => {
    const n = parseInt(range, 10);
    return data.slice(-n);
  }, [data, range]);

  const dates = sliced.map((d) => d.date.slice(5));
  const marks = buildDelayMarkOptions(delays, sliced.map((d) => d.date));

  const option = {
    backgroundColor: 'transparent',
    legend: {
      top: 4,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 6,
      data: [
        { name: '材料完成率' },
        { name: '平均整备天数' },
        { name: '文档齐备率' },
      ],
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 32, 41, 0.95)',
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      axisPointer: { type: 'cross', lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    grid: { left: 50, right: 55, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: 100,
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
        name: '%',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
      },
      {
        type: 'value',
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}天' },
        splitLine: { show: false },
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        position: 'right',
        offset: 55,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '材料完成率',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: sliced.map((d) => d.completionRate),
        lineStyle: { color: '#3B82F6', width: 2.2 },
        itemStyle: { color: '#3B82F6' },
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.3)' }, { offset: 1, color: 'rgba(59,130,246,0)' }],
          },
        },
        markArea: marks.markArea,
        markLine: marks.markLine,
      },
      {
        name: '平均整备天数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: sliced.map((d) => d.avgDays),
        lineStyle: { color: '#F59E0B', width: 2 },
        itemStyle: { color: '#F59E0B' },
        symbol: 'circle',
        symbolSize: 4,
      },
      {
        name: '文档齐备率',
        type: 'line',
        yAxisIndex: 2,
        smooth: true,
        data: sliced.map((d) => d.documentReadyRate),
        lineStyle: { color: '#10B981', width: 2, type: 'dashed' },
        itemStyle: { color: '#10B981' },
        symbol: 'diamond',
        symbolSize: 5,
      },
    ],
  };

  return (
    <div className={cn('relative rounded-2xl bg-surface-card border border-surface-border overflow-hidden p-4', className)}>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-500">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">整备清单趋势</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">完成率 / 耗时 / 齐备率</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-surface-elevated/60 rounded-lg p-0.5 border border-surface-border">
          {(['30', '60', '90'] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded-md transition-all font-medium',
                range === r ? 'bg-brand-500/20 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {r}天
            </button>
          ))}
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 300, width: '100%' }} />
    </div>
  );
}
