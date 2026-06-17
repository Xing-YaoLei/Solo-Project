import React from 'react';
import ReactECharts from 'echarts-for-react';
import { RepairDurationData } from '../../types';
import { formatDuration } from '../../utils/format';

interface RepairDurationChartProps {
  data: RepairDurationData[];
  groupBy?: 'worker' | 'type';
  height?: number;
  darkMode?: boolean;
}

const RepairDurationChart: React.FC<RepairDurationChartProps> = ({
  data,
  groupBy = 'worker',
  height = 400,
  darkMode = false,
}) => {
  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const getChartData = () => {
    if (groupBy === 'worker') {
      const workerMap = new Map<string, { avg: number; median: number; count: number }>();
      data.forEach((item) => {
        if (!item.worker_name) return;
        if (!workerMap.has(item.worker_name)) {
          workerMap.set(item.worker_name, { avg: 0, median: 0, count: 0 });
        }
        const entry = workerMap.get(item.worker_name)!;
        entry.avg += item.avg_duration * item.total_orders;
        entry.median += item.median_duration * item.total_orders;
        entry.count += item.total_orders;
      });

      const workers = Array.from(workerMap.keys());
      const avgDurations = workers.map((w) => {
        const e = workerMap.get(w)!;
        return e.count > 0 ? e.avg / e.count : 0;
      });
      const medianDurations = workers.map((w) => {
        const e = workerMap.get(w)!;
        return e.count > 0 ? e.median / e.count : 0;
      });
      const counts = workers.map((w) => workerMap.get(w)!.count);

      return {
        xAxisData: workers,
        series: [
          {
            name: '平均时长',
            type: 'bar' as const,
            data: avgDurations,
            itemStyle: { color: '#1677ff' },
            label: {
              show: true,
              position: 'top' as const,
              formatter: (params: { value: number }) => formatDuration(params.value),
              color: textColor,
            },
          },
          {
            name: '中位数时长',
            type: 'bar' as const,
            data: medianDurations,
            itemStyle: { color: '#52c41a' },
            label: {
              show: true,
              position: 'top' as const,
              formatter: (params: { value: number }) => formatDuration(params.value),
              color: textColor,
            },
          },
          {
            name: '工单数量',
            type: 'line' as const,
            data: counts,
            yAxisIndex: 1,
            itemStyle: { color: '#faad14' },
            smooth: true,
          },
        ],
        yAxis: [
          {
            type: 'value' as const,
            name: '时长(小时)',
            axisLabel: { color: textColor },
            axisLine: { lineStyle: { color: textColor } },
          },
          {
            type: 'value' as const,
            name: '数量',
            axisLabel: { color: textColor },
            axisLine: { lineStyle: { color: textColor } },
          },
        ],
      };
    }

    const typeMap = new Map<string, { avg: number; median: number; count: number }>();
    data.forEach((item) => {
      if (!item.repair_type) return;
      if (!typeMap.has(item.repair_type)) {
        typeMap.set(item.repair_type, { avg: 0, median: 0, count: 0 });
      }
      const entry = typeMap.get(item.repair_type)!;
      entry.avg += item.avg_duration * item.total_orders;
      entry.median += item.median_duration * item.total_orders;
      entry.count += item.total_orders;
    });

    const types = Array.from(typeMap.keys());
    const avgDurations = types.map((t) => {
      const e = typeMap.get(t)!;
      return e.count > 0 ? e.avg / e.count : 0;
    });
    const medianDurations = types.map((t) => {
      const e = typeMap.get(t)!;
      return e.count > 0 ? e.median / e.count : 0;
    });
    const counts = types.map((t) => typeMap.get(t)!.count);

    return {
      xAxisData: types,
      series: [
        {
          name: '平均时长',
          type: 'bar' as const,
          data: avgDurations,
          itemStyle: {
            color: ({ dataIndex }: { dataIndex: number }) => {
              const colors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
              return colors[dataIndex % colors.length];
            },
          },
          label: {
            show: true,
            position: 'top' as const,
            formatter: (params: { value: number }) => formatDuration(params.value),
            color: textColor,
          },
        },
      ],
    };
  };

  const chartData = getChartData();

  const option = {
    backgroundColor,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: unknown) => {
        const paramArray = params as Array<{ seriesName: string; value: number }>;
        return paramArray
          .map((param) => {
            if (param.seriesName.includes('时长')) {
              return `${param.seriesName}: ${formatDuration(param.value)}`;
            }
            return `${param.seriesName}: ${param.value}`;
          })
          .join('<br/>');
      },
    },
    legend: {
      data: chartData.series.map((s) => s.name),
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
      data: chartData.xAxisData,
      axisLabel: { color: textColor, rotate: 45 },
      axisLine: { lineStyle: { color: textColor } },
    },
    yAxis: chartData.yAxis || [
      {
        type: 'value',
        name: '维修时长(小时)',
        axisLabel: { color: textColor },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: { lineStyle: { color: darkMode ? '#333' : '#eee' } },
      },
    ],
    series: chartData.series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default RepairDurationChart;
