import { useMemo } from 'react';
import useECharts from '../../hooks/useECharts';
import type { ComplaintTag } from '../../../shared/types';
import type { EChartsOption } from 'echarts';

interface ComplaintScatterChartProps {
  data: ComplaintTag[];
  height?: string;
}

export default function ComplaintScatterChart({
  data,
  height = '400px',
}: ComplaintScatterChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const normalData = data
      .filter((d) => !d.isAbnormal)
      .map((d) => [d.x, d.y, d.count, d.amount, d.tagName]);

    const abnormalData = data
      .filter((d) => d.isAbnormal)
      .map((d) => [d.x, d.y, d.count, d.amount, d.tagName]);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const [, , count, amount, name] = params.value;
          const isAbnormal = params.seriesName === '异常标签';
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${name}</div>
            <div>投诉数量: ${count}</div>
            <div>涉及金额: ¥${amount.toLocaleString()}</div>
            ${isAbnormal ? '<div style="color: #EF4444; margin-top: 4px;">⚠️ 异常标签</div>' : ''}
          `;
        },
      },
      legend: {
        data: ['正常标签', '异常标签'],
        top: 0,
        textStyle: { color: '#64748B', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '投诉数量',
        nameTextStyle: { color: '#64748B', fontSize: 12 },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 12 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        name: '涉及金额(千元)',
        nameTextStyle: { color: '#64748B', fontSize: 12 },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 12 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      },
      series: [
        {
          name: '正常标签',
          type: 'scatter',
          data: normalData,
          symbolSize: (value: number[]) => {
            return Math.max(12, Math.min(30, value[2]));
          },
          itemStyle: {
            color: '#3B82F6',
            opacity: 0.7,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.5)',
            },
          },
          label: {
            show: true,
            formatter: (params: any) => params.value[4],
            position: 'top',
            fontSize: 11,
            color: '#64748B',
          },
        },
        {
          name: '异常标签',
          type: 'scatter',
          data: abnormalData,
          symbolSize: (value: number[]) => {
            return Math.max(16, Math.min(40, value[2]));
          },
          itemStyle: {
            color: '#EF4444',
            opacity: 0.9,
            shadowBlur: 15,
            shadowColor: 'rgba(239, 68, 68, 0.6)',
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 20,
              shadowColor: 'rgba(239, 68, 68, 0.8)',
            },
          },
          label: {
            show: true,
            formatter: (params: any) => params.value[4],
            position: 'top',
            fontSize: 11,
            fontWeight: 'bold',
            color: '#EF4444',
          },
        },
      ],
    };
  }, [data]);

  const { chartRef } = useECharts(option, [data]);

  return (
    <div>
      <div ref={chartRef} style={{ width: '100%', height }} />
      <div className="mt-4 px-4 text-xs text-slate-500">
        <p>
          <strong>说明：</strong>气泡大小代表投诉数量，红色标记为异常标签
          （投诉数量&gt;35 或 涉及金额&gt;15,000元）
        </p>
      </div>
    </div>
  );
}
