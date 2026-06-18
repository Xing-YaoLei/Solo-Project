import ReactECharts from 'echarts-for-react';
import type { TestDriveDistributionPoint, SyncDelayInfo } from '@shared/types';
import { cn } from '@/lib/utils';
import { buildDelayMarkOptions } from '../DelayMarkArea';
import { Users } from 'lucide-react';

interface Props {
  data: TestDriveDistributionPoint[];
  delays: SyncDelayInfo[];
  className?: string;
}

export function TestDriveDistributionChart({ data, delays, className }: Props) {
  const dates = data.map((d) => d.weekStart.slice(5));
  const marks = buildDelayMarkOptions(delays, data.map((d) => d.weekStart));

  const option = {
    backgroundColor: 'transparent',
    legend: {
      top: 4,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 6,
      data: ['首次试驾', '二次试驾', '三次以上', '转化率', '带材料试驾率'],
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 32, 41, 0.95)',
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      axisPointer: { type: 'cross', lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    grid: { left: 45, right: 50, top: 40, bottom: 40 },
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
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '首次试驾',
        type: 'line',
        stack: 'drive',
        areaStyle: { color: 'rgba(59,130,246,0.55)' },
        lineStyle: { width: 0, color: 'transparent' },
        itemStyle: { color: '#3B82F6' },
        symbol: 'none',
        data: data.map((d) => d.firstTime),
        markArea: marks.markArea,
        markLine: marks.markLine,
      },
      {
        name: '二次试驾',
        type: 'line',
        stack: 'drive',
        areaStyle: { color: 'rgba(139,92,246,0.55)' },
        lineStyle: { width: 0, color: 'transparent' },
        itemStyle: { color: '#8B5CF6' },
        symbol: 'none',
        data: data.map((d) => d.secondTime),
      },
      {
        name: '三次以上',
        type: 'line',
        stack: 'drive',
        areaStyle: { color: 'rgba(236,72,153,0.55)' },
        lineStyle: { width: 0, color: 'transparent' },
        itemStyle: { color: '#EC4899' },
        symbol: 'none',
        data: data.map((d) => d.thirdPlus),
      },
      {
        name: '转化率',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d) => d.conversionRate),
        lineStyle: { color: '#F59E0B', width: 2, type: 'dashed' },
        itemStyle: { color: '#F59E0B' },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '带材料试驾率',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d) => d.withDocumentsRate),
        lineStyle: { color: '#10B981', width: 2, type: 'dashed' },
        itemStyle: { color: '#10B981' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };

  return (
    <div className={cn('relative rounded-2xl bg-surface-card border border-surface-border overflow-hidden p-4', className)}>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">试驾记录分布</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">频次堆叠 + 转化指标</p>
          </div>
        </div>
        <span className="text-[11px] text-slate-500">近12周</span>
      </div>
      <ReactECharts option={option} style={{ height: 300, width: '100%' }} />
    </div>
  );
}
