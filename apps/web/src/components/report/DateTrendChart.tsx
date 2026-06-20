'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { DateTrendStats } from '@scenic/shared';

interface DateTrendChartProps {
  data: DateTrendStats[];
  loading?: boolean;
}

export default function DateTrendChart({ data, loading }: DateTrendChartProps) {
  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['工单数', '已解决', '超时'],
        bottom: 0,
        textStyle: {
          color: '#64748b',
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((d) => d.date),
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
          name: '工单数',
          type: 'line',
          smooth: true,
          data: data.map((d) => d.total),
          itemStyle: { color: '#1e3a5f' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30, 58, 95, 0.25)' },
                { offset: 1, color: 'rgba(30, 58, 95, 0.02)' },
              ],
            },
          },
        },
        {
          name: '已解决',
          type: 'line',
          smooth: true,
          data: data.map((d) => d.resolved),
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
        },
        {
          name: '超时',
          type: 'line',
          smooth: true,
          data: data.map((d) => d.overdue),
          itemStyle: { color: '#ef4444' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.15)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
              ],
            },
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
