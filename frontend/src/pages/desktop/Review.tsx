import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  List,
  message,
  Tabs,
  Row,
  Col,
  Statistic,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ExclamationCircleOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { orderAPI, userAPI } from '@/services/api';
import { OrderStatus, OrderStatusText, OrderStatusColor } from '@/types';
import { useAuthStore } from '@/hooks/useStore';
import dayjs from 'dayjs';

export default function DesktopReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [affectedObjects, setAffectedObjects] = useState<any[]>([
    { object_type: '', object_name: '', impact_level: 'medium' },
  ]);

  const { data: reviewFailedOrders, isLoading: loadingFailed } = useQuery({
    queryKey: ['reviewFailedOrders'],
    queryFn: () => orderAPI.list({ status: OrderStatus.REVIEW_FAILED, page_size: 100 }),
  });

  const { data: reviewingOrders, isLoading: loadingReviewing } = useQuery({
    queryKey: ['reviewingOrders'],
    queryFn: () => orderAPI.list({ status: OrderStatus.REVIEWING, page_size: 100 }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.list(),
  });

  const reviewFailedMutation = useMutation({
    mutationFn: (data: any) => orderAPI.reviewFailed(selectedOrder.id, data),
    onSuccess: () => {
      message.success('已记录复核不通过');
      setIsReviewModalOpen(false);
      form.resetFields();
      setAffectedObjects([{ object_type: '', object_name: '', impact_level: 'medium' }]);
      queryClient.invalidateQueries({ queryKey: ['reviewFailedOrders'] });
      queryClient.invalidateQueries({ queryKey: ['reviewingOrders'] });
    },
    onError: () => message.error('操作失败'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      orderAPI.process(id, {
        action: '复核通过',
        new_status: OrderStatus.CLOSED,
      }),
    onSuccess: () => {
      message.success('复核通过，工单已闭环');
      queryClient.invalidateQueries({ queryKey: ['reviewingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['reviewFailedOrders'] });
    },
  });

  const handleReviewFailed = () => {
    form.validateFields().then((values) => {
      const validObjects = affectedObjects.filter(
        (obj) => obj.object_type && obj.object_name
      );
      if (validObjects.length === 0) {
        message.error('请至少填写一个受影响对象');
        return;
      }
      reviewFailedMutation.mutate({
        ...values,
        affected_objects: validObjects,
      });
    });
  };

  const openReviewModal = (order: any) => {
    setSelectedOrder(order);
    form.resetFields();
    setAffectedObjects([{ object_type: '', object_name: '', impact_level: 'medium' }]);
    setIsReviewModalOpen(true);
  };

  const addAffectedObject = () => {
    setAffectedObjects([
      ...affectedObjects,
      { object_type: '', object_name: '', impact_level: 'medium' },
    ]);
  };

  const removeAffectedObject = (index: number) => {
    if (affectedObjects.length > 1) {
      setAffectedObjects(affectedObjects.filter((_, i) => i !== index));
    }
  };

  const updateAffectedObject = (index: number, field: string, value: string) => {
    const newObjects = [...affectedObjects];
    newObjects[index] = { ...newObjects[index], [field]: value };
    setAffectedObjects(newObjects);
  };

  const baseColumns = [
    {
      title: '工单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text: string, record: any) => (
        <a onClick={() => navigate({ to: `/orders/$orderId`, params: { orderId: record.id } })}>
          {text}
        </a>
      ),
    },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => (
        <Tag color={OrderStatusColor[status]}>{OrderStatusText[status]}</Tag>
      ),
    },
    { title: '处理人', dataIndex: ['assignee', 'full_name'], key: 'assignee' },
    { title: '创建人', dataIndex: ['creator', 'full_name'], key: 'creator' },
    {
      title: '处理次数',
      dataIndex: 'processing_count',
      key: 'processing_count',
      render: (c: number) => <Tag color={c > 1 ? 'orange' : 'green'}>{c}次</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const reviewingColumns = [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate({ to: `/orders/$orderId`, params: { orderId: record.id } })}
          >
            详情
          </Button>
          <Button type="primary" onClick={() => approveMutation.mutate(record.id)}>
            复核通过
          </Button>
          <Button danger onClick={() => openReviewModal(record)}>
            复核不通过
          </Button>
        </Space>
      ),
    },
  ];

  const failedColumns = [
    ...baseColumns,
    {
      title: '受影响对象',
      dataIndex: 'affected_objects',
      key: 'affected_objects',
      render: (objs: any[]) => objs?.length || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate({ to: `/orders/$orderId`, params: { orderId: record.id } })}
        >
          详情
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'reviewing',
      label: `待复核 (${reviewingOrders?.data?.total || 0})`,
      children: (
        <Table
          rowKey="id"
          loading={loadingReviewing}
          columns={reviewingColumns}
          dataSource={reviewingOrders?.data?.items}
          pagination={{ showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      ),
    },
    {
      key: 'failed',
      label: `复核不通过 (${reviewFailedOrders?.data?.total || 0})`,
      children: (
        <Table
          rowKey="id"
          loading={loadingFailed}
          columns={failedColumns}
          dataSource={reviewFailedOrders?.data?.items}
          pagination={{ showSizeChanger: true }}
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <h4 className="font-bold mb-2">受影响对象：</h4>
                <List
                  dataSource={record.affected_objects}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color="red">{item.impact_level}</Tag>}
                        title={`${item.object_type}: ${item.object_name}`}
                        description={
                          <div>
                            {item.object_id && <p>对象ID: {item.object_id}</p>}
                            {item.description && <p>描述: {item.description}</p>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
                <h4 className="font-bold mt-4 mb-2">补充说明记录：</h4>
                <List
                  dataSource={record.review_supplements}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<UserOutlined />}
                        title={`${item.operator?.full_name} · ${dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}`}
                        description={
                          <div>
                            {item.content && <p>{item.content}</p>}
                            {item.new_assignee && (
                              <p className="text-orange-500">
                                调整负责人: {item.old_assignee?.full_name || '-'} →{' '}
                                {item.new_assignee?.full_name}
                              </p>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ),
          }}
        />
      ),
    },
  ];

  return (
    <div className="desktop-container">
      <div className="page-header">
        <h1 className="text-2xl font-bold">复盘视图</h1>
        <p className="text-gray-500 mt-1">复核工单处理结果，跟踪复核不通过问题的整改</p>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="待复核工单"
              value={reviewingOrders?.data?.total || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="复核不通过"
              value={reviewFailedOrders?.data?.total || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待补说明"
              value={
                reviewFailedOrders?.data?.items?.filter(
                  (o: any) => o.review_supplements.length === 0
                ).length || 0
              }
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="reviewing" />
      </Card>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined className="text-red-500" />
            复核不通过 - 记录受影响对象
          </Space>
        }
        open={isReviewModalOpen}
        onCancel={() => setIsReviewModalOpen(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setIsReviewModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={handleReviewFailed}
            loading={reviewFailedMutation.isPending}
          >
            确认复核不通过
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p>
              <strong>工单：</strong>
              {selectedOrder.order_no} - {selectedOrder.title}
            </p>
            <p className="text-gray-500 text-sm">
              处理人：{selectedOrder.assignee?.full_name} | 处理次数：{selectedOrder.processing_count}
            </p>
          </div>
        )}

        <Form form={form} layout="vertical">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium">受影响对象</label>
              <Button type="dashed" size="small" onClick={addAffectedObject}>
                + 添加受影响对象
              </Button>
            </div>
            {affectedObjects.map((obj, index) => (
              <div key={index} className="flex gap-2 mb-2 p-2 bg-gray-50 rounded">
                <Select
                  placeholder="对象类型"
                  style={{ width: 120 }}
                  value={obj.object_type || undefined}
                  onChange={(v) => updateAffectedObject(index, 'object_type', v)}
                  options={[
                    { value: '系统', label: '系统' },
                    { value: '设备', label: '设备' },
                    { value: '人员', label: '人员' },
                    { value: '流程', label: '流程' },
                    { value: '文档', label: '文档' },
                    { value: '其他', label: '其他' },
                  ]}
                />
                <Input
                  placeholder="对象名称"
                  style={{ flex: 1 }}
                  value={obj.object_name}
                  onChange={(e) => updateAffectedObject(index, 'object_name', e.target.value)}
                />
                <Select
                  placeholder="影响程度"
                  style={{ width: 100 }}
                  value={obj.impact_level}
                  onChange={(v) => updateAffectedObject(index, 'impact_level', v)}
                  options={[
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' },
                    { value: 'critical', label: '严重' },
                  ]}
                />
                {affectedObjects.length > 1 && (
                  <Button type="text" danger onClick={() => removeAffectedObject(index)}>
                    删除
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Form.Item name="supplement" label="复核不通过说明">
            <Input.TextArea rows={3} placeholder="请详细说明复核不通过的原因" />
          </Form.Item>

          <Form.Item name="new_assignee_id" label="调整负责人（可选）">
            <Select
              placeholder="选择新的负责人重新处理"
              allowClear
              options={users?.data?.map((u) => ({
                value: u.id,
                label: `${u.full_name} (${u.department || '-'})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
