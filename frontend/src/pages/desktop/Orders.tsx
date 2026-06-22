import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PlusOutlined, ExportOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { orderAPI, dispatchRuleAPI, userAPI, analyticsAPI } from '@/services/api';
import { OrderStatus, OrderStatusText, OrderStatusColor, type Order } from '@/types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export default function DesktopOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined as OrderStatus | undefined,
    keyword: undefined as string | undefined,
    dateRange: undefined as [Dayjs, Dayjs] | undefined,
    page: 1,
    page_size: 20,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () =>
      orderAPI.list({
        ...filters,
        start_date: filters.dateRange?.[0]?.toISOString(),
        end_date: filters.dateRange?.[1]?.toISOString(),
      }),
  });

  const { data: dispatchRules } = useQuery({
    queryKey: ['dispatchRules'],
    queryFn: () => dispatchRuleAPI.list({ is_active: true }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => orderAPI.create(data),
    onSuccess: () => {
      message.success('工单创建成功');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => message.error('创建失败'),
  });

  const exportMutation = useMutation({
    mutationFn: (filters: any) => analyticsAPI.exportOrders(filters),
    onSuccess: (response) => {
      message.info(`导出任务已提交，任务ID: ${response.data.task_id}`);
    },
  });

  const handleSearch = (values: any) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
      page: 1,
    }));
  };

  const handleExport = () => {
    const exportFilters = {
      status: filters.status,
      start_date: filters.dateRange?.[0]?.toISOString(),
      end_date: filters.dateRange?.[1]?.toISOString(),
    };
    exportMutation.mutate(exportFilters);
  };

  const handleCreate = (values: any) => {
    const data = {
      ...values,
      deadline: values.deadline?.toISOString(),
    };
    createMutation.mutate(data);
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (text: string, record: Order) => (
        <a onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: String(record.id) } })}>
          {text}
        </a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={OrderStatusColor[status]}>{OrderStatusText[status]}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: number) => {
        const colors = ['default', 'blue', 'orange', 'red'];
        return <Tag color={colors[p] || 'default'}>P{p}</Tag>;
      },
    },
    {
      title: '审计类型',
      dataIndex: 'audit_type',
      key: 'audit_type',
      width: 120,
    },
    {
      title: '处理人',
      dataIndex: ['assignee', 'full_name'],
      key: 'assignee',
      width: 100,
    },
    {
      title: '创建人',
      dataIndex: ['creator', 'full_name'],
      key: 'creator',
      width: 100,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (d: string) => d && dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '首次解决',
      dataIndex: 'first_resolved',
      key: 'first_resolved',
      width: 100,
      render: (v: boolean) => (v ? <Tag color="success">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Order) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: String(record.id) } })}
        >
          详情
        </Button>
      ),
    },
  ];

  const stats = orders?.data?.total
    ? {
        total: orders.data.total,
        pending: orders.data.items.filter((o) => o.status === OrderStatus.PENDING).length,
        processing: orders.data.items.filter((o) =>
          [OrderStatus.ASSIGNED, OrderStatus.PROCESSING].includes(o.status)
        ).length,
        completed: orders.data.items.filter((o) => o.status === OrderStatus.CLOSED).length,
      }
    : { total: 0, pending: 0, processing: 0, completed: 0 };

  return (
    <div className="desktop-container">
      <div className="page-header flex justify-between items-center">
        <h1 className="text-2xl font-bold">工单管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建工单
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport} loading={exportMutation.isPending}>
            导出Excel
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic title="总工单" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待派工" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已闭环" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              options={Object.entries(OrderStatusText).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="搜索工单号/标题" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="创建时间">
            <RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={orders?.data?.items}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total: orders?.data?.total || 0,
            onChange: (page, page_size) => setFilters((prev) => ({ ...prev, page, page_size })),
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="新建工单"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入工单标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue={1}>
                <Select
                  options={[
                    { value: 1, label: 'P1 - 一般' },
                    { value: 2, label: 'P2 - 重要' },
                    { value: 3, label: 'P3 - 紧急' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="audit_type" label="审计类型">
                <Select
                  options={[
                    { value: '内部审计', label: '内部审计' },
                    { value: '外部审计', label: '外部审计' },
                    { value: '合规检查', label: '合规检查' },
                    { value: '安全审计', label: '安全审计' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="audit_item" label="审计项">
                <Input placeholder="请输入审计项" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="位置">
                <Input placeholder="请输入位置" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dispatch_rule_id" label="派工规则">
                <Select
                  placeholder="请选择派工规则"
                  options={dispatchRules?.data?.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignee_id" label="处理人">
                <Select
                  placeholder="请选择处理人"
                  options={users?.data?.map((u) => ({
                    value: u.id,
                    label: u.full_name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="截止时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={4} placeholder="请详细描述问题" />
              </Form.Item>
            </Col>
            <Col span={24} className="text-right">
              <Space>
                <Button onClick={() => setIsModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                  创建
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
