import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CheckinTrendPoint } from '@/types';

interface CheckinTrendChartProps {
  trendData?: CheckinTrendPoint[];
}

function generateMockData(): {
  dates: string[];
  generated: number[];
  verified: number[];
  yoyGenerated: number[];
  momVerified: number[];
} {
  const dates: string[] = [];
  const generated: number[] = [];
  const verified: number[] = [];
  const yoyGenerated: number[] = [];
  const momVerified: number[] = [];

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(`${d.getMonth() + 1}/${d.getDate()}`);

    const weekdayFactor = d.getDay() === 0 || d.getDay() === 6 ? 1.4 : 1;
    const baseGen = 180 + Math.sin(i / 4) * 60 + Math.random() * 80;
    const gen = Math.round(baseGen * weekdayFactor);
    generated.push(gen);

    const ver = Math.round(gen * (0.68 + Math.random() * 0.18));
    verified.push(ver);

    yoyGenerated.push(Math.round(gen * (0.72 + Math.random() * 0.18)));
    momVerified.push(Math.round(ver * (0.88 + Math.random() * 0.2)));
  }

  return { dates, generated, verified, yoyGenerated, momVerified };
}

export default function CheckinTrendChart({ trendData }: CheckinTrendChartProps) {
  const chartOption = useMemo<EChartsOption>(() => {
    const mock = generateMockData();
    const dates = trendData && trendData.length > 0
      ? trendData.map((t) => t.date)
      : mock.dates;
    const generated = trendData && trendData.length > 0
      ? trendData.map((t) => t.generatedCount)
      : mock.generated;
    const verified = trendData && trendData.length > 0
      ? trendData.map((t) => t.checkedCount)
      : mock.verified;

    return {
      backgroundColor: 'transparent',
      color: ['#00D4FF', '#00E396', '#8B5CF6', '#FF8A00'],
      legend: {
        show: true,
        top: 0,
        right: 0,
        textStyle: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 12,
        },
        itemWidth: 14,
        itemHeight: 10,
        itemGap: 20,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'rgba(0, 212, 255, 0.3)',
          },
          crossStyle: {
            color: 'rgba(0, 212, 255, 0.2)',
          },
        },
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#e2e8f0',
          fontSize: 12,
        },
      },
      grid: {
        top: 50,
        left: 55,
        right: 55,
        bottom: 60,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.15)',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: 11,
          interval: Math.floor(dates.length / 10),
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '生成/核销数',
          nameTextStyle: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 11,
            padding: [0, 0, 0, 10],
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.06)',
              type: 'dashed',
            },
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 11,
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
        {
          type: 'value',
          name: '对比数据',
          nameTextStyle: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 11,
            padding: [0, 10, 0, 0],
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 11,
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          start: 0,
          end: 100,
          zoomLock: false,
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          start: 60,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: 'rgba(0, 212, 255, 0.2)',
          backgroundColor: 'rgba(6, 18, 41, 0.6)',
          fillerColor: 'rgba(0, 212, 255, 0.12)',
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#00D4FF',
            shadowBlur: 6,
            shadowColor: 'rgba(0, 212, 255, 0.4)',
          },
          textStyle: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 10,
          },
          dataBackground: {
            lineStyle: {
              color: 'rgba(0, 212, 255, 0.3)',
            },
            areaStyle: {
              color: 'rgba(0, 212, 255, 0.08)',
            },
          },
          selectedDataBackground: {
            lineStyle: {
              color: '#00D4FF',
            },
            areaStyle: {
              color: 'rgba(0, 212, 255, 0.15)',
            },
          },
          moveHandleStyle: {
            color: 'rgba(0, 212, 255, 0.6)',
          },
        },
      ],
      series: [
        {
          name: '签到码生成',
          type: 'bar',
          yAxisIndex: 0,
          data: generated,
          barWidth: '45%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 212, 255, 0.9)' },
                { offset: 1, color: 'rgba(0, 212, 255, 0.35)' },
              ],
            },
            borderRadius: [3, 3, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 240, 255, 1)' },
                  { offset: 1, color: 'rgba(0, 212, 255, 0.5)' },
                ],
              },
              shadowBlur: 12,
              shadowColor: 'rgba(0, 212, 255, 0.5)',
            },
          },
        },
        {
          name: '核销数',
          type: 'line',
          yAxisIndex: 0,
          data: verified,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2.5,
            color: '#00E396',
            shadowBlur: 8,
            shadowColor: 'rgba(0, 227, 150, 0.4)',
          },
          itemStyle: {
            color: '#00E396',
            borderColor: '#061229',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 227, 150, 0.25)' },
                { offset: 1, color: 'rgba(0, 227, 150, 0)' },
              ],
            },
          },
        },
        {
          name: '同比生成',
          type: 'line',
          yAxisIndex: 1,
          data: mock.yoyGenerated,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: '#8B5CF6',
            shadowBlur: 6,
            shadowColor: 'rgba(139, 92, 246, 0.35)',
          },
        },
        {
          name: '环比核销',
          type: 'line',
          yAxisIndex: 1,
          data: mock.momVerified,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 5,
          lineStyle: {
            width: 2,
            type: 'dotted',
            color: '#FF8A00',
            shadowBlur: 6,
            shadowColor: 'rgba(255, 138, 0, 0.35)',
          },
          itemStyle: {
            color: '#FF8A00',
            borderColor: '#061229',
            borderWidth: 1.5,
          },
        },
      ] as any,
    } as EChartsOption;
  }, [trendData]);

  return (
    <ReactECharts
      option={chartOption}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
