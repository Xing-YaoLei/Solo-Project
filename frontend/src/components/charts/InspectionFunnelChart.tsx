import React from 'react';
import ReactECharts from 'echarts-for-react';
import { InspectionFunnelData } from '../../types';

interface InspectionFunnelChartProps {
  data: InspectionFunnelData[];
  height?: number;
  darkMode?: boolean;
}

const InspectionFunnelChart: React.FC<InspectionFunnelChartProps> = ({
  data,
  height = 400,
  darkMode = false,
}) => {
  const colors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const option = {
    backgroundColor,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      top: 0,
      data: data.map((item) => item.name),
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
        max: Math.max(...data.map((item) => item.value)),
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
        data: data.map((item, index) => ({
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
