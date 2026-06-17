import { useMemo } from 'react';
import useECharts from '../../hooks/useECharts';
import type { InspectionItem } from '../../../shared/types';
import type { EChartsOption } from 'echarts';

interface InspectionPieChartProps {
  data: InspectionItem[];
  height?: string;
}

const severityColors: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

export default function InspectionPieChart({
  data,
  height = '350px',
}: InspectionPieChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const categories = Array.from(new Set(data.map((d) => d.category)));
    
    const pieData = categories.map((cat) => {
      const items = data.filter((d) => d.category === cat);
      const total = items.reduce((sum, item) => sum + item.count, 0);
      const maxSeverity = items.reduce(
        (max, item) =>
          item.severity === 'high'
            ? 'high'
            : item.severity === 'medium' && max !== 'high'
            ? 'medium'
            : max,
        'low' as 'low' | 'medium' | 'high'
      );

      return {
        value: total,
        name: cat,
        itemStyle: {
          color: severityColors[maxSeverity],
        },
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const items = data.filter((d) => d.category === params.name);
          const details = items
            .map(
              (item) =>
                `${item.itemName}: ${item.count} (${item.percentage}%)`
            )
            .join('<br/>');
          return `<strong>${params.name}</strong><br/>总计: ${params.value}<br/><br/>${details}`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#64748B', fontSize: 12 },
      },
      series: [
        {
          name: '验房问题',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: {
            show: true,
            position: 'inside',
            formatter: '{d}%',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
    };
  }, [data]);

  const { chartRef } = useECharts(option, [data]);

  return (
    <div className="flex flex-col">
      <div ref={chartRef} style={{ width: '100%', height }} />
      <div className="flex gap-4 mt-4 px-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.low }} />
          <span className="text-xs text-slate-500">低风险</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.medium }} />
          <span className="text-xs text-slate-500">中风险</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.high }} />
          <span className="text-xs text-slate-500">高风险</span>
        </div>
      </div>
    </div>
  );
}
