import { useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Select,
  DatePicker,
  Form,
  Row,
  Col,
  Statistic,
  Tag,
  Rate,
} from 'antd';
import {
  TeamOutlined,
  StarOutlined,
  CarOutlined,
  FileProtectOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import { RiderStatus } from '@/types';
import type { RiderActivity } from '@/types';
import { useAppStore } from '@/store';

const { RangePicker } = DatePicker;

const statusColorMap: Record<string, string> = {
  Active: 'green',
  Inactive: 'default',
  OnBreak: 'orange',
  Offline: 'red',
};

const statusLabel: Record<string, string> = {
  Active: '活跃',
  Inactive: '非活跃',
  OnBreak: '休息中',
  Offline: '离线',
};

const statusOptions = Object.values(RiderStatus).map((s) => ({
  label: statusLabel[s] || s,
  value: s,
}));

export default function Riders() {
  const [form] = Form.useForm();
  const { riders, riderActivity, loadingRiders, fetchRiders, fetchRiderActivity } = useAppStore();

  useEffect(() => {
    fetchRiders();
    fetchRiderActivity();
  }, [fetchRiders, fetchRiderActivity]);

  const handleSearch = useCallback(() => {
    const values = form.getFieldsValue();
    const params: Record<string, unknown> = {};
    if (values.status) params.status = values.status;
    if (values.dateRange) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    fetchRiders(params);
    fetchRiderActivity(params);
  }, [form, fetchRiders, fetchRiderActivity]);

  const handleReset = useCallback(() => {
    form.resetFields();
    fetchRiders();
    fetchRiderActivity();
  }, [form, fetchRiders, fetchRiderActivity]);

  const activities = riderActivity.length > 0 ? riderActivity : [];

  const activeCount = activities.filter((a) => a.status === RiderStatus.Active).length;
  const avgRating =
    activities.length > 0
      ? activities.reduce((sum, a) => sum + a.rating, 0) / activities.length
      : 0;
  const totalDeliveries = activities.reduce((sum, a) => sum + a.totalDeliveries, 0);
  const totalVerifications = activities.reduce((sum, a) => sum + a.totalVerifications, 0);
  const totalDamages = activities.reduce((sum, a) => sum + a.damageIncidents, 0);
  const damageRate = totalVerifications > 0 ? ((totalDamages / totalVerifications) * 100).toFixed(2) : '0.00';

  const top5 = activities
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const radarIndicators = [
    { name: '配送数', max: Math.max(...activities.map((a) => a.totalDeliveries), 1) },
    { name: '核验数', max: Math.max(...activities.map((a) => a.totalVerifications), 1) },
    { name: '评分', max: 5 },
    { name: '低损坏率', max: 100 },
  ];

  const radarOption = {
    tooltip: {},
    legend: {
      data: top5.map((r) => r.riderName),
      bottom: 0,
    },
    radar: {
      indicator: radarIndicators,
      center: ['50%', '45%'],
      radius: '60%',
    },
    series: [
      {
        type: 'radar',
        data: top5.map((rider) => ({
          name: rider.riderName,
          value: [
            rider.totalDeliveries,
            rider.totalVerifications,
            rider.rating,
            rider.totalVerifications > 0
              ? Math.round((1 - rider.damageIncidents / rider.totalVerifications) * 100)
              : 100,
          ],
        })),
      },
    ],
  };

  const columns: ColumnsType<RiderActivity> = [
    {
      title: '骑手名称',
      dataIndex: 'riderName',
      key: 'riderName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>{statusLabel[status] || status}</Tag>
      ),
    },
    {
      title: '配送数',
      dataIndex: 'totalDeliveries',
      key: 'totalDeliveries',
      width: 100,
      sorter: (a, b) => a.totalDeliveries - b.totalDeliveries,
    },
    {
      title: '核验数',
      dataIndex: 'totalVerifications',
      key: 'totalVerifications',
      width: 100,
      sorter: (a, b) => a.totalVerifications - b.totalVerifications,
    },
    {
      title: '损坏数',
      dataIndex: 'damageIncidents',
      key: 'damageIncidents',
      width: 100,
      sorter: (a, b) => a.damageIncidents - b.damageIncidents,
      render: (val: number) => (val > 0 ? <span style={{ color: '#f5222d' }}>{val}</span> : val),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      sorter: (a, b) => a.rating - b.rating,
      render: (rating: number) => <Rate disabled value={rating} allowHalf />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <a onClick={() => console.log('View rider:', record.riderId)}>详情</a>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: '8px 0' }}>
          <Form.Item name="status">
            <Select
              placeholder="骑手状态"
              allowClear
              style={{ width: 140 }}
              options={statusOptions}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item>
            <button
              type="button"
              onClick={handleSearch}
              style={{
                padding: '4px 15px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              搜索
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '4px 15px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              重置
            </button>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="活跃骑手数"
              value={activeCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="平均评分"
              value={avgRating}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="总配送数"
              value={totalDeliveries}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="总核验数"
              value={totalVerifications}
              prefix={<FileProtectOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="损坏率"
              value={damageRate}
              suffix="%"
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="骑手活跃度分析">
            <Table
              rowKey="riderId"
              columns={columns}
              dataSource={activities}
              loading={loadingRiders}
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="综合评分雷达图 (TOP5骑手)">
            <ReactECharts option={radarOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
