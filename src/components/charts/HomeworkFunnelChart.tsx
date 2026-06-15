import React from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';

interface FunnelData {
  stage: string;
  value: number;
  conversionRate: number;
}

interface HomeworkFunnelChartProps {
  data: FunnelData[];
}

const stageNames: Record<string, string> = {
  assigned: '已布置',
  started: '已开始',
  submitted: '已提交',
  graded: '已批改',
  passed: '已通过',
};

const HomeworkFunnelChart: React.FC<HomeworkFunnelChartProps> = ({ data }) => {
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '作业记录漏斗',
      left: 'left',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: 600,
      },
      subtext: '从布置到通过的转化分析',
      subtextStyle: {
        color: '#64748b',
        fontSize: 12,
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: {
        color: '#e2e8f0',
      },
      formatter: (params: any) => {
        const item = data.find((d) => d.stage === params.name) || data[params.dataIndex];
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${stageNames[params.name] || params.name}</div>
          <div>数量: <span style="color: #60a5fa; font-weight: 600;">${params.value}</span></div>
          <div>转化率: <span style="color: #34d399; font-weight: 600;">${item?.conversionRate || 0}%</span></div>
        `;
      },
    },
    series: [
      {
        name: '作业漏斗',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 10,
        width: '80%',
        min: 0,
        max: data[0]?.value || 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const item = data.find((d) => d.stage === params.name) || data[params.dataIndex];
            return `${stageNames[params.name] || params.name}\n${params.value} (${item?.conversionRate || 0}%)`;
          },
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderColor: '#0f172a',
          borderWidth: 2,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: data.map((item, index) => {
          const colors = [
            '#3b82f6',
            '#60a5fa',
            '#34d399',
            '#f59e0b',
            '#10b981',
          ];
          return {
            value: item.value,
            name: item.stage,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: colors[index % colors.length] },
                { offset: 1, color: colors[index % colors.length] + '80' },
              ]),
            },
          };
        }),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '380px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default HomeworkFunnelChart;
