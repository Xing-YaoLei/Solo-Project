import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, InputNumber, Select, Popconfirm, Typography, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { LeaderTier } from '../types';
import { getLeaderTiers, createLeaderTier, updateLeaderTier, deleteLeaderTier } from '../api/leaderTiers';

const { Title } = Typography;

const LeaderTiers: React.FC = () => {
  const [data, setData] = useState<LeaderTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeaderTier | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLeaderTiers();
      setData(res.data.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (record: LeaderTier) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLeaderTier(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await updateLeaderTier(editingItem.id, values);
        message.success('更新成功');
      } else {
        await createLeaderTier(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      // validation error
    }
  };

  const columns = [
    { title: '等级名称', dataIndex: 'tierName', key: 'tierName' },
    { title: '等级编码', dataIndex: 'tierCode', key: 'tierCode' },
    {
      title: '最低订单额(¥)',
      dataIndex: 'minOrderAmount',
      key: 'minOrderAmount',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '佣金比例(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (v: number) => `${v}%`,
    },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean) => (
        <Select
          value={val}
          size="small"
          style={{ width: 80 }}
          options={[
            { value: true, label: '启用' },
            { value: false, label: '停用' },
          ]}
          disabled
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: LeaderTier) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除此等级？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>团长等级管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增等级</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑等级' : '新增等级'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="tierName" label="等级名称" rules={[{ required: true, message: '请输入等级名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tierCode" label="等级编码" rules={[{ required: true, message: '请输入等级编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="minOrderAmount" label="最低订单额(¥)" rules={[{ required: true, message: '请输入最低订单额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="commissionRate" label="佣金比例(%)" rules={[{ required: true, message: '请输入佣金比例' }]}>
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="状态" initialValue={true}>
            <Select options={[{ value: true, label: '启用' }, { value: false, label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default LeaderTiers;
