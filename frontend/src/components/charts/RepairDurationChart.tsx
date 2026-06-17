import React from 'react';
import ReactECharts from 'echarts-for-react';
import { RepairDurationData } from '../../types';
import { formatDuration } from '../../utils/format';

interface RepairDurationChartProps {
  data: RepairDurationData[];
  groupBy?: 'date' | 'worker' | 'type';
  height?: number;
  darkMode?: boolean;
}

const RepairDurationChart: React.FC<RepairDurationChartProps> = ({
  data,
  groupBy = 'date',
  height = 400,
  darkMode = false,
}) => {
  const textColor = darkMode ? '#ccc' : '#333';
  const backgroundColor = darkMode ? '#141414' : '#fff';

  const getChartData = () => {
    if (groupBy === 'date') {
      const dateMap = new Map<string, number[]>();
      data.forEach((item) => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, []);
        }
        dateMap.get(item.date)!.push(item.duration);
      });

      const dates = Array.from(dateMap.keys()).sort();
      const avgDurations = dates.map((date) => {
        const durations = dateMap.get(date)!;
        return durations.reduce((a, b) => a + b, 0) / durations.length;
      });
      const maxDurations = dates.map((date) => Math.max(...dateMap.get(date)!));
      const minDurations = dates.map((date) => Math.min(...dateMap.get(date)!));

      return {
        xAxisData: dates,
        series: [
          {
            name: '平均时长',
            type: 'line' as const,
            smooth: true,
            data: avgDurations,
            itemStyle: { color: '#1677ff' },
            areaStyle: { opacity: 0.1 },
          },
          {
            name: '最长时长',
            type: 'line' as const,
            smooth: true,
            data: maxDurations,
            itemStyle: { color: '#f5222d' },
            lineStyle: { type: 'dashed' as const },
          },
          {
            name: '最短时长',
            type: 'line' as const,
            smooth: true,
            data: minDurations,
            itemStyle: { color: '#52c41a' },
            lineStyle: { type: 'dashed' as const },
          },
        ],
      };
    }

    if (groupBy === 'worker') {
      const workerMap = new Map<string, number[]>();
      data.forEach((item) => {
        if (!workerMap.has(item.workerName)) {
          workerMap.set(item.workerName, []);
        }
        workerMap.get(item.workerName)!.push(item.duration);
      });

      const workers = Array.from(workerMap.keys());
      const avgDurations = workers.map((worker) => {
        const durations = workerMap.get(worker)!;
        return durations.reduce((a, b) => a + b, 0) / durations.length;
      });
      const counts = workers.map((worker) => workerMap.get(worker)!.length);

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

    const typeMap = new Map<string, number[]>();
    data.forEach((item) => {
      if (!typeMap.has(item.type)) {
        typeMap.set(item.type, []);
      }
      typeMap.get(item.type)!.push(item.duration);
    });

    const types = Array.from(typeMap.keys());
    const avgDurations = types.map((type) => {
      const durations = typeMap.get(type)!;
      return durations.reduce((a, b) => a + b, 0) / durations.length;
    });

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
      axisLabel: { color: textColor, rotate: groupBy === 'date' ? 45 : 0 },
      axisLine: { lineStyle: { color: textColor } },
    },
    yAxis: chartData.yAxis || [
      {
        type: 'value',
        name: groupBy === 'worker' ? '时长(小时)' : '维修时长(小时)',
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
