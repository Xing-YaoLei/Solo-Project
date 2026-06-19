import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { TrendData } from '../../types';

interface TrendChartProps {
  data: TrendData;
  height?: number;
}

export function TrendChart({ data, height = 350 }: TrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 25, 41, 0.9)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        textStyle: { color: '#fff' },
      },
      legend: {
        data: ['客诉数', '同比上期', '超时数', '升级数'],
        textStyle: { color: 'rgba(255,255,255,0.7)' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.dates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      series: [
        {
          name: '客诉数',
          type: 'line',
          smooth: true,
          data: data.counts,
          lineStyle: { color: '#3b82f6', width: 3 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ]),
          },
        },
        {
          name: '同比上期',
          type: 'line',
          smooth: true,
          data: data.prevCounts,
          lineStyle: { color: '#8b5cf6', width: 2, type: 'dashed' },
          itemStyle: { color: '#8b5cf6' },
        },
        {
          name: '超时数',
          type: 'line',
          smooth: true,
          data: data.overdueCounts,
          lineStyle: { color: '#ef4444', width: 2 },
          itemStyle: { color: '#ef4444' },
        },
        {
          name: '升级数',
          type: 'line',
          smooth: true,
          data: data.escalatedCounts,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
        },
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data]);

  return <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />;
}

export default TrendChart;
