import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useStore } from '@/store/useStore';
import { getScheduleTrend, getRiskAnnotations } from '@/services/api';
import type { ScheduleTrendData, RiskAnnotation } from '@/types';

const severityColors: Record<string, string> = {
  low: '#F59E0B',
  medium: '#F97316',
  high: '#EF4444',
  critical: '#DC2626',
};

const typeSymbols: Record<string, string> = {
  terminal_delay: 'pin',
  access_missing: 'diamond',
  billing_caliber_change: 'triangle',
  fall_event: 'roundRect',
};

function buildMarkPoints(annotations: RiskAnnotation[], dates: string[]) {
  const data = annotations
    .filter((a) => a.type !== 'fall_event')
    .map((a) => {
      const dateStr = a.timestamp.slice(0, 10);
      const dateIndex = dates.indexOf(dateStr);
      const coordIndex = dateIndex >= 0 ? dateIndex : Math.floor(dates.length / 2);

      let formatter = '';
      if (a.type === 'terminal_delay') {
        const delayMin = a.delayMinutes || 0;
        const timeStr = a.timestamp.slice(11, 16);
        formatter = `延迟${delayMin}分\n${timeStr}`;
      } else if (a.type === 'access_missing') {
        const missingStart = a.missingStart?.slice(11, 16) || '';
        const missingEnd = a.missingEnd?.slice(11, 16) || '';
        formatter = `门禁缺失\n${missingStart}-${missingEnd}`;
      } else if (a.type === 'billing_caliber_change') {
        const oldCal = a.oldCaliber || '';
        const newCal = a.newCaliber || '';
        formatter = `口径变更\n${oldCal}→${newCal}`;
      }

      return {
        coord: [coordIndex, null],
        symbol: typeSymbols[a.type] || 'pin',
        symbolSize: a.type === 'terminal_delay' ? 42 : 36,
        itemStyle: {
          color: severityColors[a.severity] || '#F59E0B',
          shadowBlur: a.type === 'terminal_delay' ? 10 : 0,
          shadowColor: severityColors[a.severity] || '#F59E0B',
        },
        label: {
          show: true,
          formatter,
          fontSize: a.type === 'terminal_delay' ? 8 : 9,
          color: '#fff',
          lineHeight: 11,
          fontWeight: a.type === 'terminal_delay' ? 'bold' : 'normal',
        },
        value: a.id,
      };
    });
  return { data, silent: false, animation: true };
}

function buildMarkLines(annotations: RiskAnnotation[], dates: string[]) {
  const falls = annotations.filter((a) => a.type === 'fall_event');
  if (falls.length === 0) return {};

  const lineData = falls.map((f) => {
    const dateStr = f.timestamp.slice(0, 10);
    const dateIndex = dates.indexOf(dateStr);
    const coordIndex = dateIndex >= 0 ? dateIndex : Math.floor(dates.length / 2);
    const timeStr = f.timestamp.slice(11, 16);
    const impactOnTrend = f.impactOnTrend;

    return {
      xAxis: coordIndex,
      label: {
        formatter: `⚠ 跌倒事件\n${timeStr}${impactOnTrend ? '\n(趋势影响)' : ''}`,
        position: 'insideEndTop',
        color: '#EF4444',
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: 'rgba(239,68,68,0.15)',
        padding: [4, 6],
        borderRadius: 3,
      },
      lineStyle: {
        color: '#EF4444',
        type: impactOnTrend ? 'solid' : 'dashed',
        width: impactOnTrend ? 3 : 2,
        shadowBlur: impactOnTrend ? 8 : 0,
        shadowColor: '#EF4444',
      },
    };
  });

  return {
    symbol: 'none',
    animation: true,
    data: lineData,
  };
}

function buildMarkAreas(annotations: RiskAnnotation[], dates: string[]) {
  const accessMissing = annotations.filter((a) => a.type === 'access_missing');
  if (accessMissing.length === 0) return [];

  const areas: any[] = [];
  accessMissing.forEach((a) => {
    const dateStr = a.timestamp.slice(0, 10);
    const dateIndex = dates.indexOf(dateStr);
    const coordIndex = dateIndex >= 0 ? dateIndex : Math.floor(dates.length / 2);

    areas.push([
      {
        itemStyle: {
          color: 'rgba(239,68,68,0.15)',
          borderColor: 'rgba(239,68,68,0.4)',
          borderWidth: 1,
          borderType: 'dashed',
        },
        label: {
          show: true,
          position: 'top',
          formatter: '门禁记录缺失时段',
          color: '#EF4444',
          fontSize: 10,
        },
        xAxis: coordIndex - 0.3,
      },
      {
        xAxis: coordIndex + 0.3,
      },
    ]);
  });

  return areas;
}

