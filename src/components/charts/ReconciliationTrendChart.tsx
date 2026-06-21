import React, { useRef, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import ChartCard from './ChartCard';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { ReconciliationTrendItem } from '@/types';

export interface ReconciliationTrendChartProps {
  data: ReconciliationTrendItem[];
  lastUpdated?: string;
  loading?: boolean;
  onRefresh?: () => void;
  anomalyThreshold?: number;
  className?: string;
}

export const ReconciliationTrendChart: React.FC<ReconciliationTrendChartProps> = ({
  data,
  lastUpdated,
  loading = false,
  onRefresh,
  anomalyThreshold = 0.05,
  className,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  const getAnomalyIndices = useCallback(() => {
    return data
      .map((item, index) => ({
        index,
        isAnomaly: Math.abs(item.difference_rate) > anomalyThreshold,
      }))
      .filter((item) => item.isAnomaly)
      .map((item) => item.index);
  }, [data, anomalyThreshold]);

  const option = useMemo<EChartsOption>(() => {
    const anomalyIndices = getAnomalyIndices();
    const dates = data.map((item) => item.date);
    const quotedAmounts = data.map((item) => item.quoted_amount);
    const actualAmounts = data.map((item) => item.actual_amount);
    const differences = data.map((item) => item.difference);
    const differenceRates = data.map((item) => item.difference_rate * 100);

    const markPoints = anomalyIndices.map((index) => ({
      name: '异常点',
      coord: [index, differences[index]],
      value: formatPercent(Math.abs(data[index].difference_rate)),
      itemStyle: {
        color: '#ef4444',
      },
      label: {
        show: true,
        formatter: '异常',
        color: '#ef4444',
        fontWeight: 'bold' as const,
      },
      symbolSize: 10,
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 37, 64, 0.95)',
        borderColor: '#d4af37',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
        },
        formatter: (params: unknown) => {
          const p = params as Array<{
            axisValue: string;
            seriesName: string;
            value: number;
            marker: string;
          }>;
          if (!p || p.length === 0) return '';

          const date = p[0].axisValue;
          const item = data.find((d) => d.date === date);
          if (!item) return '';

          const isAnomaly = Math.abs(item.difference_rate) > anomalyThreshold;

          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: #d4af37;">${date}</div>
              ${isAnomaly ? '<div style="color: #ef4444; margin-bottom: 8px;">⚠️ 异常数据</div>' : ''}
              <div style="margin-bottom: 4px;">${p[0].marker} ${p[0].seriesName}: ${formatCurrency(item.quoted_amount)}</div>
              <div style="margin-bottom: 4px;">${p[1].marker} ${p[1].seriesName}: ${formatCurrency(item.actual_amount)}</div>
              <div style="margin-bottom: 4px;">${p[2].marker} ${p[2].seriesName}: ${formatCurrency(item.difference)}</div>
              <div style="margin-bottom: 4px;">${p[3].marker} ${p[3].seriesName}: ${formatPercent(item.difference_rate)}</div>
            </div>
          `;
        },
      },
      legend: {
        data: ['报价金额', '实际金额', '差异金额', '差异率'],
        textStyle: {
          color: '#94a3b8',
        },
        top: 10,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#334155',
          },
        },
        axisLabel: {
          color: '#94a3b8',
          rotate: 45,
          fontSize: 11,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额 (元)',
          nameTextStyle: {
            color: '#94a3b8',
          },
          axisLine: {
            lineStyle: {
              color: '#334155',
            },
          },
          axisLabel: {
            color: '#94a3b8',
            formatter: (value: number) => {
              if (value >= 10000) {
                return `${(value / 10000).toFixed(1)}万`;
              }
              return value.toString();
            },
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(51, 65, 85, 0.5)',
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: '差异率 (%)',
          nameTextStyle: {
            color: '#94a3b8',
          },
          axisLine: {
            lineStyle: {
              color: '#334155',
            },
          },
          axisLabel: {
            color: '#94a3b8',
            formatter: '{value}%',
          },
          splitLine: {
            show: false,
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 5,
          borderColor: 'transparent',
          backgroundColor: 'rgba(51, 65, 85, 0.3)',
          fillerColor: 'rgba(212, 175, 55, 0.3)',
          handleStyle: {
            color: '#d4af37',
          },
          textStyle: {
            color: '#94a3b8',
          },
        },
      ],
      series: [
        {
          name: '报价金额',
          type: 'line',
          data: quotedAmounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
            borderWidth: 2,
            borderColor: '#0f2540',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
        },
        {
          name: '实际金额',
          type: 'line',
          data: actualAmounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#d4af37',
          },
          itemStyle: {
            color: '#d4af37',
            borderWidth: 2,
            borderColor: '#0f2540',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(212, 175, 55, 0.3)' },
                { offset: 1, color: 'rgba(212, 175, 55, 0.05)' },
              ],
            },
          },
        },
        {
          name: '差异金额',
          type: 'line',
          data: differences,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 8,
          lineStyle: {
            width: 2,
            color: '#f97316',
            type: 'dashed',
          },
          itemStyle: {
            color: '#f97316',
            borderWidth: 2,
            borderColor: '#0f2540',
          },
          markPoint: {
            data: markPoints,
            symbol: 'pin',
            symbolSize: 40,
          },
        },
        {
          name: '差异率',
          type: 'line',
          yAxisIndex: 1,
          data: differenceRates,
          smooth: true,
          symbol: 'rect',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#10b981',
          },
          itemStyle: {
            color: '#10b981',
          },
        },
      ],
    };
  }, [data, anomalyThreshold, getAnomalyIndices]);

  return (
    <ChartCard
      title="对账差异趋势"
      lastUpdated={lastUpdated}
      loading={loading}
      onRefresh={onRefresh}
      chartRef={chartRef}
      className={className}
    >
      <div style={{ height: '400px', width: '100%' }}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </ChartCard>
  );
};

export default ReconciliationTrendChart;
