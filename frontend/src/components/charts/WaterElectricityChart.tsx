import React from 'react';
import ReactECharts from 'echarts-for-react';
import { WaterElectricityData } from '../../types';

interface WaterElectricityChartProps {
  data: WaterElectricityData[];
  chartType?: 'bar' | 'boxplot';
  height?: number;
  darkMode?: boolean;
}

const WaterElectricityChart: React.FC<WaterElectricityChartProps> = ({
  data,
  chartType = 'bar',
  height = 400,
  darkMode = false,
}) => {
  const months = Array.from(new Set(data.map((item) => item.month))).sort();
  const districts = Array.from(new Set(data.map((item) => item.district)));

  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const waterSeries = districts.map((district) => ({
    name: `${district}-水`,
    type: 'bar' as const,
    stack: 'water',
    data: months.map((month) => {
      const item = data.find((d) => d.month === month && d.district === district);
      return item?.avg_water || 0;
    }),
  }));

  const electricitySeries = districts.map((district) => ({
    name: `${district}-电`,
    type: 'bar' as const,
    stack: 'electricity',
    data: months.map((month) => {
      const item = data.find((d) => d.month === month && d.district === district);
      return item?.avg_electricity || 0;
    }),
  }));

  const gasSeries = districts.map((district) => ({
    name: `${district}-燃气`,
    type: 'bar' as const,
    stack: 'gas',
    data: months.map((month) => {
      const item = data.find((d) => d.month === month && d.district === district);
      return item?.avg_gas || 0;
    }),
  }));

  const option = {
    backgroundColor,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: [...districts.map((d) => `${d}-水`), ...districts.map((d) => `${d}-电`), ...districts.map((d) => `${d}-燃气`)],
      textStyle: { color: textColor },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: textColor, rotate: 45 },
      axisLine: { lineStyle: { color: textColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: '水/燃气读数',
        position: 'left' as const,
        axisLabel: { color: textColor },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: { lineStyle: { color: darkMode ? '#333' : '#eee' } },
      },
      {
        type: 'value',
        name: '电读数',
        position: 'right' as const,
        axisLabel: { color: textColor },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: { show: false },
      },
    ],
    series: [...waterSeries, ...gasSeries, ...electricitySeries.map((s) => ({ ...s, yAxisIndex: 1 }))],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default WaterElectricityChart;
