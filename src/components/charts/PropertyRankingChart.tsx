import { useMemo, useState } from 'react';
import useECharts from '../../hooks/useECharts';
import type { PropertyRanking } from '../../../shared/types';
import type { EChartsOption } from 'echarts';

interface PropertyRankingChartProps {
  data: PropertyRanking[];
  metric?: 'repair' | 'complaint';
  height?: string;
}

export default function PropertyRankingChart({
  data,
  metric = 'repair',
  height = '400px',
}: PropertyRankingChartProps) {
  const [mode, setMode] = useState<'absolute' | 'ratio'>('absolute');

  const option = useMemo<EChartsOption>(() => {
    const sortedData = [...data].sort((a, b) => {
      if (metric === 'repair') {
        return mode === 'absolute'
          ? b.repairCount - a.repairCount
          : b.repairRate - a.repairRate;
      }
      return mode === 'absolute'
        ? b.complaintCount - a.complaintCount
        : b.complaintRate - a.complaintRate;
    });

    const names = sortedData.map((d) => d.propertyName);
    const values = sortedData.map((d) =>
      metric === 'repair'
        ? mode === 'absolute'
          ? d.repairCount
          : d.repairRate
        : mode === 'absolute'
        ? d.complaintCount
        : d.complaintRate
    );

    const unit = mode === 'absolute' ? '次' : '%';
    const color = metric === 'repair' ? '#3B82F6' : '#F97316';

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const param = params[0];
          const item = sortedData[param.dataIndex];
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${item.propertyName}</div>
            <div>区域: ${item.area}</div>
            <div>${metric === 'repair' ? '维修' : '投诉'}${mode === 'absolute' ? '次数' : '率'}: ${param.value}${unit}</div>
            <div style="margin-top: 4px; color: #64748B; font-size: 11px;">
              ${mode === 'absolute' ? '（绝对值）' : '（占比）'}
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 12 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 12 },
      },
      series: [
        {
          name: metric === 'repair' ? '维修次数' : '投诉次数',
          type: 'bar',
          barWidth: '60%',
          data: values,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: color },
                { offset: 1, color: `${color}CC` },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: `${color}66`,
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: `{c}${unit}`,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#334155',
          },
        },
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [data, metric, mode]);

  const { chartRef } = useECharts(option, [data, metric, mode]);

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setMode('absolute')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'absolute'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          绝对值
        </button>
        <button
          onClick={() => setMode('ratio')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'ratio'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          占比
        </button>
      </div>
      <div ref={chartRef} style={{ width: '100%', height }} />
    </div>
  );
}
