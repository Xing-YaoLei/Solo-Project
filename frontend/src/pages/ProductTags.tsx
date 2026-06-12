import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, InputNumber, Select, Popconfirm, Typography, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ProductTag } from '../types';
import { getProductTags, createProductTag, updateProductTag, deleteProductTag } from '../api/productTags';

const { Title } = Typography;

const ProductTags: React.FC = () => {
  const [data, setData] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductTag | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProductTags();
      setData(res.data.data || []);
    } catch {
      // handled by interceptor
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
    setModalOpen(true);
  };

  const handleEdit = (record: ProductTag) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProductTag(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled by interceptor
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await updateProductTag(editingItem.id, values);
        message.success('更新成功');
      } else {
        await createProductTag(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      // validation or api error
    }
  };

  const columns = [
    { title: '标签编码', dataIndex: 'tagCode', key: 'tagCode' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '存储温度',
      key: 'storageTemp',
      render: (_: unknown, record: ProductTag) => `${record.storageTempMin}~${record.storageTempMax}°C`,
    },
    {
      title: '保质期(h)',
      dataIndex: 'shelfLifeHours',
      key: 'shelfLifeHours',
    },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    {
      title: '单价(¥)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val: number) => val.toFixed(2),
    },
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ProductTag) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除此标签？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>商品标签管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增标签</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑标签' : '新增标签'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="tagCode" label="标签编码" rules={[{ required: true, message: '请输入标签编码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="productName" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入分类' }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="storageTempMin" label="最低温度(°C)" rules={[{ required: true, message: '请输入' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="storageTempMax" label="最高温度(°C)" rules={[{ required: true, message: '请输入' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="shelfLifeHours" label="保质期(h)" rules={[{ required: true, message: '请输入保质期' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="unitPrice" label="单价(¥)" rules={[{ required: true, message: '请输入单价' }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="状态" initialValue={true}>
            <Select options={[{ value: true, label: '启用' }, { value: false, label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ProductTags;
