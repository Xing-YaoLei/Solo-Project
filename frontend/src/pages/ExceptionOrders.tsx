import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, Typography, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ExceptionOrder, GroupBatch } from '../types';
import { ExceptionType, ExceptionSeverity, ExceptionResolution } from '../types';
import { getExceptionOrders, createExceptionOrder, resolveExceptionOrder } from '../api/exceptionOrders';
import { getGroupBatches } from '../api/groupBatches';
import StatusBadge from '../components/StatusBadge';

const { Title } = Typography;

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

  const handleOpenResolve = (record: ExceptionOrder) => {
    setCurrentOrder(record);
    resolveForm.resetFields();
    setResolveModalOpen(true);
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
    { title: '异常单号', dataIndex: 'exceptionNo', key: 'exceptionNo' },
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      render: (val: ExceptionType) => exceptionTypeOptions.find((o) => o.value === val)?.label || val,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (val: ExceptionSeverity) => <StatusBadge status={val} type="severity" />,
    },
    { title: '影响范围', dataIndex: 'impactDescription', key: 'impactDescription', ellipsis: true },
    { title: '责任归属', dataIndex: 'responsibility', key: 'responsibility' },
    {
      title: '处理结果',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (val: ExceptionResolution) => <StatusBadge status={val} type="resolution" />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ExceptionOrder) => (
        <Space>
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
        scroll={{ x: 1100 }}
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
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="responsibility" label="责任归属" rules={[{ required: true, message: '请输入责任归属' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理异常单"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); resolveForm.resetFields(); setCurrentOrder(null); }}
        destroyOnClose
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item name="resolution" label="处理结果" rules={[{ required: true, message: '请选择处理结果' }]}>
            <Select options={resolutionOptions.filter((o) => o.value !== ExceptionResolution.Pending)} />
          </Form.Item>
          <Form.Item name="resolutionNotes" label="处理说明" rules={[{ required: true, message: '请输入处理说明' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="resolvedBy" label="处理人" rules={[{ required: true, message: '请输入处理人' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ExceptionOrders;
