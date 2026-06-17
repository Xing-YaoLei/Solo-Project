import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ComplaintTagsData } from '../../types';

interface ComplaintTagsChartProps {
  data: ComplaintTagsData[];
  chartType?: 'line' | 'stacked';
  height?: number;
  darkMode?: boolean;
}

const ComplaintTagsChart: React.FC<ComplaintTagsChartProps> = ({
  data,
  chartType = 'line',
  height = 400,
  darkMode = false,
}) => {
  const dates = data.map((item) => item.date);
  const tags = ['noise', 'hygiene', 'facilities', 'safety', 'other'] as const;
  const tagNames: Record<string, string> = {
    noise: '噪音',
    hygiene: '卫生',
    facilities: '设施',
    safety: '安全',
    other: '其他',
  };
  const tagColors: Record<string, string> = {
    noise: '#f5222d',
    hygiene: '#faad14',
    facilities: '#1677ff',
    safety: '#52c41a',
    other: '#722ed1',
  };

  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const series = tags.map((tag) => ({
    name: tagNames[tag],
    type: chartType === 'stacked' ? ('bar' as const) : ('line' as const),
    stack: chartType === 'stacked' ? 'complaint' : undefined,
    smooth: chartType !== 'stacked',
    data: data.map((item) => item[tag]),
    itemStyle: { color: tagColors[tag] },
    areaStyle: chartType === 'line' ? { opacity: 0.1 } : undefined,
  }));

  const option = {
    backgroundColor,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: chartType === 'stacked' ? 'shadow' : 'cross',
      },
    },
    legend: {
      data: tags.map((tag) => tagNames[tag]),
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
      boundaryGap: chartType === 'stacked',
      data: dates,
      axisLabel: { color: textColor, rotate: 45 },
      axisLine: { lineStyle: { color: textColor } },
    },
    yAxis: {
      type: 'value',
      name: '投诉数量',
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor } },
      splitLine: { lineStyle: { color: darkMode ? '#333' : '#eee' } },
    },
    series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default ComplaintTagsChart;
