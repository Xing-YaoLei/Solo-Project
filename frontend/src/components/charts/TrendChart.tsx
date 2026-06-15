import ReactECharts from 'echarts-for-react';
import type { TrendItem } from '../../types';

interface TrendChartProps {
  data: TrendItem[];
}

const TrendChart = ({ data }: TrendChartProps) => {
  const dates = data.map((d) => d.date);
  const completionRates = data.map((d) => d.completion_rate);

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: '完成率(%)',
      min: 0,
      max: 100,
    },
    series: [
      {
        name: '完成率',
        type: 'line',
        stack: 'Total',
        data: completionRates,
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: '#1890ff',
          width: 2,
        },
        itemStyle: {
          color: '#1890ff',
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: 80,
              lineStyle: { color: '#52c41a', type: 'dashed' },
              label: { formatter: '目标 80%' },
            },
            {
              yAxis: 60,
              lineStyle: { color: '#ff4d4f', type: 'dashed' },
              label: { formatter: '预警线 60%' },
            },
          ],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default TrendChart;
