import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Card, Button, Space, Tag, Input, Select, Modal, Form, InputNumber, message,
} from 'antd';
import type { ColumnType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { partApi } from '../lib/api';
import type { Part, PartCreate } from '../lib/types';

export default function PartsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [form] = Form.useForm<PartCreate>();

  const { data, isLoading } = useQuery({
    queryKey: ['parts', search, categoryFilter],
    queryFn: () =>
      partApi
        .list({ search: search || undefined, category: categoryFilter })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: PartCreate) =>
      editingPart ? partApi.update(editingPart.id, values) : partApi.create(values),
    onSuccess: () => {
      message.success(editingPart ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingPart(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
    onError: () => message.error(editingPart ? '更新失败' : '创建失败'),
  });

  const handleEdit = (record: Part) => {
    setEditingPart(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingPart(null);
    form.resetFields();
    setModalOpen(true);
  };

  const columns: ColumnType<Part>[] = [
    { title: '配件编号', dataIndex: 'part_no', key: 'part_no', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100, render: (v: string) => v || '-' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60, render: (v: string) => v || '个' },
    {
      title: '库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 90,
      render: (stock: number, record: Part) =>
        stock <= record.min_stock ? (
          <Space>
            <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{stock}</span>
            <Tag color="error" style={{ fontSize: 11 }}>低库存</Tag>
          </Space>
        ) : (
          stock
        ),
    },
    { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock', width: 90 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (v: number) => `¥${Number(v ?? 0).toFixed(2)}` },
    { title: '存放位置', dataIndex: 'location', key: 'location', width: 100, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: Part) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              placeholder="搜索编号/名称"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="分类筛选"
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'engine', label: '发动机' },
                { value: 'brake', label: '制动系统' },
                { value: 'electrical', label: '电气系统' },
                { value: 'body', label: '车身' },
                { value: 'suspension', label: '悬挂系统' },
                { value: 'other', label: '其他' },
              ]}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['parts'] })}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加配件
            </Button>
          </Space>
        </Space>
      </Card>

      <Card bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 950 }}
        />
      </Card>

      <Modal
        title={editingPart ? '编辑配件' : '添加配件'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingPart(null); form.resetFields(); }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="part_no" label="配件编号" rules={[{ required: true, message: '请输入配件编号' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category" label="分类" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: 'engine', label: '发动机' },
                  { value: 'brake', label: '制动系统' },
                  { value: 'electrical', label: '电气系统' },
                  { value: 'body', label: '车身' },
                  { value: 'suspension', label: '悬挂系统' },
                  { value: 'other', label: '其他' },
                ]}
              />
            </Form.Item>
            <Form.Item name="unit" label="单位" style={{ flex: 1 }}>
              <Input placeholder="个/套/支等" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="stock_quantity" label="库存数量" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="min_stock" label="最低库存" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="unit_price" label="单价" rules={[{ required: true, message: '请输入单价' }]} style={{ flex: 1 }}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
            <Form.Item name="location" label="存放位置" style={{ flex: 1 }}>
              <Input placeholder="如: A-3-2" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
