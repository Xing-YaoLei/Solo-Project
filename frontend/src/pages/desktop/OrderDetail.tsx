import { useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  List,
  Avatar,
  Upload,
  Form,
  Input,
  Select,
  Modal,
  message,
  Divider,
  Image,
  Timeline,
  Row,
  Col,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { orderAPI, uploadAPI, userAPI } from '@/services/api';
import { OrderStatus, OrderStatusText, OrderStatusColor, type ProcessRecord, type Order } from '@/types';
import { useAuthStore } from '@/hooks/useStore';
import dayjs from 'dayjs';

export default function DesktopOrderDetail() {
  const params = useParams({ from: '/orders/$orderId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    action: string;
    new_status: OrderStatus;
  } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.orderId],
    queryFn: () => orderAPI.get(Number(params.orderId)),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.list(),
  });

  const processMutation = useMutation({
    mutationFn: (data: any) => orderAPI.process(Number(params.orderId), data),
    onSuccess: () => {
      message.success('操作成功');
      setIsProcessModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['order', params.orderId] });
    },
    onError: () => message.error('操作失败'),
  });

  const supplementMutation = useMutation({
    mutationFn: (data: any) => orderAPI.addSupplement(Number(params.orderId), data),
    onSuccess: () => {
      message.success('补充说明已提交');
      setIsSupplementModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['order', params.orderId] });
    },
    onError: () => message.error('提交失败'),
  });

  const handleProcess = (values: any) => {
    if (!selectedAction) return;
    processMutation.mutate({
      ...selectedAction,
      remark: values.remark,
    });
  };

  const handleSupplement = (values: any) => {
    supplementMutation.mutate({
      supplement_type: 'supplement',
      content: values.content,
      new_assignee_id: values.new_assignee_id,
    });
  };

  const openProcessModal = (action: string, new_status: OrderStatus) => {
    setSelectedAction({ action, new_status });
    setIsProcessModalOpen(true);
  };

  const getAvailableActions = (order: Order) => {
    const actions: Array<{ label: string; action: string; status: OrderStatus; type?: string }> = [];

    switch (order.status) {
      case OrderStatus.PENDING:
        actions.push({ label: '派工', action: '派工', status: OrderStatus.ASSIGNED, type: 'primary' });
        break;
      case OrderStatus.ASSIGNED:
        actions.push({ label: '开始处理', action: '开始处理', status: OrderStatus.PROCESSING, type: 'primary' });
        break;
      case OrderStatus.PROCESSING:
        actions.push({ label: '处理完成', action: '处理完成', status: OrderStatus.COMPLETED, type: 'primary' });
        break;
      case OrderStatus.COMPLETED:
        actions.push({ label: '提交复核', action: '提交复核', status: OrderStatus.REVIEWING, type: 'primary' });
        break;
      case OrderStatus.REVIEWING:
        actions.push({ label: '复核通过', action: '复核通过', status: OrderStatus.CLOSED, type: 'primary' });
        break;
      case OrderStatus.REVIEW_FAILED:
        actions.push({ label: '重新处理', action: '重新处理', status: OrderStatus.PROCESSING, type: 'primary' });
        break;
    }

    return actions;
  };

  if (isLoading) return <div>加载中...</div>;
  if (!order?.data) return <div>工单不存在</div>;

  const orderData = order.data;
  const actions = getAvailableActions(orderData);

  return (
    <div className="desktop-container">
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/orders' })}>
            返回
          </Button>
          <h1 className="text-2xl font-bold">工单详情</h1>
          <Tag color={OrderStatusColor[orderData.status]} className="text-base px-3 py-1">
            {OrderStatusText[orderData.status]}
          </Tag>
        </div>
        <Space>
          {actions.map((action) => (
            <Button
              key={action.status}
              type={action.type as any}
              onClick={() => openProcessModal(action.action, action.status)}
            >
              {action.label}
            </Button>
          ))}
          {orderData.status === OrderStatus.REVIEW_FAILED && (
            <Button onClick={() => setIsSupplementModalOpen(true)}>补充说明</Button>
          )}
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="基本信息" className="mb-6">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="工单号">{orderData.order_no}</Descriptions.Item>
              <Descriptions.Item label="标题">{orderData.title}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={['default', 'blue', 'orange', 'red'][orderData.priority] || 'default'}>
                  P{orderData.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="审计类型">{orderData.audit_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="审计项">{orderData.audit_item || '-'}</Descriptions.Item>
              <Descriptions.Item label="位置">{orderData.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="派工规则">{orderData.dispatch_rule?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时限">
                {orderData.dispatch_rule?.handling_time_limit
                  ? `${orderData.dispatch_rule.handling_time_limit}小时`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {orderData.assignee?.full_name || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{orderData.creator?.full_name}</Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {orderData.deadline ? dayjs(orderData.deadline).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="首次解决">
                {orderData.first_resolved ? (
                  <Tag color="success">是</Tag>
                ) : (
                  <Tag>否</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="处理次数">{orderData.processing_count}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(orderData.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {orderData.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {orderData.site_photo_url && (
            <Card title="现场照片" className="mb-6">
              <Image width={300} src={orderData.site_photo_url} />
            </Card>
          )}

          {orderData.affected_objects.length > 0 && (
            <Card title="受影响对象" className="mb-6">
              <List
                dataSource={orderData.affected_objects}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Tag color="red">{item.impact_level}</Tag>}
                      title={`${item.object_type}: ${item.object_name}`}
                      description={item.description || '-'}
                    />
                    {item.object_id && <Tag>ID: {item.object_id}</Tag>}
                  </List.Item>
                )}
              />
            </Card>
          )}

          {orderData.review_supplements.length > 0 && (
            <Card title="补充说明记录" className="mb-6">
              <List
                dataSource={orderData.review_supplements}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <span>{item.operator?.full_name}</span>
                          <span className="text-gray-400 text-sm">
                            {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </Space>
                      }
                      description={
                        <div>
                          {item.content && <p>{item.content}</p>}
                          {item.old_assignee && item.new_assignee && (
                            <p className="text-orange-500">
                              调整负责人: {item.old_assignee.full_name} → {item.new_assignee.full_name}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="处理记录" className="sticky top-6">
            <Timeline
              items={orderData.process_records
                .slice()
                .reverse()
                .map((record: ProcessRecord) => ({
                  color: record.new_status === OrderStatus.CLOSED ? 'green' : 'blue',
                  children: (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{record.action}</span>
                        <Tag color={OrderStatusColor[record.new_status]}>
                          {OrderStatusText[record.new_status]}
                        </Tag>
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        {record.handler?.full_name} · {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
                      </div>
                      {record.remark && <p className="text-sm mb-2">{record.remark}</p>}
                      {record.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {record.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.file_path}
                              target="_blank"
                              className="text-sm text-blue-500"
                            >
                              📎 {att.file_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                }))}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedAction?.action || '处理工单'}
        open={isProcessModalOpen}
        onCancel={() => setIsProcessModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleProcess}>
          <Form.Item name="remark" label="处理备注">
            <Input.TextArea rows={4} placeholder="请输入处理说明（可选）" />
          </Form.Item>
          <Form.Item label="上传附件">
            <Upload
              action="/api/upload"
              headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
              multiple
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Divider />
          <div className="text-right">
            <Space>
              <Button onClick={() => setIsProcessModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={processMutation.isPending}>
                确认
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="补充说明 / 调整负责人"
        open={isSupplementModalOpen}
        onCancel={() => setIsSupplementModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSupplement}>
          <Form.Item name="content" label="补充说明">
            <Input.TextArea rows={4} placeholder="请输入补充说明" />
          </Form.Item>
          <Form.Item name="new_assignee_id" label="调整负责人（可选）">
            <Select
              placeholder="选择新的负责人"
              allowClear
              options={users?.data?.map((u) => ({
                value: u.id,
                label: `${u.full_name} (${u.department || '-'})`,
              }))}
            />
          </Form.Item>
          <Divider />
          <div className="text-right">
            <Space>
              <Button onClick={() => setIsSupplementModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={supplementMutation.isPending}>
                提交
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
