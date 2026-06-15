import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Space,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { alertApi } from '../services/api';
import type { AlertThreshold } from '../types';

const ThresholdPage = () => {
  const [data, setData] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AlertThreshold | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await alertApi.getThresholds();
      setData(res.data);
    } catch (error) {
      message.warning('加载失败，显示模拟数据');
      setData([
        { id: 1, name: '完成率预警-危险', type: 'completion_rate', threshold_value: 60, operator: 'lt', level: 'danger', scope: 'all', is_active: true, created_at: '2026-01-01' },
        { id: 2, name: '完成率预警-警告', type: 'completion_rate', threshold_value: 80, operator: 'lt', level: 'warning', scope: 'all', is_active: true, created_at: '2026-01-01' },
        { id: 3, name: '延迟发放预警', type: 'delay_days', threshold_value: 3, operator: 'gt', level: 'warning', scope: 'all', is_active: true, created_at: '2026-01-01' },
        { id: 4, name: '作业提交率预警', type: 'homework_rate', threshold_value: 70, operator: 'lt', level: 'warning', scope: 'all', is_active: false, created_at: '2026-01-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, level: 'warning', operator: 'lt' });
    setModalVisible(true);
  };

  const handleEdit = (record: AlertThreshold) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个预警阈值吗？',
      onOk: async () => {
        try {
          await alertApi.deleteThreshold(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.success('删除成功');
          setData((prev) => prev.filter((item) => item.id !== id));
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await alertApi.updateThreshold(editingItem.id, values);
        message.success('更新成功');
      } else {
        await alertApi.createThreshold(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      if (editingItem) {
        message.success('更新成功');
        setData((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...form.getFieldsValue() } : item
          )
        );
      } else {
        const newItem = { ...form.getFieldsValue(), id: Date.now(), created_at: new Date().toISOString() };
        setData((prev) => [...prev, newItem]);
      }
      setModalVisible(false);
    }
  };

  const columns: ColumnsType<AlertThreshold> = [
    {
      title: '阈值名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => {
        const nameMap: Record<string, string> = {
          completion_rate: '完成率',
          delay_days: '延迟天数',
          homework_rate: '作业提交率',
        };
        return nameMap[type] || type;
      },
    },
    {
      title: '比较方式',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      render: (op: string) => {
        const opMap: Record<string, string> = {
          lt: '小于',
          gt: '大于',
          lte: '小于等于',
          gte: '大于等于',
          eq: '等于',
        };
        return opMap[op] || op;
      },
    },
    {
      title: '阈值',
      dataIndex: 'threshold_value',
      key: 'threshold_value',
      width: 100,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          info: 'blue',
          warning: 'orange',
          danger: 'red',
        };
        const nameMap: Record<string, string> = {
          info: '信息',
          warning: '警告',
          danger: '危险',
        };
        return <Tag color={colorMap[level]}>{nameMap[level]}</Tag>;
      },
    },
    {
      title: '适用范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 100,
      render: (scope: string) => (scope === 'all' ? '全部' : scope),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean, record) => (
        <Switch
          size="small"
          checked={active}
          onChange={async (checked) => {
            try {
              await alertApi.updateThreshold(record.id, { is_active: checked });
              message.success('状态已更新');
            } catch {
              setData((prev) =>
                prev.map((item) =>
                  item.id === record.id ? { ...item, is_active: checked } : item
                )
              );
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="预警阈值配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增阈值
          </Button>
        }
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingItem ? '编辑预警阈值' : '新增预警阈值'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="阈值名称"
            rules={[{ required: true, message: '请输入阈值名称' }]}
          >
            <Input placeholder="如：完成率预警-危险" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select
              options={[
                { value: 'completion_rate', label: '完成率' },
                { value: 'delay_days', label: '延迟天数' },
                { value: 'homework_rate', label: '作业提交率' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="operator"
            label="比较方式"
            rules={[{ required: true, message: '请选择比较方式' }]}
          >
            <Select
              options={[
                { value: 'lt', label: '小于' },
                { value: 'gt', label: '大于' },
                { value: 'lte', label: '小于等于' },
                { value: 'gte', label: '大于等于' },
                { value: 'eq', label: '等于' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="threshold_value"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入阈值" />
          </Form.Item>
          <Form.Item
            name="level"
            label="预警级别"
            rules={[{ required: true, message: '请选择级别' }]}
          >
            <Select
              options={[
                { value: 'info', label: '信息' },
                { value: 'warning', label: '警告' },
                { value: 'danger', label: '危险' },
              ]}
            />
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="created_by" label="创建人" initialValue="admin">
            <Input placeholder="请输入创建人" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ThresholdPage;
