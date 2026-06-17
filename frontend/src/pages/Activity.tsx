import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import ChartCard from '@/components/ChartCard';
import { activityApi } from '@/services/api';
import type { ActivityTrendItem, ActivityTimeDistribution, BedAreaComparison } from '@/types';

export default function Activity() {
  const [trendData, setTrendData] = useState<ActivityTrendItem[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<ActivityTimeDistribution[]>([]);
  const [bedAreaData, setBedAreaData] = useState<BedAreaComparison[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trend, timeDist, bedArea] = await Promise.all([
          activityApi.getTrend(days),
          activityApi.getTimeDistribution(),
          activityApi.getBedAreaComparison(),
        ]);
        setTrendData(trend);
        setTimeDistribution(timeDist);
        setBedAreaData(bedArea);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['参与率', '参与人数'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.map((item) => item.date),
      axisLabel: {
        fontSize: 11,
        rotate: 30,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '参与率(%)',
        position: 'left',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      {
        type: 'value',
        name: '参与人数',
        position: 'right',
      },
    ],
    series: [
      {
        name: '参与率',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: trendData.map((item) => item.participationRate),
        lineStyle: {
          width: 2,
          color: '#0d9488',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(13, 148, 136, 0.3)' },
              { offset: 1, color: 'rgba(13, 148, 136, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#0d9488',
        },
      },
      {
        name: '参与人数',
        type: 'bar',
        yAxisIndex: 1,
        data: trendData.map((item) => item.participantCount),
        barWidth: '40%',
        itemStyle: {
          color: 'rgba(245, 158, 11, 0.6)',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const timeDistOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人次',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: timeDistribution.map((item) => item.timeSlot),
      axisLabel: {
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: '签到人次',
    },
    series: [
      {
        type: 'bar',
        data: timeDistribution.map((item) => item.count),
        barWidth: '50%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#14b8a6' },
              { offset: 1, color: '#0d9488' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
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
                { offset: 0, color: '#2dd4bf' },
                { offset: 1, color: '#14b8a6' },
              ],
            },
          },
        },
      },
    ],
  };

  const bedAreaOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['参与率', '总人数'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '参与率(%)',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    yAxis: {
      type: 'category',
      data: bedAreaData.map((item) => item.area),
      axisLabel: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: '参与率',
        type: 'bar',
        data: bedAreaData.map((item) => item.participationRate),
        barWidth: '45%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#0d9488' },
              { offset: 1, color: '#2dd4bf' },
            ],
          },
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 12,
          color: '#0d9488',
          fontWeight: 'bold',
        },
      },
    ],
  };

  const dayOptions = [
    { value: 7, label: '近7天' },
    { value: 30, label: '近30天' },
    { value: 60, label: '近60天' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">活动签到分析</h1>
        <div className="flex items-center gap-2">
          {dayOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                days === opt.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ChartCard title="活动参与趋势" subtitle="参与率与参与人数变化">
        <div className="h-80">
          <ReactECharts option={trendOption} style={{ height: '100%' }} />
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="时段分布" subtitle="各时段签到人次">
          <div className="h-64">
            <ReactECharts option={timeDistOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>

        <ChartCard title="床位区域对比" subtitle="各区域活动参与率">
          <div className="h-64">
            <ReactECharts option={bedAreaOption} style={{ height: '100%' }} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