export default function ScheduleTrendChart() {
  const { selectedDateRange, annotations, setAnnotations, setSelectedAnnotation, refreshKey } =
    useStore();
  const chartRef = useRef<ReactECharts>(null);

  const [trendData, setTrendData] = React.useState<ScheduleTrendData[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getScheduleTrend(selectedDateRange[0], selectedDateRange[1]),
      getRiskAnnotations(selectedDateRange[0], selectedDateRange[1]),
    ])
      .then(([td, ann]) => {
        if (cancelled) return;
        setTrendData(td);
        setAnnotations(ann);
      })
      .catch(() => {
        if (!cancelled) {
          setTrendData(mockTrend());
          setAnnotations(mockAnnotations());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedDateRange, refreshKey]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;
    chart.getZr().on('click', (params: any) => {
      const point = chart.convertFromPixel({ seriesIndex: 0 }, [params.offsetX, params.offsetY]);
    });
  }, []);

  const handleChartClick = (params: any) => {
    if (params.componentType === 'markPoint') {
      const annotation = annotations.find((a) => a.id === params.value);
      if (annotation) setSelectedAnnotation(annotation);
    }
  };

  const dates = trendData.map((d) => d.date);
  const occupancyRates = trendData.map((d) => d.occupancyRate);
  const riskScores = trendData.map((d) => d.riskScore);

  const terminalDelays = annotations.filter((a) => a.type === 'terminal_delay');
  const riskScoresWithDelayMarks = riskScores.map((score, index) => {
    const dateStr = dates[index];
    const delayOnDate = terminalDelays.find((d) => d.timestamp.startsWith(dateStr));
    if (delayOnDate) {
      const delayMin = (delayOnDate.metadata as { delayMinutes?: number })?.delayMinutes || 0;
      return {
        value: score,
        markPoint: {
          symbol: 'pin',
          symbolSize: 30,
          itemStyle: { color: '#F97316' },
          label: {
            show: true,
            formatter: `⟳${delayMin}分`,
            fontSize: 8,
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      };
    }
    return score;
  });

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1B2A4A',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
      formatter: (params: any) => {
        let html = `<div style="font-family:JetBrains Mono,monospace">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          if (p.componentType === 'series') {
            const unit = p.seriesIndex === 0 ? '%' : '分';
            html += `<div>${p.marker} ${p.seriesName}: <b>${p.value}${unit}</b></div>`;
          }
        });
        const dateStr = params[0]?.axisValue;
        const dayAnnotations = annotations.filter((a) => a.timestamp.startsWith(dateStr));
        if (dayAnnotations.length > 0) {
          html += `<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px">`;
          dayAnnotations.forEach((a) => {
            const typeLabel =
              a.type === 'terminal_delay' ? '终端延迟' :
              a.type === 'access_missing' ? '门禁缺失' :
              a.type === 'billing_caliber_change' ? '口径变更' : '跌倒事件';
            const sevColor =
              a.severity === 'critical' ? '#EF4444' :
              a.severity === 'high' ? '#F97316' :
              a.severity === 'medium' ? '#F59E0B' : '#10B981';
            html += `<div><span style="color:${sevColor}">●</span> <b>${typeLabel}</b>: ${a.description}</div>`;
          });
          html += `</div>`;
        }
        return html;
      },
    },
    legend: {
      top: 8,
      textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
    },
    grid: { top: 50, right: 60, bottom: 30, left: 60 },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
    ],
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'JetBrains Mono' },
    },
    yAxis: [
      {
        type: 'value',
        name: '入住率(%)',
        nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      {
        type: 'value',
        name: '风险评分',
        nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '入住率',
        type: 'bar',
        data: occupancyRates,
        barWidth: '40%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#1E40AF' },
            ],
          },
          borderRadius: [3, 3, 0, 0],
        },
        markPoint: buildMarkPoints(annotations, dates) as any,
        markLine: buildMarkLines(annotations, dates) as any,
        markArea: {
          silent: true,
          data: buildMarkAreas(annotations, dates) as any,
        },
      },
      {
        name: '风险评分',
        type: 'line',
        yAxisIndex: 1,
        data: riskScoresWithDelayMarks,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#F59E0B', width: 2 },
        itemStyle: { color: '#F59E0B' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245,158,11,0.15)' },
              { offset: 1, color: 'rgba(245,158,11,0)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F1B2D]/60 z-10">
          <span className="text-white/40 text-sm">加载中...</span>
        </div>
      )}
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '100%' }}
        onEvents={{ click: handleChartClick }}
      />
    </div>
  );
}

function mockTrend(): ScheduleTrendData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      occupancyRate: 72 + Math.round(Math.random() * 20),
      riskScore: +(15 + Math.random() * 35).toFixed(1),
      bedCount: 120,
      occupiedCount: 95 + Math.round(Math.random() * 15),
    };
  });
}

function mockAnnotations(): RiskAnnotation[] {
  return [
    {
      id: 'ann-1',
      type: 'terminal_delay',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      description: '3楼护士站终端数据同步延迟23分钟',
      severity: 'medium',
      metadata: { delayMinutes: 23, syncDelay: true },
      delayMinutes: 23,
      missingStart: null,
      missingEnd: null,
      oldCaliber: null,
      newCaliber: null,
      impactOnTrend: null,
    },
    {
      id: 'ann-2',
      type: 'access_missing',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      description: '2楼东区门禁记录缺失，时段 14:00-15:30',
      severity: 'high',
      metadata: { zone: '2楼东区', missingStart: '14:00', missingEnd: '15:30' },
      delayMinutes: null,
      missingStart: '2026-06-16T14:00:00',
      missingEnd: '2026-06-16T15:30:00',
      oldCaliber: null,
      newCaliber: null,
      impactOnTrend: null,
    },
    {
      id: 'ann-3',
      type: 'billing_caliber_change',
      timestamp: new Date(Date.now() - 0.5 * 86400000).toISOString(),
      description: '护理等级计费口径由III类调整为II类',
      severity: 'low',
      metadata: { affectedBeds: 8, oldCaliber: 'III类', newCaliber: 'II类' },
      delayMinutes: null,
      missingStart: null,
      missingEnd: null,
      oldCaliber: 'III类',
      newCaliber: 'II类',
      impactOnTrend: null,
    },
    {
      id: 'ann-4',
      type: 'fall_event',
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      description: '张奶奶(305床)在洗手间跌倒',
      severity: 'critical',
      metadata: { bedNo: '305', location: '洗手间', impactOnTrend: true },
      delayMinutes: null,
      missingStart: null,
      missingEnd: null,
      oldCaliber: null,
      newCaliber: null,
      impactOnTrend: true,
    },
  ];
}
