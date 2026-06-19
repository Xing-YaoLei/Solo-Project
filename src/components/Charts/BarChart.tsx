import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface BarChartData {
  categories: string[];
  series: {
    name: string;
    data: number[];
    color?: string;
    type?: string;
  }[];
}

interface BarChartProps {
  data: BarChartData;
  height?: number;
  horizontal?: boolean;
}

export function BarChart({ data, height = 350, horizontal = false }: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const defaultColors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 25, 41, 0.9)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: data.series.map(s => s.name),
        textStyle: { color: 'rgba(255,255,255,0.7)' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: horizontal ? 'value' : 'category',
        data: horizontal ? undefined : data.categories,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      yAxis: {
        type: horizontal ? 'category' : 'value',
        data: horizontal ? data.categories : undefined,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      series: data.series.map((s, idx) => ({
        name: s.name,
        type: (s.type || 'bar') as 'bar',
        data: s.data,
        itemStyle: {
          color: s.color || defaultColors[idx % defaultColors.length],
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        barMaxWidth: 40,
      })) as echarts.BarSeriesOption[],
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
  }, [data, horizontal]);

  return <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />;
}

export default BarChart;
