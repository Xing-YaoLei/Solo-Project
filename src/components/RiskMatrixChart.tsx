import ReactECharts from 'echarts-for-react';
import type { MatrixBubble } from '@shared/types';
import { RISK_COLORS, RISK_LABELS, STOCK_AGE_BUCKETS, COMPLETION_BUCKETS } from '@/utils/constants';
import { cn } from '@/lib/utils';

interface Props {
  bubbles: MatrixBubble[];
  className?: string;
  onBubbleClick?: (bubble: MatrixBubble) => void;
}

export function RiskMatrixChart({ bubbles, className, onBubbleClick }: Props) {
  const seriesData = bubbles.map((b) => {
    const x = STOCK_AGE_BUCKETS.indexOf(b.stockAgeBucket);
    const y = COMPLETION_BUCKETS.indexOf(b.completionBucket);
    return {
      value: [x, y, b.count],
      itemStyle: { color: RISK_COLORS[b.riskLevel], borderColor: `${RISK_COLORS[b.riskLevel]}88`, borderWidth: 2 },
      _raw: b,
    };
  });

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 70, right: 30, top: 40, bottom: 60 },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26, 32, 41, 0.95)',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      padding: [10, 14],
      formatter: (params: any) => {
        const b = params.data._raw as MatrixBubble;
        return `
          <div style="font-weight:600;margin-bottom:6px;color:#fff">库龄 ${b.stockAgeBucket}天 × 完成度 ${b.completionBucket}%</div>
          <div style="display:flex;justify-content:space-between;gap:20px;font-size:11px">
            <span style="color:#94a3b8">车辆数</span>
            <span style="color:#fff;font-weight:600">${b.count} 台</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:20px;font-size:11px;margin-top:4px">
            <span style="color:#94a3b8">风险等级</span>
            <span style="color:${RISK_COLORS[b.riskLevel]};font-weight:600">${RISK_LABELS[b.riskLevel]}</span>
          </div>
        `;
      },
    },
    legend: {
      top: 4,
      right: 10,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
      data: ['低风险', '中风险', '高风险', '严重风险'].map((name) => ({
        name,
        itemStyle: { color: Object.values(RISK_COLORS)[['low', 'medium', 'high', 'critical'].indexOf(['low', 'medium', 'high', 'critical'][(['低风险', '中风险', '高风险', '严重风险'].indexOf(name))])], borderWidth: 0 },
      })),
    },
    xAxis: {
      type: 'category',
      data: STOCK_AGE_BUCKETS.map((s) => s + '天'),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
      name: '库龄分段',
      nameLocation: 'middle',
      nameGap: 36,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: COMPLETION_BUCKETS.map((s) => s + '%'),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
      name: '材料完成度',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (val: number[]) => Math.sqrt(val[2] || 1) * 9 + 4,
        data: seriesData,
        emphasis: {
          itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 20, shadowColor: 'rgba(59,130,246,0.5)' },
          scale: 1.2,
        },
      },
    ],
  };

  return (
    <div className={cn('relative rounded-2xl bg-surface-card border border-surface-border overflow-hidden p-4', className)}>
      <div className="flex items-center justify-between mb-2 px-2">
        <div>
          <h3 className="text-sm font-semibold text-white">周转 × 材料 风险矩阵</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">气泡大小表示车辆数量，颜色表示风险等级</p>
        </div>
      </div>
      <ReactECharts
        option={option}
        style={{ height: 380, width: '100%' }}
        onEvents={{
          click: (params: any) => {
            if (onBubbleClick && params?.data?._raw) onBubbleClick(params.data._raw);
          },
        }}
      />
    </div>
  );
}
