import React, { useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';

interface TagData {
  tagName: string;
  practiceCount: number;
  correctRate: number;
}

interface TagRankingChartProps {
  data: TagData[];
}

const TagRankingChart: React.FC<TagRankingChartProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'count' | 'rate'>('count');

  const sortedData = [...data].sort((a, b) =>
    sortBy === 'count' ? b.practiceCount - a.practiceCount : b.correctRate - a.correctRate
  );

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '题目标签排行',
      left: 'left',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: 600,
      },
      subtext: '高频标签练习次数与正确率',
      subtextStyle: {
        color: '#64748b',
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: {
        color: '#e2e8f0',
      },
      formatter: (params: any) => {
        const item = sortedData[params[0].dataIndex];
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${item.tagName}</div>
          <div>练习次数: <span style="color: #60a5fa; font-weight: 600;">${item.practiceCount}</span></div>
          <div>正确率: <span style="color: #34d399; font-weight: 600;">${item.correctRate}%</span></div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#475569',
        },
      },
      axisLabel: {
        color: '#94a3b8',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.3)',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: sortedData.map((d) => d.tagName),
      axisLine: {
        lineStyle: {
          color: '#475569',
        },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
      },
    },
    series: [
      {
        name: '练习次数',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (params: any) => {
            const item = sortedData[params.dataIndex];
            const rate = item.correctRate;
            if (rate >= 80) {
              return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#34d399' },
              ]);
            } else if (rate >= 60) {
              return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#60a5fa' },
              ]);
            } else {
              return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#f59e0b' },
                { offset: 1, color: '#fbbf24' },
              ]);
            }
          },
        },
        label: {
          show: true,
          position: 'right',
          color: '#94a3b8',
          fontSize: 11,
          formatter: (params: any) => {
            const item = sortedData[params.dataIndex];
            return `${item.correctRate}%`;
          },
        },
        data: sortedData.map((d) => d.practiceCount),
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-end mb-2 gap-2">
        <button
          onClick={() => setSortBy('count')}
          className={`px-3 py-1 text-xs rounded-lg transition-all ${
            sortBy === 'count'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          按练习次数
        </button>
        <button
          onClick={() => setSortBy('rate')}
          className={`px-3 py-1 text-xs rounded-lg transition-all ${
            sortBy === 'rate'
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          按正确率
        </button>
      </div>
      <ReactECharts
        option={option}
        style={{ height: '380px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default TagRankingChart;
