import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Tag, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { thresholds, areas } from '../../api/apiClient';
import type { ActivityCheckInThreshold, Area } from '../../types';

const ActivityThresholds: React.FC = () => {
  const [data, setData] = useState<ActivityCheckInThreshold[]>([]);
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityCheckInThreshold | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await thresholds.getAll();
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
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (record: ActivityCheckInThreshold) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await thresholds.update(editing.id, values);
        message.success('更新成功');
      } else {
        await thresholds.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {}
  };

  const handleToggleActive = async (record: ActivityCheckInThreshold) => {
    try {
      await thresholds.update(record.id, { ...record, isActive: !record.isActive });
      message.success('状态更新成功');
      fetchData();
    } catch {}
  };

  const columns = [
    { title: '活动名称', dataIndex: 'activityName', key: 'activityName' },
    { title: '要求签到次数', dataIndex: 'requiredCheckIns', key: 'requiredCheckIns' },
    { title: '统计周期(天)', dataIndex: 'periodDays', key: 'periodDays' },
    {
      title: '区域',
      dataIndex: 'areaId',
      key: 'areaId',
      render: (val: number, record: ActivityCheckInThreshold) => record.areaName || val,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean, record: ActivityCheckInThreshold) => (
        <Space>
          <Tag color={val ? 'green' : 'orange'}>{val ? '启用' : '停用'}</Tag>
          <Switch size="small" checked={val} onChange={() => handleToggleActive(record)} />
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ActivityCheckInThreshold) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增阈值
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
        title={editing ? '编辑阈值' : '新增阈值'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="activityName" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="requiredCheckIns" label="要求签到次数" rules={[{ required: true, message: '请输入签到次数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="periodDays" label="统计周期(天)" rules={[{ required: true, message: '请输入统计周期' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="areaId" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
            <Select>
              {areaList.map((a) => (
                <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
              ))}
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

export default ActivityThresholds;
