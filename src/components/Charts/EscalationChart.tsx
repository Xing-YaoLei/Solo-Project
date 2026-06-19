import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EscalationTimelineData } from '../../types';

interface EscalationChartProps {
  data: EscalationTimelineData;
  height?: number;
}

export function EscalationChart({ data, height = 300 }: EscalationChartProps) {
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
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['一级升级', '二级升级', '三级升级', '总数'],
        textStyle: { color: 'rgba(255,255,255,0.7)' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: '升级数',
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
          axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        {
          type: 'value',
          name: '总数',
          position: 'right',
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
          axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '一级升级',
          type: 'bar',
          stack: 'total',
          data: data.level1,
          itemStyle: { color: '#22c55e' },
        },
        {
          name: '二级升级',
          type: 'bar',
          stack: 'total',
          data: data.level2,
          itemStyle: { color: '#eab308' },
        },
        {
          name: '三级升级',
          type: 'bar',
          stack: 'total',
          data: data.level3,
          itemStyle: { color: '#ef4444' },
        },
        {
          name: '总数',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: data.totals,
          lineStyle: { color: '#3b82f6', width: 3 },
          itemStyle: { color: '#3b82f6' },
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

export default EscalationChart;
