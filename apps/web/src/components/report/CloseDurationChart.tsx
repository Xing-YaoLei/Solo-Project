'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { CloseDurationStats } from '@scenic/shared';
import { formatDuration } from '@/lib/utils';

interface CloseDurationChartProps {
  data: CloseDurationStats[];
  loading?: boolean;
}

export default function CloseDurationChart({ data, loading }: CloseDurationChartProps) {
  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const stat = data[item.dataIndex];
          return `<div class="font-medium">${item.name}</div>
            <div>工单数量：${stat?.count || 0}</div>
            <div>平均时长：${stat ? formatDuration(stat.avgMinutes) : '-'}</div>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.range),
        axisLabel: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: { color: '#e2e8f0' },
        },
      },
      yAxis: {
        type: 'value',
        name: '工单数量',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: { color: '#f1f5f9' },
        },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d, idx) => ({
            value: d.count,
            itemStyle: {
              color: idx === data.length - 1 ? '#ef4444' : '#1e3a5f',
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '50%',
          label: {
            show: true,
            position: 'top',
            color: '#1e293b',
            fontSize: 12,
          },
        },
      ],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500">
        加载中...
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 320 }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
