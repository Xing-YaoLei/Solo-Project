import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, Typography, Space, message, Tag, Descriptions, Timeline, Empty } from 'antd';
import { PlusOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ExceptionOrder, GroupBatch } from '../types';
import { ExceptionType, ExceptionSeverity, ExceptionResolution } from '../types';
import { getExceptionOrders, createExceptionOrder, resolveExceptionOrder, getExceptionOrder } from '../api/exceptionOrders';
import { getGroupBatches } from '../api/groupBatches';
import StatusBadge from '../components/StatusBadge';

const { Title, Text, Paragraph } = Typography;

const exceptionTypeOptions = [
  { value: ExceptionType.Uncollected, label: '未取货' },
  { value: ExceptionType.Damaged, label: '损坏' },
  { value: ExceptionType.TemperatureAbnormal, label: '温度异常' },
  { value: ExceptionType.QuantityMismatch, label: '数量不符' },
];

const severityOptions = [
  { value: ExceptionSeverity.Low, label: '低' },
  { value: ExceptionSeverity.Medium, label: '中' },
  { value: ExceptionSeverity.High, label: '高' },
  { value: ExceptionSeverity.Critical, label: '严重' },
];

const resolutionOptions = [
  { value: ExceptionResolution.Pending, label: '待处理' },
  { value: ExceptionResolution.Refunded, label: '退款' },
  { value: ExceptionResolution.Reshipped, label: '补发' },
  { value: ExceptionResolution.Discarded, label: '丢弃' },
  { value: ExceptionResolution.Compromised, label: '协商' },
];

