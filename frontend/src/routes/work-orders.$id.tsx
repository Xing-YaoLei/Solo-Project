import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Tabs, Descriptions, Table, Tag, Button, Space, Steps, Modal, Form,
  Input, Select, InputNumber, message, Timeline, Image,
} from 'antd';
import {
  ArrowLeftOutlined, UndoOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { workOrderApi, partApi, inspectionApi, shortageApi } from '../lib/api';
import type { OrderStatus, OrderPart } from '../lib/types';

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待确认', color: 'default' },
  confirmed: { text: '已确认', color: 'processing' },
  in_progress: { text: '进行中', color: 'blue' },
  waiting_parts: { text: '待料', color: 'orange' },
  in_inspection: { text: '质检中', color: 'purple' },
  completed: { text: '已完成', color: 'green' },
  closed: { text: '已关闭', color: 'default' },
  rework: { text: '返工', color: 'red' },
};

const priorityLabels: Record<string, { text: string; color: string }> = {
  normal: { text: '普通', color: 'blue' },
  urgent: { text: '紧急', color: 'orange' },
  critical: { text: '紧急加急', color: 'red' },
};

const statusFlow: OrderStatus[] = [
  'pending', 'confirmed', 'in_progress', 'in_inspection', 'completed', 'closed',
];

