import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Tag,
  Popconfirm,
  Descriptions,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeAPI } from '@/api';
import type { Store } from '@/types';
import dayjs from 'dayjs';

function StoreManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [form] = Form.useForm();

  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeAPI.getStores().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: storeAPI.createStore,
    onSuccess: () => {
      message.success('门店创建成功');
      setShowModal(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Store> }) =>
      storeAPI.updateStore(id, data),
    onSuccess: () => {
      message.success('门店更新成功');
      setShowModal(false);
      setEditingStore(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const handleAdd = () => {
    setEditingStore(null);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    form.setFieldsValue({
      ...store,
    });
    setShowModal(true);
  };

  const handleViewDetail = (store: Store) => {
    setSelectedStore(store);
    setShowDetailModal(true);
  };

  const handleSubmit = async (values: any) => {
    if (editingStore) {
      await updateMutation.mutateAsync({ id: editingStore.id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const columns = [
    {
      title: '门店编码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => (
        <span className="font-mono text-sm font-medium">{code}</span>
      ),
    },
    {
      title: '门店名称',
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: '所在城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '店长',
      dataIndex: 'manager_name',
      key: 'manager_name',
      width: 100,
      render: (name) => name || '未分配',
    },
    {
      title: '月度销售目标',
      dataIndex: 'monthly_sales_target',
      key: 'monthly_sales_target',
      width: 130,
      render: (val: number) => (
        <span className="font-medium">¥{val.toLocaleString()}</span>
      ),
    },
    {
      title: '本月损耗',
      dataIndex: 'current_month_loss',
      key: 'current_month_loss',
      width: 120,
      render: (val: number) => (
        <span className="font-semibold text-red-500">¥{val.toFixed(2)}</span>
      ),
    },
    {
      title: '本月损耗率',
      dataIndex: 'current_month_loss_rate',
      key: 'current_month_loss_rate',
      width: 150,
      render: (rate: number, record: Store) => {
        const isAbnormal = rate > 5;
        return (
          <div className="flex items-center gap-2">
            <Progress
              percent={rate * 5}
              showInfo={false}
              size="small"
              strokeColor={isAbnormal ? '#f5222d' : '#52c41a'}
              style={{ width: 60 }}
            />
            <span
              className={`font-medium ${isAbnormal ? 'text-red-500' : ''}`}
            >
              {rate.toFixed(2)}%
            </span>
            {isAbnormal && <Tag color="red">异常</Tag>}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean) =>
        active ? (
          <Tag color="green">营业中</Tag>
        ) : (
          <Tag color="default">已停用</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record: Store) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认停用此门店？"
            description="停用后该门店将无法创建新的报损单"
            onConfirm={() => {
              updateMutation.mutate({
                id: record.id,
                data: { ...record, is_active: false },
              });
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              停用
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small" className="shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShopOutlined className="text-coffee-600 text-xl" />
            <span className="text-gray-600">
              共 <span className="font-bold text-coffee-600">{stores?.length || 0}</span> 家门店
            </span>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增门店
          </Button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={stores}
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 家门店`,
          }}
        />
      </Card>

      <Modal
        title={editingStore ? '编辑门店' : '新增门店'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_active: true, monthly_sales_target: 100000 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="门店编码"
              rules={[{ required: true, message: '请输入门店编码' }]}
            >
              <Input placeholder="例如：ST001" maxLength={20} />
            </Form.Item>
            <Form.Item
              name="name"
              label="门店名称"
              rules={[{ required: true, message: '请输入门店名称' }]}
            >
              <Input placeholder="例如：南京东路店" maxLength={100} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="city"
              label="所在城市"
              rules={[{ required: true, message: '请输入所在城市' }]}
            >
              <Input placeholder="例如：上海" />
            </Form.Item>
            <Form.Item
              name="monthly_sales_target"
              label="月度销售目标 (元)"
              rules={[
                { required: true, message: '请输入月度销售目标' },
                { type: 'number', min: 0, message: '目标金额不能为负' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000}
                formatter={(value) =>
                  `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) =>
                  value ? Number(value.replace(/\¥\s?|(,*)/g, '')) : 0
                }
              />
            </Form.Item>
          </div>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input placeholder="请输入详细地址" maxLength={255} />
          </Form.Item>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button onClick={() => setShowModal(false)}>取消</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingStore ? '保存修改' : '创建门店'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="门店详情"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              if (selectedStore) {
                handleEdit(selectedStore);
                setShowDetailModal(false);
              }
            }}
          >
            编辑
          </Button>,
        ]}
        width={600}
      >
        {selectedStore && (
          <div className="space-y-4">
            <Card
              size="small"
              className={`${selectedStore.current_month_loss_rate > 5 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedStore.name}</h3>
                  <p className="text-sm text-gray-500">{selectedStore.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">本月损耗率</p>
                  <p
                    className={`text-2xl font-bold ${selectedStore.current_month_loss_rate > 5 ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {selectedStore.current_month_loss_rate.toFixed(2)}%
                  </p>
                </div>
              </div>
              <Progress
                percent={Math.min(selectedStore.current_month_loss_rate * 10, 100)}
                showInfo={false}
                strokeColor={selectedStore.current_month_loss_rate > 5 ? '#f5222d' : '#52c41a'}
                className="mt-2"
              />
            </Card>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="门店编码">
                {selectedStore.code}
              </Descriptions.Item>
              <Descriptions.Item label="门店名称">
                {selectedStore.name}
              </Descriptions.Item>
              <Descriptions.Item label="所在城市">
                {selectedStore.city}
              </Descriptions.Item>
              <Descriptions.Item label="店长">
                {selectedStore.manager_name || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="详细地址" span={2}>
                {selectedStore.address}
              </Descriptions.Item>
              <Descriptions.Item label="月度销售目标">
                ¥{selectedStore.monthly_sales_target.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="本月损耗金额">
                <span className="text-red-500 font-medium">
                  ¥{selectedStore.current_month_loss.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedStore.is_active ? (
                  <Tag color="green">营业中</Tag>
                ) : (
                  <Tag color="default">已停用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedStore.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StoreManagement;
