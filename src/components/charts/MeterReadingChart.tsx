import { useMemo } from 'react';
import useECharts from '../../hooks/useECharts';
import type { MeterReading } from '../../../shared/types';
import type { EChartsOption } from 'echarts';

interface MeterReadingChartProps {
  data: MeterReading[];
  height?: string;
}

export default function MeterReadingChart({
  data,
  height = '350px',
}: MeterReadingChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = Array.from(new Set(data.map((d) => d.date))).sort();
    const properties = Array.from(new Set(data.map((d) => d.propertyName)));

    const waterSeries = properties.map((prop) => {
      const propData = data.filter((d) => d.propertyName === prop);
      return {
        name: `${prop} - 用水`,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 0,
        lineStyle: { width: 2 },
        itemStyle: {
          color: '#3B82F6',
        },
        data: dates.map((date) => {
          const item = propData.find((d) => d.date === date);
          return item ? item.waterUsage : null;
        }),
        markPoint: {
          data: propData
            .filter((d) => d.isAnomaly)
            .map((d) => ({
              name: '异常',
              coord: [d.date, d.waterUsage],
              value: '异常',
              itemStyle: { color: '#EF4444' },
            })),
        },
      };
    });

    const elecSeries = properties.map((prop) => {
      const propData = data.filter((d) => d.propertyName === prop);
      return {
        name: `${prop} - 用电`,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 1,
        lineStyle: { width: 2, type: 'dashed' as const },
        itemStyle: {
          color: '#F97316',
        },
        data: dates.map((date) => {
          const item = propData.find((d) => d.date === date);
          return item ? item.electricityUsage : null;
        }),
        markPoint: {
          data: propData
            .filter((d) => d.isAnomaly)
            .map((d) => ({
              name: '异常',
              coord: [d.date, d.electricityUsage],
              value: '异常',
              itemStyle: { color: '#EF4444' },
            })),
        },
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#94A3B8' },
        },
      },
      legend: {
        data: [...waterSeries.map((s) => s.name), ...elecSeries.map((s) => s.name)],
        bottom: 0,
        textStyle: { color: '#64748B', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 12 },
      },
      yAxis: [
        {
          type: 'value',
          name: '用水量(吨)',
          nameTextStyle: { color: '#64748B', fontSize: 12 },
          axisLine: { show: true, lineStyle: { color: '#3B82F6' } },
          axisLabel: { color: '#64748B', fontSize: 12 },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '用电量(度)',
          nameTextStyle: { color: '#64748B', fontSize: 12 },
          axisLine: { show: true, lineStyle: { color: '#F97316' } },
          axisLabel: { color: '#64748B', fontSize: 12 },
          splitLine: { show: false },
        },
      ],
      series: [...waterSeries, ...elecSeries],
    };
  }, [data]);

  const { chartRef } = useECharts(option, [data]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}
