import React, { useRef, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import ChartCard from './ChartCard';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { ContractAttachmentItem } from '@/types';

export interface ContractCompositionChartProps {
  data: ContractAttachmentItem[];
  lastUpdated?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onDrillDown?: (type: string) => void;
  className?: string;
}

const COLORS = ['#d4af37', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

export const ContractCompositionChart: React.FC<ContractCompositionChartProps> = ({
  data,
  lastUpdated,
  loading = false,
  onRefresh,
  onDrillDown,
  className,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const totalCount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const totalAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  const option = useMemo<EChartsOption>(() => {
    const chartData = data.map((item, index) => ({
      value: item.amount,
      name: item.type,
      itemStyle: {
        color: COLORS[index % COLORS.length],
      },
      count: item.count,
      percentage: item.percentage,
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 37, 64, 0.95)',
        borderColor: '#d4af37',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
        },
        formatter: (params: unknown) => {
          const p = params as {
            name: string;
            value: number;
            percent: number;
            data: { count: number; percentage: number };
          };
          if (!p) return '';

          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: #d4af37;">${p.name}</div>
              <div style="margin-bottom: 4px;">数量: ${p.data.count} 份</div>
              <div style="margin-bottom: 4px;">金额: ${formatCurrency(p.value)}</div>
              <div style="margin-bottom: 4px;">占比: ${formatPercent(p.data.percentage)}</div>
            </div>
          `;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: '#94a3b8',
          fontSize: 12,
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        selectedMode: true,
      },
      graphic: [
        {
          type: 'text',
          left: '28%',
          top: '42%',
          style: {
            text: '总计',
            textAlign: 'center',
            fill: '#94a3b8',
            fontSize: 14,
          },
        },
        {
          type: 'text',
          left: '28%',
          top: '50%',
          style: {
            text: formatCurrency(totalAmount),
            textAlign: 'center',
            fill: '#d4af37',
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        {
          type: 'text',
          left: '28%',
          top: '58%',
          style: {
            text: `${totalCount} 份`,
            textAlign: 'center',
            fill: '#94a3b8',
            fontSize: 12,
          },
        },
      ],
      series: [
        {
          name: '合同附件',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0f2540',
            borderWidth: 3,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#d4af37',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(212, 175, 55, 0.5)',
            },
          },
          labelLine: {
            show: false,
          },
          data: chartData,
        },
      ],
    };
  }, [data, totalAmount, totalCount]);

  const handleChartClick = (params: unknown) => {
    const p = params as { name: string };
    if (p?.name) {
      setSelectedType(p.name);
      onDrillDown?.(p.name);
    }
  };

  const onEvents = useMemo(() => ({
    click: handleChartClick,
  }), [handleChartClick]);

  return (
    <ChartCard
      title="合同附件构成"
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
          onEvents={onEvents}
        />
      </div>
      {selectedType && (
        <div className="mt-3 p-3 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg">
          <p className="text-sm text-[#d4af37]">
            已选择: <span className="font-semibold">{selectedType}</span>
            {onDrillDown && ' - 点击查看明细'}
          </p>
        </div>
      )}
    </ChartCard>
  );
};

export default ContractCompositionChart;
