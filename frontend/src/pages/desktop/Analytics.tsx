import { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Table, Progress, Space, Button, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '@/services/api';
import { DownloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const COLORS = ['#52c41a', '#faad14', '#f5222d', '#1890ff', '#722ed1'];

export default function DesktopAnalytics() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['firstTimeResolution', dateRange],
    queryFn: () =>
      analyticsAPI.getFirstTimeResolution({
        start_date: dateRange?.[0]?.toISOString(),
        end_date: dateRange?.[1]?.toISOString(),
      }),
  });

  const handleExport = () => {
    if (!stats?.data) return;
    message.info('导出功能已触发，请在导出任务中查看进度');
  };

  const statsData = stats?.data;

  const trendData = statsData?.by_month?.map((item) => ({
    month: item.month,
    首次解决率: item.rate,
    总工单: item.total,
  })) || [];

  const pieData = [
    { name: '首次解决', value: statsData?.first_time_resolved || 0 },
    { name: '非首次解决', value: (statsData?.total_orders || 0) - (statsData?.first_time_resolved || 0) },
  ];

  const auditorColumns = [
    {
      title: '审计员',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: '总工单',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '首次解决',
      dataIndex: 'first_time',
      key: 'first_time',
    },
    {
      title: '首次解决率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => (
        <Progress percent={rate} size="small" status={rate >= 80 ? 'success' : 'exception'} />
      ),
    },
  ];

  const departmentColumns = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '总工单',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '首次解决',
      dataIndex: 'first_time',
      key: 'first_time',
    },
    {
      title: '首次解决率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => (
        <Progress percent={rate} size="small" status={rate >= 80 ? 'success' : 'exception'} />
      ),
    },
  ];

  return (
    <div className="desktop-container">
      <div className="page-header flex justify-between items-center">
        <h1 className="text-2xl font-bold">首次解决率分析</h1>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])}
            showTime
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出报告
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic title="总工单数" value={statsData?.total_orders || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="首次解决数"
              value={statsData?.first_time_resolved || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="首次解决率"
              value={statsData?.first_time_resolution_rate || 0}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="非首次解决数"
              value={(statsData?.total_orders || 0) - (statsData?.first_time_resolved || 0)}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={16}>
          <Card title="月度首次解决率趋势" loading={isLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="总工单" fill="#1890ff" />
                <Bar yAxisId="right" dataKey="首次解决率" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="首次解决分布" loading={isLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="按审计员统计" loading={isLoading}>
            <Table
              rowKey="username"
              dataSource={statsData?.by_auditor}
              columns={auditorColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="按部门统计" loading={isLoading}>
            <Table
              rowKey="department"
              dataSource={statsData?.by_department}
              columns={departmentColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
