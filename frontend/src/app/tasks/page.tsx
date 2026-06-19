'use client';

import { useState, useEffect } from 'react';
import { Card, Select, Button, Space, Modal, Form, Input, InputNumber, DatePicker, message, Tag, Avatar, Dropdown } from 'antd';
import { PlusOutlined, UserOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi, performanceApi, userApi } from '@/services/api';
import { TaskStatus } from '@/types';

const { Option } = Select;

const statusConfig = [
  { key: 'PENDING', title: '待处理', color: '#ff4d4f' },
  { key: 'IN_PROGRESS', title: '进行中', color: '#faad14' },
  { key: 'COMPLETED', title: '已完成', color: '#52c41a' },
];

export default function TasksPage() {
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [boardData, setBoardData] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchSchedules = async () => {
    try {
      const res: any = await performanceApi.getList({ page: 1, pageSize: 100 });
      setSchedules(res.data.data || []);
      if (res.data.data?.length > 0) {
        setScheduleId(res.data.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBoardData = async () => {
    if (!scheduleId) return;
    try {
      const res: any = await taskApi.getBoard(scheduleId);
      setBoardData(res.data || {});
    } catch (e) {
      message.error('获取任务列表失败');
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await userApi.getList({ page: 1, pageSize: 100 });
      setUsers(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (scheduleId) {
      fetchBoardData();
    }
  }, [scheduleId]);

  const handleAdd = () => {
    setCurrentTask(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        scheduleId,
        creatorId: 1,
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString(),
        dueTime: values.dueTime?.toISOString(),
      };

      if (currentTask) {
        await taskApi.update(currentTask.id, submitData);
        message.success('更新成功');
      } else {
        await taskApi.create(submitData);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchBoardData();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const handleAssign = async (taskId: number, assigneeId: number) => {
    try {
      await taskApi.assign(taskId, { assigneeId, operatorId: 1 });
      message.success('分派成功');
      fetchBoardData();
    } catch (e) {
      message.error('分派失败');
    }
  };

  const handleStatusChange = async (taskId: number, status: string, remark?: string) => {
    try {
      await taskApi.updateStatus(taskId, { status, operatorId: 1, remark });
      message.success('状态更新成功');
      fetchBoardData();
    } catch (e) {
      message.error('状态更新失败');
    }
  };

  const getPriorityColor = (priority: number) => {
    const colors = ['#52c41a', '#faad14', '#ff4d4f'];
    return colors[Math.min(priority - 1, 2)] || colors[0];
  };

  const renderTaskCard = (task: any) => {
    const menuItems = [
      { key: 'progress', label: '开始处理' },
      { key: 'complete', label: '完成任务' },
      { key: 'assign', label: '分派给...' },
    ];

    const userOptions = users.map(u => (
      <Option key={u.id} value={u.id}>{u.name}</Option>
    ));

    return (
      <div
        key={task.id}
        style={{
          padding: 12,
          marginBottom: 8,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          cursor: 'pointer',
          borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
            <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
              {task.description?.slice(0, 50) || '暂无描述'}
            </div>
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'progress', label: '开始处理', onClick: () => handleStatusChange(task.id, 'IN_PROGRESS') },
                { key: 'complete', label: '完成任务', onClick: () => handleStatusChange(task.id, 'COMPLETED') },
                { type: 'divider' },
                ...users.map(u => ({
                  key: `assign-${u.id}`,
                  label: `分派给 ${u.name}`,
                  onClick: () => handleAssign(task.id, u.id),
                })),
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={8}>
            <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>{task.type}</Tag>
            {task.priority >= 2 && (
              <Tag color="red" style={{ fontSize: 11, margin: 0 }}>
                {task.priority === 3 ? '紧急' : '高优先'}
              </Tag>
            )}
          </Space>
          {task.assignee ? (
            <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1890ff' }} />
          ) : (
            <Tag style={{ fontSize: 11, margin: 0 }}>未分派</Tag>
          )}
        </div>
        {task.dueTime && (
          <div style={{ color: '#999', fontSize: 11, marginTop: 6 }}>
            截止: {dayjs(task.dueTime).format('MM-DD HH:mm')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Card
        title="任务分派台"
        extra={
          <Space>
            <Select
              style={{ width: 250 }}
              placeholder="选择演出排期"
              value={scheduleId}
              onChange={setScheduleId}
            >
              {schedules.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.title} - {dayjs(s.startTime).format('MM-DD HH:mm')}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!scheduleId}>
              新建任务
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 16 }}>
          {statusConfig.map(status => (
            <div key={status.key} style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 12, minHeight: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 500 }}>{status.title}</span>
                <Tag color={status.color}>{boardData[status.key]?.length || 0}</Tag>
              </div>
              <div>
                {boardData[status.key]?.map((task: any) => renderTaskCard(task))}
                {(!boardData[status.key] || boardData[status.key].length === 0) && (
                  <div style={{ textAlign: 'center', color: '#ccc', padding: 20 }}>
                    暂无任务
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        title={currentTask ? '编辑任务' : '新建任务'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="type" label="任务类型" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select>
                <Option value="stage">舞台/设备</Option>
                <Option value="rehearsal">彩排/演出</Option>
                <Option value="ticketing">票务</Option>
                <Option value="safety">安全</Option>
                <Option value="marketing">营销</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="优先级" initialValue={2} style={{ flex: 1 }}>
              <Select>
                <Option value={1}>低</Option>
                <Option value={2}>中</Option>
                <Option value={3}>高</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="dueTime" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
