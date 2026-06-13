import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, DatePicker, message, Empty, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, userApi } from '@/api';
import type { CourseListItem } from '@/types';
import { useNavigate } from '@tanstack/react-router';
import { getCourseStatusColor, getCourseStatusText, formatDate, formatDateTime } from '@/utils';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [createModal, setCreateModal] = useState(false);
  const [memberModal, setMemberModal] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', searchText, statusFilter],
    queryFn: () => courseApi.list({ search: searchText, status: statusFilter }),
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => userApi.trainers(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => userApi.members(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => courseApi.create(data),
    onSuccess: () => {
      message.success('课程创建成功');
      setCreateModal(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ courseId, memberIds }: { courseId: number; memberIds: number[] }) =>
      courseApi.addMembers(courseId, memberIds),
    onSuccess: () => {
      message.success('添加成功');
      setMemberModal(null);
      memberForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const handleCreate = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
      end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
      trainer_id: user?.role === 'trainer' ? user.id : values.trainer_id,
    };
    delete data.date_range;
    createMutation.mutate(data);
  };

  const handleAddMembers = async (courseId: number) => {
    const values = await memberForm.validateFields();
    addMemberMutation.mutate({ courseId, memberIds: values.member_ids });
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CourseListItem) => (
        <a onClick={() => navigate({ to: `/courses/${record.id}` })} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: '教练',
      dataIndex: 'trainer_name',
      key: 'trainer_name',
      width: 100,
    },
    {
      title: '学员数',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 80,
      align: 'center' as const,
      render: (n: number, record: CourseListItem) => (
        <Space>
          <span>{n}</span>
          <Button
            type="text"
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => setMemberModal(record.id)}
          />
        </Space>
      ),
    },
    {
      title: '总课时',
      dataIndex: 'total_sessions',
      key: 'total_sessions',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '完成率',
      key: 'completion_rate',
      width: 180,
      render: (_: any, record: CourseListItem) => (
        <Progress
          percent={Math.round(record.completion_rate)}
          size="small"
          strokeColor={
            record.completion_rate >= 80
              ? '#16a34a'
              : record.completion_rate >= 50
              ? '#f59e0b'
              : '#dc2626'
          }
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (
        <Tag color={getCourseStatusColor(s) as any}>{getCourseStatusText(s)}</Tag>
      ),
    },
    {
      title: '周期',
      key: 'date',
      width: 220,
      render: (_: any, record: CourseListItem) => (
        <div style={{ fontSize: 12, color: '#666' }}>
          <div>开始: {formatDate(record.start_date)}</div>
          <div>结束: {formatDate(record.end_date)}</div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (t: string) => formatDateTime(t),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <Input
            placeholder="搜索课程名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="按状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="not_started">未开始</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="paused">已暂停</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          创建课程
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={courses}
        loading={isLoading}
        locale={{ emptyText: <Empty description="暂无课程" /> }}
      />

      <Modal
        title="创建新课程"
        open={createModal}
        onOk={handleCreate}
        onCancel={() => { setCreateModal(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="课程名称" rules={[{ required: true }]}>
            <Input placeholder="如：减脂塑形30天课程" />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={3} placeholder="课程介绍" />
          </Form.Item>
          {user?.role !== 'trainer' && (
            <Form.Item name="trainer_id" label="指派教练" rules={[{ required: true }]}>
              <Select placeholder="选择教练">
                {trainers.map((t) => (
                  <Option key={t.id} value={t.id}>{t.full_name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item label="课程周期" name="date_range">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="total_sessions" label="总课时" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Input type="number" min={0} placeholder="节数" />
            </Form.Item>
            <Form.Item name="total_duration_hours" label="总时长(小时)" style={{ flex: 1 }}>
              <Input type="number" min={0} step={0.5} />
            </Form.Item>
          </Space>
          <Form.Item name="member_ids" label="添加学员">
            <Select mode="multiple" placeholder="可多选">
              {members.map((m) => (
                <Option key={m.id} value={m.id}>{m.full_name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加学员"
        open={memberModal !== null}
        onOk={() => memberModal && handleAddMembers(memberModal)}
        onCancel={() => { setMemberModal(null); memberForm.resetFields(); }}
        confirmLoading={addMemberMutation.isPending}
        destroyOnClose
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item name="member_ids" label="选择学员" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择要添加的学员" style={{ width: '100%' }}>
              {members.map((m) => (
                <Option key={m.id} value={m.id}>{m.full_name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CoursesPage;
