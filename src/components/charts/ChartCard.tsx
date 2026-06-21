import React, { useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Download, Maximize2, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
  chartRef?: React.RefObject<ReactECharts | null>;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  lastUpdated,
  children,
  className,
  onRefresh,
  loading = false,
  chartRef,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const childChartRef = useRef<ReactECharts | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleExportImage = () => {
    const targetRef = chartRef?.current || childChartRef.current;
    if (targetRef?.getEchartsInstance) {
      const chartInstance = targetRef.getEchartsInstance();
      const dataUrl = chartInstance.getDataURL({
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        excludeComponents: ['toolbox'],
      });

      const link = document.createElement('a');
      link.download = `${title}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      const targetRef = chartRef?.current || childChartRef.current;
      targetRef?.getEchartsInstance()?.resize();
    }, 100);
  };

  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === ReactECharts && !chartRef) {
        return React.cloneElement(child as React.ReactElement, {
          ref: childChartRef,
        });
      }
      return child;
    });
  };

  const cardContent = (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#1e3a5f] to-[#0f2540] rounded-xl border border-[#d4af37]/20 shadow-xl transition-all duration-300',
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden flex flex-col' : 'w-full',
        className
      )}
      ref={containerRef}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-[#d4af37]/20">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-[#d4af37] to-[#b8941f] rounded-full" />
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-[#94a3b8] mr-2 font-mono">
              最后更新: {formatDateTime(lastUpdated)}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg text-[#94a3b8] hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="刷新数据"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          )}
          <button
            onClick={handleExportImage}
            className="p-2 rounded-lg text-[#94a3b8] hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-200"
            title="导出图片"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg text-[#94a3b8] hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-200"
            title={isFullscreen ? '退出全屏' : '全屏查看'}
          >
            {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          'p-4 transition-all duration-300',
          isFullscreen ? 'flex-1 overflow-auto' : ''
        )}
      >
        {renderChildren()}
      </CardContent>
    </div>
  );

  if (isFullscreen) {
    return (
      <>
        <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setIsFullscreen(false)} />
        {cardContent}
      </>
    );
  }

  return <Card className="border-0 bg-transparent shadow-none p-0">{cardContent}</Card>;
};

export default ChartCard;
