import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PhoneOutlined,
  CheckOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { followUpApi } from '../services';
import type { FollowUpTask, FollowUpStatus, FollowUpType } from '../types';
import {
  getFollowUpStatusText,
  getFollowUpTypeText,
  formatDate,
  formatDateTime,
} from '../utils/format';

const { Option } = Select;

const FollowUpTasks = () => {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<FollowUpStatus | undefined>();
  const [type, setType] = useState<FollowUpType | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();

  useEffect(() => {
    loadTasks();
  }, [status, type]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await followUpApi.getFollowUpTasks({
        status,
        type,
        pageSize: 50,
      });
      setTasks(response.data);
    } catch (error) {
      console.error('加载随访任务失败:', error);
      message.error('加载随访任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await followUpApi.createFollowUpTask({
        ...values,
        scheduledDate: values.scheduledDate?.format('YYYY-MM-DD'),
      });
      message.success('随访任务创建成功');
      setIsModalVisible(false);
      form.resetFields();
      loadTasks();
    } catch (error) {
      message.error('创建随访任务失败');
    }
  };

  const handleComplete = async (values: any) => {
    if (!selectedTask) return;
    try {
      await followUpApi.completeTask(selectedTask.id, values.result, '当前用户');
      message.success('任务已完成');
      setIsCompleteModalVisible(false);
      completeForm.resetFields();
      loadTasks();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'patientPhone',
      key: 'patientPhone',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: FollowUpType) => getFollowUpTypeText(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: FollowUpStatus) => (
        <Tag
          color={
            status === 2
              ? 'green'
              : status === 1
              ? 'blue'
              : status === 3
              ? 'default'
              : 'orange'
          }
        >
          {getFollowUpStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '计划时间',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '-'),
    },
    {
      title: '负责人',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: FollowUpTask) => (
        <Space size="small">
          {record.status === 0 && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => {
                setSelectedTask(record);
                setIsCompleteModalVisible(true);
              }}
            >
              完成
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          随访任务
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建任务
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>状态</div>
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: '100%' }}
              value={status}
              onChange={setStatus}
            >
              <Option value={0}>待处理</Option>
              <Option value={1}>进行中</Option>
              <Option value={2}>已完成</Option>
              <Option value={3}>已取消</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>类型</div>
            <Select
              placeholder="全部类型"
              allowClear
              style={{ width: '100%' }}
              value={type}
              onChange={setType}
            >
              <Option value={0}>电话</Option>
              <Option value={1}>短信</Option>
              <Option value={2}>微信</Option>
              <Option value={3}>邮件</Option>
              <Option value={4}>面诊</Option>
            </Select>
          </Col>
          <Col span={10}>
            <div style={{ marginBottom: 8, color: '#666' }}>搜索</div>
            <Input
              placeholder="搜索患者姓名/任务标题"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={2}>
            <div style={{ marginBottom: 8, color: '#fff' }}>-</div>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadTasks}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="新建随访任务"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="patientId"
            label="患者ID"
            rules={[{ required: true, message: '请输入患者ID' }]}
          >
            <Input placeholder="请输入患者ID" />
          </Form.Item>
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="随访类型"
                rules={[{ required: true, message: '请选择随访类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value={0}>电话</Option>
                  <Option value={1}>短信</Option>
                  <Option value={2}>微信</Option>
                  <Option value={3}>邮件</Option>
                  <Option value={4}>面诊</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduledDate" label="计划日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assignedTo" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="content" label="随访内容">
            <Input.TextArea rows={4} placeholder="请输入随访内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建任务
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成随访任务"
        open={isCompleteModalVisible}
        onCancel={() => setIsCompleteModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
          <Form.Item
            name="result"
            label="随访结果"
            rules={[{ required: true, message: '请输入随访结果' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入随访结果" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认完成
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FollowUpTasks;
