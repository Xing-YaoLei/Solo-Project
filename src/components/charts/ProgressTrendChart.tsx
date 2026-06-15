import React from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';

interface ProgressData {
  date: string;
  className: string;
  progress: number;
}

interface ProgressTrendChartProps {
  data: ProgressData[];
}

const ProgressTrendChart: React.FC<ProgressTrendChartProps> = ({ data }) => {
  const dates = [...new Set(data.map((d) => d.date))].sort();
  const classes = [...new Set(data.map((d) => d.className))];

  const colors = [
    { main: '#3b82f6', light: 'rgba(59, 130, 246, 0.3)' },
    { main: '#10b981', light: 'rgba(16, 185, 129, 0.3)' },
    { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.3)' },
    { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.3)' },
    { main: '#ef4444', light: 'rgba(239, 68, 68, 0.3)' },
  ];

  const series = classes.map((className, index) => {
    const color = colors[index % colors.length];
    const classData = dates.map((date) => {
      const item = data.find((d) => d.date === date && d.className === className);
      return item?.progress || null;
    });

    return {
      name: className,
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        width: 0,
      },
      showSymbol: false,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color.main + 'cc' },
          { offset: 1, color: color.main + '10' },
        ]),
      },
      emphasis: {
        focus: 'series',
      },
      data: classData,
    };
  });

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '学习进度变化',
      left: 'left',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: 600,
      },
      subtext: '各班级学习进度趋势对比',
      subtextStyle: {
        color: '#64748b',
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: {
        color: '#e2e8f0',
      },
    },
    legend: {
      data: classes,
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
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
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
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          color: '#475569',
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
    series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '380px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default ProgressTrendChart;
