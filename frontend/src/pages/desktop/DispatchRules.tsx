import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Space,
  Card,
  Tag,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { dispatchRuleAPI, userAPI } from '@/services/api';
import dayjs from 'dayjs';

export default function DesktopDispatchRules() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['dispatchRules'],
    queryFn: () => dispatchRuleAPI.list(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editingRule ? dispatchRuleAPI.update(editingRule.id, data) : dispatchRuleAPI.create(data),
    onSuccess: () => {
      message.success(editingRule ? '更新成功' : '创建成功');
      setIsModalOpen(false);
      form.resetFields();
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ['dispatchRules'] });
    },
    onError: () => message.error('操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dispatchRuleAPI.delete(id),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['dispatchRules'] });
    },
    onError: () => message.error('删除失败'),
  });

  const handleSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  const handleEdit = (record: any) => {
    setEditingRule(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该派工规则吗？',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '默认处理人',
      dataIndex: ['default_assignee', 'full_name'],
      key: 'default_assignee',
      width: 120,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: number) => <Tag color="blue">{p}</Tag>,
    },
    {
      title: '处理时限',
      dataIndex: 'handling_time_limit',
      key: 'handling_time_limit',
      width: 100,
      render: (h: number) => `${h}小时`,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean) =>
        active ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="desktop-container">
      <div className="page-header flex justify-between items-center">
        <h1 className="text-2xl font-bold">派工规则管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingRule(null);
          form.resetFields();
          setIsModalOpen(true);
        }}>
          新建规则
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={rules?.data}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑派工规则' : '新建派工规则'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input placeholder="请输入适用部门" />
          </Form.Item>
          <Form.Item name="default_assignee_id" label="默认处理人">
            <Select
              placeholder="请选择默认处理人"
              options={users?.data?.map((u) => ({
                value: u.id,
                label: `${u.full_name} (${u.department || '-'})`,
              }))}
            />
          </Form.Item>
          <div className="flex gap-4">
            <Form.Item name="priority" label="优先级" className="flex-1">
              <InputNumber min={0} max={100} className="w-full" placeholder="优先级数值" />
            </Form.Item>
            <Form.Item name="handling_time_limit" label="处理时限(小时)" className="flex-1">
              <InputNumber min={1} className="w-full" placeholder="处理时限" />
            </Form.Item>
          </div>
          <Form.Item name="is_active" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <div className="text-right pt-4">
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                保存
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
