import ReactECharts from 'echarts-for-react';
import type { FunnelData } from '../types';

interface FunnelChartProps {
  data: FunnelData | null;
  loading: boolean;
}

export default function FunnelChart({ data, loading }: FunnelChartProps) {
  if (loading || !data) {
    return <div className="chart-loading">加载中...</div>;
  }

  const stages = [...data.stages].sort((a, b) => a.stageOrder - b.stageOrder);
  const stageNames = stages.map((s) => s.stageName);
  const avgDurations = stages.map((s) => s.avgDurationHours);

  const timeoutBarData = data.timeoutIntervals.map((t) => ({
    name: `${t.startDate} ~ ${t.endDate}`,
    value: t.avgDurationHours,
    affectedStages: t.affectedStages,
  }));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 32, 48, 0.95)',
      borderColor: '#3a3d5c',
      textStyle: { color: '#e0e0e8' },
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '58%',
      height: '35%',
    },
    xAxis: {
      type: 'category',
      gridIndex: 0,
      data: stageNames,
      axisLabel: { color: '#a0a3b5', fontSize: 11 },
      axisLine: { lineStyle: { color: '#3a3d5c' } },
    },
    yAxis: {
      type: 'value',
      gridIndex: 0,
      name: '平均时长(h)',
      nameTextStyle: { color: '#a0a3b5' },
      axisLabel: { color: '#a0a3b5' },
      splitLine: { lineStyle: { color: '#2a2d44' } },
    },
    series: [
      {
        name: '客诉漏斗',
        type: 'funnel',
        left: '10%',
        top: 20,
        width: '80%',
        height: '50%',
        sort: 'descending',
        gap: 4,
        data: stages.map((s, i) => ({
          name: s.stageName,
          value: s.complaintCount,
          avgDurationHours: s.avgDurationHours,
          itemStyle: {
            color: [
              '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272',
            ][i % 6],
          },
        })),
        label: {
          show: true,
          position: 'inside',
          formatter(params: { name: string; value: number }) {
            const stage = stages.find((s) => s.stageName === params.name);
            return `${params.name}\n${params.value}件 | ${stage?.avgDurationHours.toFixed(1) ?? '-'}h`;
          },
          fontSize: 12,
          color: '#fff',
          lineHeight: 18,
        },
        emphasis: {
          label: { fontSize: 14, fontWeight: 'bold' },
        },
        tooltip: {
          formatter(params: { name: string; value: number; data: { avgDurationHours: number } }) {
            const stage = stages.find((s) => s.stageName === params.name);
            return `<strong>${params.name}</strong><br/>
              客诉数量: ${params.value}<br/>
              平均处理时长: ${stage?.avgDurationHours.toFixed(1) ?? '-'}h`;
          },
        },
      },
      {
        name: '处理时长趋势',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: avgDurations,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#91cc75', width: 2 },
        itemStyle: { color: '#91cc75' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(145, 204, 117, 0.35)' },
              { offset: 1, color: 'rgba(145, 204, 117, 0.02)' },
            ],
          },
        },
        markArea: timeoutBarData.length > 0 ? {
          silent: true,
          data: timeoutBarData.map((t) => [
            {
              name: t.name,
              xAxis: t.affectedStages[0] ?? stageNames[0],
              itemStyle: { color: 'rgba(255, 99, 71, 0.15)' },
              label: {
                show: true,
                position: 'insideTop',
                formatter: `超时区间\n${t.name}`,
                color: '#ff6347',
                fontSize: 10,
              },
            },
            {
              xAxis: t.affectedStages[t.affectedStages.length - 1] ?? stageNames[stageNames.length - 1],
            },
          ]),
        } : undefined,
        tooltip: {
          valueFormatter: (val: number) => `${val.toFixed(1)}h`,
        },
      },
    ],
  };

  return (
    <div className="funnel-chart-container">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