export default function WorkOrderDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<OrderPart | null>(null);
  const [statusForm] = Form.useForm();
  const [reworkForm] = Form.useForm();
  const [issueForm] = Form.useForm();

  const { data: order, isLoading } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => workOrderApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: parts } = useQuery({
    queryKey: ['work-order-parts', id],
    queryFn: async () => {
      const orderData = await workOrderApi.get(id).then((r) => r.data);
      return orderData as Record<string, unknown>;
    },
    enabled: !!id && activeTab === 'parts',
  });

  const { data: inspections } = useQuery({
    queryKey: ['inspections-for-order', id],
    queryFn: () => inspectionApi.list({ work_order_id: id }).then((r) => r.data.items),
    enabled: !!id && activeTab === 'inspections',
  });

  const { data: shortages } = useQuery({
    queryKey: ['shortages-for-order', id],
    queryFn: () => shortageApi.list({ work_order_id: id }).then((r) => r.data.items),
    enabled: !!id && activeTab === 'shortages',
  });

  const statusMutation = useMutation({
    mutationFn: (values: { status: string }) =>
      workOrderApi.changeStatus(id, values.status),
    onSuccess: () => {
      message.success('状态更新成功');
      setStatusModalOpen(false);
      statusForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
    },
    onError: () => message.error('状态更新失败'),
  });

  const reworkMutation = useMutation({
    mutationFn: () => workOrderApi.rework(id),
    onSuccess: (res) => {
      message.success('返工工单已创建');
      setReworkModalOpen(false);
      reworkForm.resetFields();
      navigate({ to: '/work-orders/$id', params: { id: String(res.data.id) } });
    },
    onError: () => message.error('返工工单创建失败'),
  });

  const issueMutation = useMutation({
    mutationFn: () =>
      partApi.issuePart(id, selectedPart!.id),
    onSuccess: () => {
      message.success('发料成功');
      setIssueModalOpen(false);
      issueForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
    },
    onError: () => message.error('发料失败'),
  });

  if (isLoading) return <Card loading />;

  const currentStep = statusFlow.indexOf(order?.status ?? 'pending');
  const effectiveStep = order?.is_rework ? -1 : (currentStep >= 0 ? currentStep : 0);

  const basicTab = (
    <div>
      <Steps
        current={effectiveStep}
        items={statusFlow.map((s) => ({
          title: statusConfig[s]?.text ?? s,
        }))}
        style={{ marginBottom: 24 }}
      />

      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="工单号">{order?.order_no}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusConfig[order?.status ?? '']?.color}>
            {statusConfig[order?.status ?? '']?.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="客户">{order?.customer_name}</Descriptions.Item>
        <Descriptions.Item label="联系电话">{order?.customer_phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="车牌号">{order?.vehicle_plate}</Descriptions.Item>
        <Descriptions.Item label="车型">{order?.vehicle_model || '-'}</Descriptions.Item>
        <Descriptions.Item label="VIN">{order?.vin || '-'}</Descriptions.Item>
        <Descriptions.Item label="优先级">
          <Tag color={priorityLabels[order?.priority ?? 'normal']?.color}>
            {priorityLabels[order?.priority ?? 'normal']?.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="进厂里程">{order?.mileage_in ? `${order.mileage_in} km` : '-'}</Descriptions.Item>
        <Descriptions.Item label="出厂里程">{order?.mileage_out ? `${order.mileage_out} km` : '-'}</Descriptions.Item>
        <Descriptions.Item label="客户诉求" span={2}>{order?.customer_complaint || '-'}</Descriptions.Item>
        <Descriptions.Item label="诊断" span={2}>{order?.diagnosis || '-'}</Descriptions.Item>
        <Descriptions.Item label="维修备注" span={2}>{order?.repair_notes || '-'}</Descriptions.Item>
        <Descriptions.Item label="预计完成">{order?.estimated_completion ? dayjs(order.estimated_completion).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
        <Descriptions.Item label="实际完成">{order?.actual_completion ? dayjs(order.actual_completion).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
        <Descriptions.Item label="总金额">¥{(order?.total_amount ?? 0).toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(order?.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      {order?.is_rework && (
        <Card size="small" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          <Tag color="red">返工工单</Tag>
          {order.original_order_id && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate({ to: '/work-orders/$id', params: { id: order.original_order_id! } })}
            >
              查看原始工单
            </Button>
          )}
        </Card>
      )}

      <Space>
        <Button type="primary" onClick={() => setStatusModalOpen(true)}>
          变更状态
        </Button>
        {order?.status !== 'completed' && order?.status !== 'closed' && order?.status !== 'rework' && (
          <Button danger icon={<UndoOutlined />} onClick={() => setReworkModalOpen(true)}>
            创建返工
          </Button>
        )}
      </Space>
    </div>
  );

  const partsTab = (
    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
      配件清单在工单关联配件后显示
    </div>
  );

  const inspectionsTypeLabels: Record<string, string> = {
    pre_inspection: '工前检查',
    in_progress: '过程检查',
    final: '终检',
  };
  const inspectionsResultLabels: Record<string, { text: string; color: string }> = {
    pass: { text: '合格', color: 'green' },
    fail: { text: '不合格', color: 'red' },
    conditional: { text: '有条件通过', color: 'orange' },
  };

  const inspectionsTab = (
    <div>
      {(inspections ?? []).length > 0 ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          {(inspections ?? []).map((insp) => (
            <Card key={insp.id} size="small" title={`${inspectionsTypeLabels[insp.type] ?? insp.type} - ${dayjs(insp.created_at).format('YYYY-MM-DD HH:mm')}`}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="结果">
                  <Tag color={inspectionsResultLabels[insp.result]?.color}>
                    {inspectionsResultLabels[insp.result]?.text ?? insp.result}
                  </Tag>
                </Descriptions.Item>
                {insp.notes && <Descriptions.Item label="备注" span={2}>{insp.notes}</Descriptions.Item>}
              </Descriptions>
              {insp.photos && insp.photos.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Image.PreviewGroup>
                    {insp.photos.map((photo, idx) => (
                      <Image key={idx} width={80} height={80} src={photo.photo_url} style={{ marginRight: 8, objectFit: 'cover', borderRadius: 4 }} />
                    ))}
                  </Image.PreviewGroup>
                </div>
              )}
            </Card>
          ))}
        </Space>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无质检记录</div>
      )}
    </div>
  );

  const shortageStatusConfig: Record<string, { text: string; color: string }> = {
    pending: { text: '待处理', color: 'red' },
    procuring: { text: '采购中', color: 'orange' },
    arrived: { text: '已到货', color: 'green' },
    substituted: { text: '已替代', color: 'blue' },
    cancelled: { text: '已取消', color: 'default' },
  };

  const shortagesTab = (
    <div>
      {(shortages ?? []).length > 0 ? (
        <Table
          rowKey="id"
          size="small"
          dataSource={shortages ?? []}
          pagination={false}
          columns={[
            { title: '配件名称', dataIndex: 'part_name', key: 'part_name' },
            { title: '需求数量', dataIndex: 'requested_quantity', key: 'requested_quantity' },
            { title: '可用数量', dataIndex: 'available_quantity', key: 'available_quantity' },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (v: string) => <Tag color={shortageStatusConfig[v]?.color}>{shortageStatusConfig[v]?.text}</Tag>,
            },
            {
              title: '预计到货',
              dataIndex: 'expected_arrival',
              key: 'expected_arrival',
              render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
            },
            {
              title: '操作',
              key: 'action',
              render: (_: unknown, record: { id: string }) => (
                <Button type="link" size="small" onClick={() => navigate({ to: '/shortages/$id', params: { id: record.id } })}>
                  详情
                </Button>
              ),
            },
          ]}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无缺件记录</div>
      )}
    </div>
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/work-orders' })}>
          返回列表
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>{order?.order_no}</span>
        <Tag color={statusConfig[order?.status ?? '']?.color}>
          {statusConfig[order?.status ?? '']?.text}
        </Tag>
      </Space>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'basic', label: '基本信息', children: basicTab },
          { key: 'parts', label: '配件清单', children: partsTab },
          { key: 'inspections', label: '质检记录', children: inspectionsTab },
          { key: 'shortages', label: '缺件记录', children: shortagesTab },
        ]}
      />

      <Modal
        title="变更状态"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={() => statusForm.submit()}
      >
        <Form form={statusForm} onFinish={statusMutation.mutate} layout="vertical">
          <Form.Item name="status" label="目标状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建返工工单"
        open={reworkModalOpen}
        onCancel={() => setReworkModalOpen(false)}
        onOk={() => reworkForm.submit()}
      >
        <Form form={reworkForm} onFinish={() => reworkMutation.mutate()} layout="vertical">
          <Form.Item name="reason" label="返工原因" rules={[{ required: true, message: '请输入返工原因' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`发料 - ${selectedPart?.part_name ?? ''}`}
        open={issueModalOpen}
        onCancel={() => setIssueModalOpen(false)}
        onOk={() => issueForm.submit()}
      >
        <Form form={issueForm} onFinish={() => issueMutation.mutate()} layout="vertical">
          <Form.Item name="quantity" label="发料数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
