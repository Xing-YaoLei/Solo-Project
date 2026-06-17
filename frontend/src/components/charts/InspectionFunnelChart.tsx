import React from 'react';
import ReactECharts from 'echarts-for-react';
import { InspectionFunnelData } from '../../types';

interface InspectionFunnelChartProps {
  data: InspectionFunnelData[];
  height?: number;
  darkMode?: boolean;
}

const stageLabels: Record<string, string> = {
  applied: '已申请',
  assigned: '已分配',
  inspected: '已验房',
  completed: '已完成',
};

const InspectionFunnelChart: React.FC<InspectionFunnelChartProps> = ({
  data,
  height = 400,
  darkMode = false,
}) => {
  const colors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const chartData = data.map((item) => ({
    name: stageLabels[item.stage] || item.stage,
    value: item.count,
    conversionRate: item.conversion_rate,
  }));

  const option = {
    backgroundColor,
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number; data: { conversionRate?: number } }) => {
        const rate = params.data.conversionRate !== undefined ? ` (转化率 ${params.data.conversionRate}%)` : '';
        return `${params.name}: ${params.value}${rate}`;
      },
    },
    legend: {
      top: 0,
      data: chartData.map((item) => item.name),
      textStyle: { color: textColor },
    },
    series: [
      {
        name: '验房清单',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: Math.max(...data.map((item) => item.count)),
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          color: '#fff',
          fontSize: 12,
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: chartData.map((item, index) => ({
          ...item,
          itemStyle: { color: colors[index % colors.length] },
        })),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default InspectionFunnelChart;
