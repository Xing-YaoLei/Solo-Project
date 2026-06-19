import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { HeatmapData } from '../../types';

interface HeatmapChartProps {
  data: HeatmapData;
  height?: number;
}

export function HeatmapChart({ data, height = 300 }: HeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const maxCount = Math.max(...data.heatmapData.map(d => d[2] as number), 1);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(10, 25, 41, 0.9)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          return `${data.hours[params.value[0]]} - ${data.days[params.value[1]]}<br/>客诉数: ${params.value[2]}`;
        },
      },
      grid: {
        left: '8%',
        right: '4%',
        bottom: '10%',
        top: '5%',
      },
      xAxis: {
        type: 'category',
        data: data.hours,
        splitArea: { show: true },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      },
      yAxis: {
        type: 'category',
        data: data.days,
        splitArea: { show: true },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        textStyle: { color: 'rgba(255,255,255,0.5)' },
        inRange: {
          color: ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#f59e0b', '#ef4444'],
        },
      },
      series: [{
        name: '客诉数',
        type: 'heatmap',
        data: data.heatmapData,
        label: {
          show: true,
          color: '#fff',
          fontSize: 10,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }],
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

export default HeatmapChart;