const ExceptionOrders: React.FC = () => {
  const [data, setData] = useState<ExceptionOrder[]>([]);
  const [batches, setBatches] = useState<GroupBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ exceptionType?: ExceptionType; severity?: ExceptionSeverity; resolution?: ExceptionResolution }>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ExceptionOrder | null>(null);
  const [createForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getExceptionOrders(filters);
      setData(res.data.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await getGroupBatches();
      setBatches(res.data.data || []);
    } catch {
      // handled
    }
  };

  useEffect(() => {
    fetchData();
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await createExceptionOrder(values);
      message.success('创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch {
      // validation error
    }
  };

  const [detailLoading, setDetailLoading] = useState(false);

  const handleOpenResolve = (record: ExceptionOrder) => {
    setCurrentOrder(record);
    resolveForm.resetFields();
    setResolveModalOpen(true);
  };

  const handleOpenDetail = async (record: ExceptionOrder) => {
    setDetailLoading(true);
    try {
      const res = await getExceptionOrder(record.id);
      setCurrentOrder(res.data.data);
      setDetailModalOpen(true);
    } catch {
      message.error('获取异常单详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!currentOrder) return;
    try {
      const values = await resolveForm.validateFields();
      await resolveExceptionOrder(currentOrder.id, values);
      message.success('处理成功');
      setResolveModalOpen(false);
      resolveForm.resetFields();
      setCurrentOrder(null);
      fetchData();
    } catch {
      // validation error
    }
  };

  const columns = [
    { title: '异常单号', dataIndex: 'exceptionNo', key: 'exceptionNo', width: 140 },
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      width: 100,
      render: (val: ExceptionType) => exceptionTypeOptions.find((o) => o.value === val)?.label || val,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (val: ExceptionSeverity) => <StatusBadge status={val} type="severity" />,
    },
    {
      title: '影响范围',
      dataIndex: 'impactDescription',
      key: 'impactDescription',
      ellipsis: true,
      width: 220,
      render: (val: string) => (
        <Text ellipsis={{ tooltip: val }} style={{ maxWidth: 200 }}>
          {val}
        </Text>
      ),
    },
    {
      title: '责任归属',
      dataIndex: 'responsibility',
      key: 'responsibility',
      ellipsis: true,
      width: 180,
      render: (val: string) => (
        <Text ellipsis={{ tooltip: val }} style={{ maxWidth: 160 }}>
          {val}
        </Text>
      ),
    },
    {
      title: '处理结果',
      dataIndex: 'resolutionNotes',
      key: 'resolutionNotes',
      ellipsis: true,
      width: 200,
      render: (val: string, record: ExceptionOrder) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <StatusBadge status={record.resolution} type="resolution" />
          {val && (
            <Text type="secondary" ellipsis={{ tooltip: val }} style={{ maxWidth: 180, fontSize: 12 }}>
              {val}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: ExceptionOrder) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)}>
            详情
          </Button>
          {record.resolution === ExceptionResolution.Pending && (
            <Button type="primary" size="small" onClick={() => handleOpenResolve(record)}>处理</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>异常单处理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); createForm.setFieldsValue({ exceptionType: ExceptionType.Uncollected }); setCreateModalOpen(true); }}>
          创建异常单
        </Button>
      </div>

      <Space wrap>
        <Select
          placeholder="异常类型"
          allowClear
          style={{ width: 150 }}
          options={[{ value: '', label: '全部' }, ...exceptionTypeOptions]}
          onChange={(val) => handleFilterChange('exceptionType', val)}
        />
        <Select
          placeholder="严重程度"
          allowClear
          style={{ width: 120 }}
          options={[{ value: '', label: '全部' }, ...severityOptions]}
          onChange={(val) => handleFilterChange('severity', val)}
        />
        <Select
          placeholder="处理结果"
          allowClear
          style={{ width: 120 }}
          options={[{ value: '', label: '全部' }, ...resolutionOptions]}
          onChange={(val) => handleFilterChange('resolution', val)}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1350 }}
      />

      <Modal
        title="创建异常单"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="groupBatchId" label="关联批次" rules={[{ required: true, message: '请选择批次' }]}>
            <Select placeholder="请选择批次">
              {batches.map((b) => (
                <Select.Option key={b.id} value={b.id}>{b.batchNo} - {b.batchName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="exceptionType" label="异常类型" rules={[{ required: true, message: '请选择异常类型' }]}>
            <Select options={exceptionTypeOptions} />
          </Form.Item>
          <Form.Item name="severity" label="严重程度" rules={[{ required: true, message: '请选择严重程度' }]}>
            <Select options={severityOptions} />
          </Form.Item>
          <Form.Item name="impactDescription" label="影响范围" rules={[{ required: true, message: '请输入影响范围' }]}>
            <Input.TextArea rows={3} placeholder="请描述受影响的商品、数量、批次等信息" />
          </Form.Item>
          <Form.Item name="responsibility" label="责任归属" rules={[{ required: true, message: '请输入责任归属' }]}>
            <Input.TextArea rows={2} placeholder="请说明责任方及判定依据" />
          </Form.Item>
          <Form.Item name="resolutionNotes" label="处理建议">
            <Input.TextArea rows={3} placeholder="请填写初步的处理建议" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常单详情"
        open={detailModalOpen}
        confirmLoading={detailLoading}
        onCancel={() => { setDetailModalOpen(false); setCurrentOrder(null); }}
        footer={[
          currentOrder?.resolution === ExceptionResolution.Pending && (
            <Button key="resolve" type="primary" loading={detailLoading} onClick={() => { setDetailModalOpen(false); handleOpenResolve(currentOrder!); }}>
              处理此异常单
            </Button>
          ),
          <Button key="close" onClick={() => { setDetailModalOpen(false); setCurrentOrder(null); }}>关闭</Button>,
        ]}
        width={900}
        destroyOnClose
      >
        {currentOrder && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="异常单号">{currentOrder.exceptionNo}</Descriptions.Item>
              <Descriptions.Item label="关联批次">{currentOrder.batchNo}</Descriptions.Item>
              <Descriptions.Item label="异常类型">
                {exceptionTypeOptions.find((o) => o.value === currentOrder.exceptionType)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <StatusBadge status={currentOrder.severity} type="severity" />
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <StatusBadge status={currentOrder.resolution} type="resolution" />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentOrder.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {currentOrder.resolvedAt && (
                <>
                  <Descriptions.Item label="处理人">{currentOrder.resolvedBy}</Descriptions.Item>
                  <Descriptions.Item label="处理时间">
                    {dayjs(currentOrder.resolvedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            <div>
              <Text strong style={{ fontSize: 14, color: '#faad14' }}>影响范围</Text>
              <Paragraph style={{ marginTop: 8, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
                {currentOrder.impactDescription || '无'}
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ fontSize: 14, color: '#fa541c' }}>责任归属</Text>
              <Paragraph style={{ marginTop: 8, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
                {currentOrder.responsibility || '未填写'}
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ fontSize: 14, color: '#1890ff' }}>处理结果</Text>
              <Paragraph style={{ marginTop: 8, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
                {currentOrder.resolutionNotes || '未填写'}
              </Paragraph>
            </div>

            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 14, color: '#722ed1' }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                状态变更历史（含自提状态留痕）
              </Text>
              <div style={{ marginTop: 12, padding: 16, background: '#f9f0ff', borderRadius: 4 }}>
                {currentOrder.statusHistory && currentOrder.statusHistory.length > 0 ? (
                  <Timeline
                    mode="left"
                    items={currentOrder.statusHistory.map((log) => ({
                      color: log.fromStatus ? 'blue' : 'green',
                      label: (
                        <Space direction="vertical" size={0} style={{ width: 140 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dayjs(log.changedAt).format('MM-DD HH:mm')}
                          </Text>
                          <Tag color="purple" style={{ fontSize: 11 }}>
                            {log.entityType}
                          </Tag>
                        </Space>
                      ),
                      children: (
                        <div>
                          <Space size={8}>
                            {log.fromStatus && (
                              <>
                                <Tag>{log.fromStatus}</Tag>
                                <Text type="secondary">→</Text>
                              </>
                            )}
                            <Tag color="blue">{log.toStatus}</Tag>
                          </Space>
                          <div style={{ marginTop: 4 }}>
                            {log.remark && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                原因：{log.remark}
                              </Text>
                            )}
                            {log.changedBy && (
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                操作人：{log.changedBy}
                              </Text>
                            )}
                          </div>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Empty description="暂无状态变更记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title="处理异常单"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); resolveForm.resetFields(); setCurrentOrder(null); }}
        destroyOnClose
        width={700}
      >
        {currentOrder && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ padding: 12, background: '#fafafa', borderRadius: 4 }}>
              <Text type="secondary">当前异常单：</Text>
              <Tag color="blue">{currentOrder.exceptionNo}</Tag>
              <Text type="secondary">批次：</Text>
              <span>{currentOrder.batchNo}</span>
            </div>
            <div style={{ padding: 12, background: '#fffbe6', borderRadius: 4 }}>
              <Text strong style={{ color: '#faad14' }}>影响范围：</Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{currentOrder.impactDescription || '无'}</Paragraph>
            </div>
            <div style={{ padding: 12, background: '#fff1f0', borderRadius: 4 }}>
              <Text strong style={{ color: '#fa541c' }}>责任归属：</Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{currentOrder.responsibility || '无'}</Paragraph>
            </div>
            {currentOrder.resolutionNotes && currentOrder.resolution === ExceptionResolution.Pending && (
              <div style={{ padding: 12, background: '#f6ffed', borderRadius: 4 }}>
                <Text strong style={{ color: '#52c41a' }}>建议处理方案（系统自动生成）：</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{currentOrder.resolutionNotes}</Paragraph>
              </div>
            )}
            <Form form={resolveForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="resolution" label="处理结果" rules={[{ required: true, message: '请选择处理结果' }]}>
                <Select options={resolutionOptions.filter((o) => o.value !== ExceptionResolution.Pending)} />
              </Form.Item>
              <Form.Item name="resolutionNotes" label="处理说明" rules={[{ required: true, message: '请输入处理说明' }]}>
                <Input.TextArea rows={4} placeholder="请详细说明处理过程和结果" />
              </Form.Item>
              <Form.Item name="resolvedBy" label="处理人" rules={[{ required: true, message: '请输入处理人' }]}>
                <Input placeholder="请输入处理人姓名" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default ExceptionOrders;
