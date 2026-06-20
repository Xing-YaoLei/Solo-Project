import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, FunnelChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { cn } from '@/lib/utils';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

const DARK_THEME_OPTION: EChartsOption = {
  backgroundColor: 'transparent',
  textStyle: { color: '#94A3B8', fontFamily: 'Inter, sans-serif' },
  title: { textStyle: { color: '#E2E8F0', fontFamily: 'Space Grotesk, sans-serif' } },
  legend: { textStyle: { color: '#94A3B8' } },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    textStyle: { color: '#E2E8F0' },
  },
  color: ['#06B6D4', '#F97316', '#8B5CF6', '#22C55E', '#EAB308', '#EC4899'],
};

interface ChartProps {
  option: EChartsOption;
  className?: string;
  style?: React.CSSProperties;
}

export default function Chart({ option, className, style }: ChartProps) {
  const mergedOption: EChartsOption = {
    ...DARK_THEME_OPTION,
    ...option,
    color: option.color ?? DARK_THEME_OPTION.color,
  };

  return (
    <div
      className={cn(
        'glass-card overflow-hidden rounded-lg border border-white/5 p-4',
        className,
      )}
    >
      <ReactEChartsCore
        echarts={echarts}
        option={mergedOption}
        style={{ width: '100%', height: '100%', ...style }}
        opts={{ renderer: 'canvas' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
