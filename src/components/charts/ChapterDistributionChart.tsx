import React from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';

interface ChapterData {
  courseName: string;
  chapterName: string;
  questionCount: number;
  completedCount: number;
  completionRate: number;
}

interface ChapterDistributionChartProps {
  data: ChapterData[];
}

const ChapterDistributionChart: React.FC<ChapterDistributionChartProps> = ({ data }) => {
  const courses = [...new Set(data.map((d) => d.courseName))];
  const chapters = data.map((d) => d.chapterName);

  const series = courses.map((course, index) => {
    const colors = [
      ['#3b82f6', '#60a5fa'],
      ['#10b981', '#34d399'],
      ['#f59e0b', '#fbbf24'],
      ['#8b5cf6', '#a78bfa'],
    ];
    const [mainColor, lightColor] = colors[index % colors.length];

    return {
      name: course,
      type: 'bar',
      stack: 'total',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: mainColor },
          { offset: 1, color: lightColor + '40' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: {
        focus: 'series',
      },
      data: data
        .filter((d) => d.courseName === course)
        .map((d) => ({
          value: d.questionCount,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: mainColor },
              { offset: 1, color: lightColor + '40' },
            ]),
          },
        })),
    };
  });

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '课程章节分布',
      left: 'left',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: 600,
      },
      subtext: '各章节题目数量与完成情况',
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
        const dataItem = data[params[0].dataIndex];
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${dataItem.chapterName}</div>
          <div>题目总数: <span style="color: #60a5fa; font-weight: 600;">${dataItem.questionCount}</span></div>
          <div>已完成: <span style="color: #34d399; font-weight: 600;">${dataItem.completedCount}</span></div>
          <div>完成率: <span style="color: #f59e0b; font-weight: 600;">${dataItem.completionRate}%</span></div>
        `;
      },
    },
    legend: {
      data: courses,
      right: 0,
      top: 0,
      textStyle: {
        color: '#94a3b8',
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
      type: 'category',
      data: chapters,
      axisLine: {
        lineStyle: {
          color: '#475569',
        },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        interval: 0,
        rotate: 30,
      },
    },
    yAxis: {
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
    series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '380px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default ChapterDistributionChart;
