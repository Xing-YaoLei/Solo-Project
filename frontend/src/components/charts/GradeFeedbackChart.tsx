import ReactECharts from 'echarts-for-react';
import type { GradeOverview, HomeworkStats } from '../../types';

interface GradeFeedbackChartProps {
  gradeOverview: GradeOverview | null;
  homeworkStats: HomeworkStats | null;
}

const GradeFeedbackChart = ({ gradeOverview, homeworkStats }: GradeFeedbackChartProps) => {
  const gradeDist = gradeOverview?.grade_distribution || {};
  const gradeLevels = ['优秀', '良好', '中等', '及格', '不及格'];
  const gradeValues = gradeLevels.map((level) => gradeDist[level] || 0);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['成绩等级分布', '作业相关指标'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: gradeLevels,
        axisLabel: {
          interval: 0,
          rotate: 0,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '占比(%)',
        max: 100,
      },
    ],
    series: [
      {
        name: '成绩等级分布',
        type: 'bar',
        data: gradeValues,
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
        },
      },
    ],
    graphic: homeworkStats
      ? [
          {
            type: 'group',
            left: '65%',
            top: '35%',
            children: [
              {
                type: 'text',
                left: 'center',
                top: 0,
                style: {
                  text: '作业提交率',
                  fontSize: 14,
                  fill: '#666',
                },
              },
              {
                type: 'text',
                left: 'center',
                top: 24,
                style: {
                  text: `${homeworkStats.submit_rate}%`,
                  fontSize: 28,
                  fontWeight: 'bold',
                  fill: homeworkStats.submit_rate >= 80 ? '#52c41a' : '#faad14',
                },
              },
              {
                type: 'text',
                left: 'center',
                top: 64,
                style: {
                  text: `平均分数: ${homeworkStats.avg_score}分`,
                  fontSize: 12,
                  fill: '#999',
                },
              },
              {
                type: 'text',
                left: 'center',
                top: 86,
                style: {
                  text: `迟交率: ${homeworkStats.late_rate}%`,
                  fontSize: 12,
                  fill: '#999',
                },
              },
            ],
          },
        ]
      : [],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default GradeFeedbackChart;
