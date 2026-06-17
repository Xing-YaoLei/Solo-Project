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
  const dates = Array.from(new Set(data.map((item) => item.date))).sort();
  const areas = Array.from(new Set(data.map((item) => item.area)));

  const getOption = () => {
    const textColor = darkMode ? '#ccc' : '#333';
    const backgroundColor = darkMode ? '#141414' : '#fff';

    if (chartType === 'boxplot') {
      const waterBoxData = areas.map((area) => {
        const areaData = data.filter((item) => item.area === area).map((item) => item.water);
        return [
          Math.min(...areaData),
          areaData.sort((a, b) => a - b)[Math.floor(areaData.length * 0.25)],
          areaData.sort((a, b) => a - b)[Math.floor(areaData.length * 0.5)],
          areaData.sort((a, b) => a - b)[Math.floor(areaData.length * 0.75)],
          Math.max(...areaData),
        ];
      });

      const electricityBoxData = areas.map((area) => {
        const areaData = data.filter((item) => item.area === area).map((item) => item.electricity);
        return [
          Math.min(...areaData),
          areaData.sort((a, b) => a - b)[Math.floor(areaData.length * 0.25)],
          areaData.sort((a, b) => a - b)[Math.floor(areaData.length * 0.5)],
          areaData.sort((a, b) => a - b)[Math.floor(areaData.length * 0.75)],
          Math.max(...areaData),
        ];
      });

      return {
        backgroundColor,
        tooltip: {
          trigger: 'item',
          axisPointer: {
            type: 'shadow',
          },
        },
        legend: {
          data: ['水读数', '电读数'],
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
          data: areas,
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: textColor } },
        },
        yAxis: {
          type: 'value',
          name: '读数',
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: textColor } },
          splitLine: { lineStyle: { color: darkMode ? '#333' : '#eee' } },
        },
        series: [
          {
            name: '水读数',
            type: 'boxplot',
            data: waterBoxData,
            itemStyle: { color: '#1677ff', borderColor: '#1677ff' },
          },
          {
            name: '电读数',
            type: 'boxplot',
            data: electricityBoxData,
            itemStyle: { color: '#faad14', borderColor: '#faad14' },
          },
        ],
      };
    }

    const waterSeries = areas.map((area) => ({
      name: `${area}-水`,
      type: 'bar' as const,
      stack: 'water',
      data: dates.map((date) => {
        const item = data.find((d) => d.date === date && d.area === area);
        return item?.water || 0;
      }),
    }));

    const electricitySeries = areas.map((area) => ({
      name: `${area}-电`,
      type: 'bar' as const,
      stack: 'electricity',
      data: dates.map((date) => {
        const item = data.find((d) => d.date === date && d.area === area);
        return item?.electricity || 0;
      }),
    }));

    return {
      backgroundColor,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: [...areas.map((a) => `${a}-水`), ...areas.map((a) => `${a}-电`)],
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
        data: dates,
        axisLabel: { color: textColor, rotate: 45 },
        axisLine: { lineStyle: { color: textColor } },
      },
      yAxis: {
        type: 'value',
        name: '读数',
        axisLabel: { color: textColor },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: { lineStyle: { color: darkMode ? '#333' : '#eee' } },
      },
      series: [...waterSeries, ...electricitySeries],
    };
  };

  return (
    <ReactECharts
      option={getOption()}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default WaterElectricityChart;
