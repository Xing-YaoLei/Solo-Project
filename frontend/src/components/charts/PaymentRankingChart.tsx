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
  const sortedData = [...data].sort((a, b) => b.total_amount - a.total_amount).slice(0, topN);
  const keys = sortedData.map((item) => item.key);
  const amounts = sortedData.map((item) => item.total_amount);
  const dimensions = sortedData.map((item) => item.dimension);

  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const dimColors: Record<string, string> = {};
  const colorPalette = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
  const uniqueDims = Array.from(new Set(dimensions));
  uniqueDims.forEach((dim, index) => {
    dimColors[dim] = colorPalette[index % colorPalette.length];
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
        const dim = dimensions[keys.indexOf(param.name)];
        const item = sortedData.find((d) => d.key === param.name);
        return `${param.name}<br/>维度: ${dim}<br/>金额: ${formatMoney(param.value)}<br/>交易次数: ${item?.transaction_count || 0}`;
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
      data: keys,
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor } },
    },
    series: [
      {
        name: '收款金额',
        type: 'bar',
        data: sortedData.map((item) => ({
          value: item.total_amount,
          itemStyle: { color: dimColors[item.dimension] },
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
