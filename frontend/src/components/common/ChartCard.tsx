import { ReactNode, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import Panel from './Panel';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title?: string;
  extra?: ReactNode;
  option: EChartsOption;
  loading?: boolean;
  className?: string;
  chartHeight?: number | string;
  glow?: 'cyan' | 'purple' | 'none';
  onChartReady?: (instance: unknown) => void;
}

function SkeletonBars() {
  return (
    <div className="w-full h-full flex items-end gap-3 px-4 pb-4 pt-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-primary/30 to-cyan-primary/10 animate-pulse"
          style={{
            height: `${40 + Math.sin(i) * 20 + Math.random() * 30}%`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

function SkeletonLine() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none" className="p-4">
      <defs>
        <linearGradient id="sk-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,150 C60,120 90,80 140,100 C200,120 230,40 290,70 C340,95 370,50 400,60 L400,200 L0,200 Z"
        fill="url(#sk-line)"
        className="animate-pulse"
      />
      <path
        d="M0,150 C60,120 90,80 140,100 C200,120 230,40 290,70 C340,95 370,50 400,60"
        fill="none"
        stroke="#00D4FF"
        strokeOpacity="0.6"
        strokeWidth="2"
        className="animate-pulse"
      />
    </svg>
  );
}

export default function ChartCard({
  title,
  extra,
  option,
  loading = false,
  className,
  chartHeight = 320,
  glow = 'cyan',
  onChartReady,
}: ChartCardProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    if (chartRef.current && onChartReady) {
      const instance = chartRef.current.getEchartsInstance();
      onChartReady(instance);
    }
  }, [onChartReady]);

  const baseOption: EChartsOption = {
    backgroundColor: 'transparent',
    textStyle: {
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    grid: {
      left: 50,
      right: 30,
      top: 40,
      bottom: 40,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6,18,41,0.95)',
      borderColor: 'rgba(0,212,255,0.3)',
      borderWidth: 1,
      textStyle: {
        color: '#e2e8f0',
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(0,212,255,0.4)',
          type: 'dashed',
        },
      },
    },
    legend: {
      textStyle: {
        color: 'rgba(255,255,255,0.7)',
      },
      itemGap: 20,
    },
  };

  const mergedOption: EChartsOption = {
    ...baseOption,
    ...option,
  };

  return (
    <Panel title={title} extra={extra} className={className} glow={glow}>
      <div
        className={cn(
          'relative w-full transition-opacity duration-300',
          loading && 'opacity-0 pointer-events-none',
        )}
        style={{ height: chartHeight }}
      >
        {!loading && (
          <ReactECharts
            ref={chartRef}
            option={mergedOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
          />
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 p-5 pt-0" style={{ marginTop: '-1.25rem', height: chartHeight }}>
          <div className="w-full h-full overflow-hidden rounded-lg">
            {option.series &&
            Array.isArray(option.series) &&
            option.series.some((s) => (s as { type?: string })?.type === 'bar') ? (
              <SkeletonBars />
            ) : (
              <SkeletonLine />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
