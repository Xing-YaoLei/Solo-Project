import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Tag, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { visitRules, areas } from '../../api/apiClient';
import type { VisitRecordRule, Area } from '../../types';

const priorityColors: Record<string, string> = {
  Normal: 'blue',
  Important: 'orange',
  Critical: 'red',
};

const priorityLabels: Record<string, string> = {
  Normal: '普通',
  Important: '重要',
  Critical: '紧急',
};

const VisitRules: React.FC = () => {
  const [data, setData] = useState<VisitRecordRule[]>([]);
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VisitRecordRule | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await visitRules.getAll();
      setData(res.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await areas.getAll();
      setAreaList(res.data);
    } catch {
      setAreaList([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAreas();
  }, [fetchData, fetchAreas]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, priority: 'Normal' });
    setModalOpen(true);
  };

  const handleEdit = (record: VisitRecordRule) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await visitRules.update(editing.id, values);
        message.success('更新成功');
      } else {
        await visitRules.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {}
  };

  const handleToggleActive = async (record: VisitRecordRule) => {
    try {
      await visitRules.update(record.id, { ...record, isActive: !record.isActive });
      message.success('状态更新成功');
      fetchData();
    } catch {}
  };

  const columns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '探访频次(天)', dataIndex: 'frequencyDays', key: 'frequencyDays' },
    { title: '要求时长(分钟)', dataIndex: 'requiredDurationMinutes', key: 'requiredDurationMinutes' },
    {
      title: '区域',
      dataIndex: 'areaId',
      key: 'areaId',
      render: (val: number, record: VisitRecordRule) => record.areaName || val,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (val: string) => <Tag color={priorityColors[val] || 'blue'}>{priorityLabels[val] || val}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean, record: VisitRecordRule) => (
        <Space>
          <Tag color={val ? 'green' : 'orange'}>{val ? '启用' : '停用'}</Tag>
          <Switch size="small" checked={val} onChange={() => handleToggleActive(record)} />
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: VisitRecordRule) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增规则
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <Modal
        title={editing ? '编辑规则' : '新增规则'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="frequencyDays" label="探访频次(天)" rules={[{ required: true, message: '请输入频次' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="requiredDurationMinutes" label="要求时长(分钟)" rules={[{ required: true, message: '请输入时长' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="areaId" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
            <Select>
              {areaList.map((a) => (
                <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select>
              <Select.Option value="Normal">普通</Select.Option>
              <Select.Option value="Important">重要</Select.Option>
              <Select.Option value="Critical">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VisitRules;
