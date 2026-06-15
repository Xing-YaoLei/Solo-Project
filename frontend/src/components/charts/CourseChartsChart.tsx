import ReactECharts from 'echarts-for-react';
import type { ChapterFunnel, ChapterGrade } from '../../types';

interface CourseChaptersChartProps {
  chapterFunnel: ChapterFunnel[];
  chapterGrades: ChapterGrade[];
}

const CourseChartsChart = ({ chapterFunnel, chapterGrades }: CourseChaptersChartProps) => {
  const categories = chapterFunnel.map((c) => `第${c.chapter_no}章 ${c.chapter_title}`);
  const completionRates = chapterFunnel.map((c) => c.completion_rate);
  const avgScores = chapterGrades.map((g) => g.avg_score);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['教材完成率', '平均成绩'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 11,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '完成率(%)',
        min: 0,
        max: 100,
        position: 'left',
      },
      {
        type: 'value',
        name: '平均分',
        min: 0,
        max: 100,
        position: 'right',
      },
    ],
    series: [
      {
        name: '教材完成率',
        type: 'bar',
        yAxisIndex: 0,
        data: completionRates,
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '30%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 11,
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: 80,
              lineStyle: { color: '#52c41a', type: 'dashed' },
              label: { formatter: '目标值 80%' },
            },
          ],
        },
      },
      {
        name: '平均成绩',
        type: 'line',
        yAxisIndex: 1,
        data: avgScores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#fa8c16',
          width: 2,
        },
        itemStyle: {
          color: '#fa8c16',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default CourseChartsChart;
