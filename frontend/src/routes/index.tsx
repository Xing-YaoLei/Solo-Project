import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Card, Col, Row, Statistic, Table, Button, Typography, Space, Tag } from 'antd';
import {
  OrderedListOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { dashboardApi, workOrderApi } from '../lib/api';
import type { WorkOrder } from '../lib/types';
import { getStoredUser } from '../lib/auth';

const { Title } = Typography;

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待分配', color: 'default' },
  assigned: { text: '已分配', color: 'processing' },
  in_progress: { text: '进行中', color: 'blue' },
  parts_issued: { text: '已发料', color: 'cyan' },
  quality_check: { text: '质检中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  rework: { text: '返工', color: 'red' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => dashboardApi.getRecentOrders().then((r) => r.data),
  });

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '车牌', dataIndex: 'vehicle_plate', key: 'vehicle_plate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusLabels[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: string) => {
        const map: Record<string, { text: string; color: string }> = {
          low: { text: '低', color: 'default' },
          normal: { text: '普通', color: 'blue' },
          high: { text: '高', color: 'orange' },
          urgent: { text: '紧急', color: 'red' },
        };
        const info = map[p] || { text: p, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '技师', dataIndex: 'technician_name', key: 'technician_name', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WorkOrder) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/work-orders/$id', params: { id: String(record.id) } })}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>欢迎, {user?.display_name}</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中工单"
              value={stats?.active_orders ?? 0}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理缺件"
              value={stats?.pending_shortages ?? 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="今日预约"
              value={stats?.today_appointments ?? 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待审报价"
              value={stats?.pending_quotes ?? 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="今日完成"
              value={stats?.completed_today ?? 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="返工率"
              value={stats?.rework_rate ?? 0}
              suffix="%"
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats?.rework_rate && stats.rework_rate > 5 ? '#f5222d' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/work-orders/new' })}>
          新建工单
        </Button>
        <Button onClick={() => navigate({ to: '/work-orders' })}>全部工单</Button>
        <Button onClick={() => navigate({ to: '/shortages' })}>缺件处理</Button>
      </Space>

      <Card title="最近工单" bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={recentOrders ?? []}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
