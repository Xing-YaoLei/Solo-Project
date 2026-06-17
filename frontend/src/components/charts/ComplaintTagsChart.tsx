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
  const months = Array.from(new Set(data.map((item) => item.month))).sort();
  const tags = Array.from(new Set(data.map((item) => item.tag)));

  const tagColors: Record<string, string> = {
    '响应慢': '#f5222d',
    '态度差': '#faad14',
    '设施': '#1677ff',
    '保洁': '#52c41a',
    '噪音': '#722ed1',
    '施工': '#13c2c2',
    '邻里': '#eb2f96',
    '异味': '#fa8c16',
    '安全': '#a0d911',
    '其他': '#8c8c8c',
  };

  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const series = tags.map((tag) => ({
    name: tag,
    type: chartType === 'stacked' ? ('bar' as const) : ('line' as const),
    stack: chartType === 'stacked' ? 'complaint' : undefined,
    smooth: chartType !== 'stacked',
    data: months.map((month) => {
      const item = data.find((d) => d.month === month && d.tag === tag);
      return item?.count || 0;
    }),
    itemStyle: { color: tagColors[tag] || '#8c8c8c' },
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
      data: tags,
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
      data: months,
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
