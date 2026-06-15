import React from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';

interface TrendDataPoint {
  date: string;
  completionRate: number;
  practiceCount: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, title = '完成率与练习次数趋势' }) => {
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'left',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: {
        color: '#e2e8f0',
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#64748b',
        },
      },
    },
    legend: {
      data: ['完成率', '练习次数'],
      right: 0,
      top: 0,
      textStyle: {
        color: '#94a3b8',
      },
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
      data: data.map((d) => d.date),
      axisLine: {
        lineStyle: {
          color: '#475569',
        },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '完成率(%)',
        min: 0,
        max: 100,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3b82f6',
          },
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(71, 85, 105, 0.3)',
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: '练习次数',
        min: 0,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#10b981',
          },
        },
        axisLabel: {
          color: '#94a3b8',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '完成率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#60a5fa' },
            { offset: 1, color: '#3b82f6' },
          ]),
        },
        itemStyle: {
          color: '#3b82f6',
          borderWidth: 2,
          borderColor: '#0f172a',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
          ]),
        },
        data: data.map((d) => d.completionRate),
      },
      {
        name: '练习次数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#34d399' },
            { offset: 1, color: '#10b981' },
          ]),
        },
        itemStyle: {
          color: '#10b981',
          borderWidth: 2,
          borderColor: '#0f172a',
        },
        data: data.map((d) => d.practiceCount),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '380px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default TrendChart;
