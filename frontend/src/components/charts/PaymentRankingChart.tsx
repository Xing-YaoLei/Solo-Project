import React from 'react';
import ReactECharts from 'echarts-for-react';
import { PaymentRankingData } from '../../types';
import { formatMoney } from '../../utils/format';

interface PaymentRankingChartProps {
  data: PaymentRankingData[];
  topN?: number;
  height?: number;
  darkMode?: boolean;
}

const PaymentRankingChart: React.FC<PaymentRankingChartProps> = ({
  data,
  topN = 10,
  height = 400,
  darkMode = false,
}) => {
  const sortedData = [...data].sort((a, b) => b.amount - a.amount).slice(0, topN);
  const names = sortedData.map((item) => item.name);
  const amounts = sortedData.map((item) => item.amount);
  const areas = sortedData.map((item) => item.area);

  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const areaColors: Record<string, string> = {};
  const colorPalette = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
  const uniqueAreas = Array.from(new Set(areas));
  uniqueAreas.forEach((area, index) => {
    areaColors[area] = colorPalette[index % colorPalette.length];
  });

  const option = {
    backgroundColor,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: unknown) => {
        const param = (params as Array<{ name: string; value: number; color: string }>)[0];
        const area = areas[names.indexOf(param.name)];
        return `${param.name}<br/>区域: ${area}<br/>金额: ${formatMoney(param.value)}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '金额',
      axisLabel: {
        color: textColor,
        formatter: (value: number) => formatMoney(value),
      },
      axisLine: { lineStyle: { color: textColor } },
      splitLine: { lineStyle: { color: darkMode ? '#333' : '#eee' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor } },
    },
    series: [
      {
        name: '收款金额',
        type: 'bar',
        data: sortedData.map((item) => ({
          value: item.amount,
          itemStyle: { color: areaColors[item.area] },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params: { value: number }) => formatMoney(params.value),
          color: textColor,
        },
        barWidth: '60%',
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

export default PaymentRankingChart;
