import ReactECharts from 'echarts-for-react';
import type { FunnelOverview } from '../types';

interface FunnelChartProps {
  data: FunnelOverview | null;
}

const FunnelChart = ({ data }: FunnelChartProps) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)',
    },
    series: [
      {
        name: '教材发放漏斗',
        type: 'funnel',
        left: '10%',
        top: 10,
        bottom: 10,
        width: '80%',
        min: 0,
        max: data?.total_enrolled || 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}人',
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        emphasis: {
          label: {
            fontSize: 16,
          },
        },
        data: data?.funnel_steps?.map((step, index) => ({
          value: step.count,
          name: step.step,
          itemStyle: {
            color: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f'][index % 4],
          },
        })) || [],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default FunnelChart;
