import { useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { mockDashboardStats } from '@/mock/data';

const statusColorMap: Record<string, string> = {
  Pending: '#faad14',
  Assigned: '#1890ff',
  InProgress: '#13c2c2',
  Confirmed: '#52c41a',
  Supplemented: '#2f54eb',
  Closed: '#8c8c8c',
  Cancelled: '#ff4d4f',
  Damaged: '#f5222d',
  Overdue: '#eb2f96',
};

export default function Dashboard() {
  const { dashboardStats, fetchRecords } = useAppStore();
  const stats = dashboardStats.totalRecords > 0 ? dashboardStats : mockDashboardStats;

  useEffect(() => {
    fetchRecords({ page: 1, pageSize: 10 });
  }, [fetchRecords]);

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: stats.statusDistribution.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: Object.values(statusColorMap)[
              stats.statusDistribution.indexOf(item) % Object.keys(statusColorMap).length
            ],
          },
        })),
      },
    ],
  };

  const lineOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats.weeklyTrend.map((item) => item.date),
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '核验数',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: stats.weeklyTrend.map((item) => item.count),
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  const barOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: stats.riderTop5.map((item) => item.name),
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '核验数',
        type: 'bar',
        barWidth: '50%',
        data: stats.riderTop5.map((item) => item.count),
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="总核验数"
              value={stats.totalRecords}
              prefix={<FileProtectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="今日新增"
              value={stats.todayNew}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="损坏数"
              value={stats.damaged}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="逾期数"
              value={stats.statusDistribution.find((s) => s.name === '已逾期')?.value || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="状态分布">
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="近7天趋势">
            <ReactECharts option={lineOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="骑手活跃度TOP5">
            <ReactECharts option={barOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
