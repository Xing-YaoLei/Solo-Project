import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Select, Modal, Form, Input,
  Timeline, Drawer, Descriptions, Row, Col, Statistic, Empty, message,
  Tabs, Badge, List, Popconfirm, Alert,
} from 'antd';
import {
  BellOutlined, WarningOutlined, CheckOutlined,
  ClockCircleOutlined, UserOutlined, TeamOutlined,
  CloseOutlined, EditOutlined, MessageOutlined,
  FallOutlined, RiseOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, courseApi, userApi } from '@/api';
import type { Notification, CourseListItem } from '@/types';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';
import {
  formatDateTime, getNotificationStatusText, getNotificationStatusColor,
  formatProgress,
} from '@/utils';

const { Option } = Select;
const { TextArea } = Input;

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [status, setStatus] = useState<string | undefined>();
  const [courseId, setCourseId] = useState<number | undefined>();
  const [selected, setSelected] = useState<Notification | null>(null);
  const [handleModal, setHandleModal] = useState<number | null>(null);
  const [handleForm] = Form.useForm();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', status, courseId],
    queryFn: () => notificationApi.list({ status, course_id: courseId }),
    refetchInterval: 30000,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  const handleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => notificationApi.handle(id, data),
    onSuccess: () => {
      message.success('处理已保存');
      setHandleModal(null);
      handleForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (selected) refetch();
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => notificationApi.close(id),
    onSuccess: () => {
      message.success('已关闭通知');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (selected) refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => notificationApi.update(id, data),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const pendingCount = notifications.filter((n) => n.status === 'pending').length;
  const processingCount = notifications.filter((n) => n.status === 'processing').length;
  const resolvedCount = notifications.filter((n) => n.status === 'resolved').length;
  const closedCount = notifications.filter((n) => n.status === 'closed').length;

  const handleSubmitHandle = async (id: number) => {
    const values = await handleForm.validateFields();
    handleMutation.mutate({ id, data: values });
  };

  const columns = [
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      fixed: 'left' as const,
      render: (s: string) => {
        const badgeMap: any = {
          pending: { status: 'error', text: '待处理', icon: <WarningOutlined /> },
          processing: { status: 'processing', text: '处理中', icon: <ClockCircleOutlined /> },
          resolved: { status: 'success', text: '已解决', icon: <CheckOutlined /> },
          closed: { status: 'default', text: '已关闭', icon: <CloseOutlined /> },
        };
        const b = badgeMap[s] || badgeMap.pending;
        return (
          <Badge status={b.status} text={<Space size={4}>{b.icon}{b.text}</Space>} />
        );
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 240,
      render: (t: string, r: Notification) => (
        <a onClick={() => setSelected(r)} style={{ fontWeight: 500 }}>
          {t}
        </a>
      ),
    },
    {
      title: '课程',
      dataIndex: ['course', 'name'],
      width: 160,
      render: (t: string, r: Notification) => (
        <a onClick={() => navigate({ to: `/courses/${r.course_id}` })}>
          {t}
        </a>
      ),
    },
    {
      title: '学员',
      dataIndex: ['member', 'full_name'],
      width: 100,
    },
    {
      title: '通知接收人',
      dataIndex: ['to_user', 'full_name'],
      width: 100,
    },
    {
      title: '进度差距',
      width: 180,
      render: (_: any, r: Notification) => (
        <Space direction="vertical" size={0}>
          <Space size="small">
            <Tag color="volcano" icon={<FallOutlined />}>
              实际 {r.actual_progress.toFixed(1)}%
            </Tag>
            <Tag color="geekblue" icon={<RiseOutlined />}>
              预期 {r.expected_progress.toFixed(1)}%
            </Tag>
          </Space>
          <span style={{ fontSize: 12, color: '#dc2626' }}>
            <WarningOutlined /> 落后 {r.gap_hours.toFixed(2)}%
          </span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (t) => formatDateTime(t),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: Notification) => (
        <Space size="small">
          {(r.status === 'pending' || r.status === 'processing') && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => { setHandleModal(r.id); handleForm.resetFields(); }}
            >
              处理
            </Button>
          )}
          {r.status !== 'closed' && (
            <Popconfirm
              title="确认关闭此通知？"
              description="关闭后将不可再处理"
              onConfirm={() => closeMutation.mutate(r.id)}
              okText="确认关闭"
              cancelText="取消"
            >
              <Button size="small" danger icon={<CloseOutlined />}>关闭</Button>
            </Popconfirm>
          )}
          <Button size="small" icon={<MessageOutlined />} onClick={() => setSelected(r)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>
          <BellOutlined style={{ color: '#dc2626', marginRight: 8 }} />
          进度落后通知管理
        </h2>
        <Space>
          <Select
            placeholder="按状态筛选"
            value={status}
            onChange={setStatus}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <Select
            placeholder="按课程筛选"
            value={courseId}
            onChange={setCourseId}
            style={{ width: 200 }}
            showSearch
            allowClear
          >
            {courses.map((c: CourseListItem) => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #dc2626' }}>
            <Statistic
              title={<span style={{ color: '#dc2626' }}>⚠️ 待处理</span>}
              value={pendingCount}
              valueStyle={{ color: '#dc2626' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #3b82f6' }}>
            <Statistic
              title={<span style={{ color: '#3b82f6' }}>⏳ 处理中</span>}
              value={processingCount}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #16a34a' }}>
            <Statistic
              title={<span style={{ color: '#16a34a' }}>✅ 已解决</span>}
              value={resolvedCount}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderLeft: '3px solid #64748b' }}>
            <Statistic
              title={<span style={{ color: '#64748b' }}>📕 已关闭</span>}
              value={closedCount}
              valueStyle={{ color: '#64748b' }}
            />
          </Card>
        </Col>
      </Row>

      {pendingCount > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space>
              <WarningOutlined />
              <span>当前有 <strong style={{ color: '#dc2626' }}>{pendingCount}</strong> 条进度落后通知待处理，请及时跟进</span>
            </Space>
          }
        />
      )}

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={notifications}
          loading={isLoading}
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description="暂无通知记录" /> }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条通知`,
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <BellOutlined />
            <span>通知详情</span>
            {selected && (
              <Tag color={getNotificationStatusColor(selected.status) as any}>
                {getNotificationStatusText(selected.status)}
              </Tag>
            )}
          </Space>
        }
        width={640}
        onClose={() => setSelected(null)}
        open={!!selected}
        destroyOnClose
        extra={selected && (
          <Space>
            {(selected.status === 'pending' || selected.status === 'processing') && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => { setHandleModal(selected.id); handleForm.resetFields(); }}
              >
                处理通知
              </Button>
            )}
            {selected.status !== 'closed' && (
              <Popconfirm
                title="关闭此通知？"
                onConfirm={() => { closeMutation.mutate(selected.id); setSelected(null); }}
              >
                <Button danger icon={<CloseOutlined />}>关闭</Button>
              </Popconfirm>
            )}
          </Space>
        )}
      >
        {selected && (
          <div>
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
              message={<span style={{ fontWeight: 500 }}>{selected.title}</span>}
              description={selected.content}
            />

            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="课程" span={2}>
                <a onClick={() => { navigate({ to: `/courses/${selected.course_id}` }); setSelected(null); }}>
                  {selected.course.name}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="学员">
                <Space><UserOutlined />{selected.member.full_name}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="接收人">
                <Space><TeamOutlined />{selected.to_user.full_name}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="发送人">{selected.from_user.full_name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selected.created_at)}</Descriptions.Item>
            </Descriptions>

            <Card title="进度情况" size="small" style={{ marginBottom: 20 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="预期进度"
                    value={selected.expected_progress}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#6366f1' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="实际进度"
                    value={selected.actual_progress}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#dc2626' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="落后差距"
                    value={selected.gap_hours}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#dc2626' }}
                    prefix={<FallOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <MessageOutlined />
                  <span>处理记录</span>
                </Space>
              }
              size="small"
            >
              <Timeline
                items={[
                  {
                    color: 'red',
                    dot: <BellOutlined />,
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>通知产生</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          {formatDateTime(selected.created_at)} · {selected.from_user.full_name}
                        </div>
                        <div style={{ fontSize: 13 }}>{selected.content}</div>
                      </div>
                    ),
                  },
                  selected.delay_reason ? {
                    color: 'blue',
                    dot: <EditOutlined />,
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>登记落后原因</div>
                        {selected.resolved_at && (
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                            {formatDateTime(selected.resolved_at)}
                          </div>
                        )}
                        <div style={{ fontSize: 13, padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                          {selected.delay_reason}
                        </div>
                      </div>
                    ),
                  } : null,
                  selected.action_taken ? {
                    color: 'cyan',
                    dot: <CheckOutlined />,
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>采取的处理动作</div>
                        <div style={{ fontSize: 13, padding: 8, background: '#ecfeff', borderRadius: 6 }}>
                          {selected.action_taken}
                        </div>
                      </div>
                    ),
                  } : null,
                  selected.closed_at ? {
                    color: 'gray',
                    dot: <CloseOutlined />,
                    children: (
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>通知已关闭</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          {formatDateTime(selected.closed_at)}
                          {selected.closed_by && ` · 由 ${selected.closed_by.full_name} 关闭`}
                        </div>
                      </div>
                    ),
                  } : null,
                ].filter(Boolean) as any}
              />
              {!selected.delay_reason && !selected.action_taken && selected.status !== 'closed' && (
                <Empty
                  description={
                    <Space>
                      <EditOutlined />
                      <span>尚未处理，点击"处理通知"按钮开始跟进</span>
                    </Space>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>处理进度落后通知</span>
          </Space>
        }
        open={handleModal !== null}
        onOk={() => handleModal && handleSubmitHandle(handleModal)}
        onCancel={() => { setHandleModal(null); handleForm.resetFields(); }}
        confirmLoading={handleMutation.isPending}
        destroyOnClose
        width={560}
        okText="保存处理记录"
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="请填写落后原因和采取的处理动作，这将被记录用于后续复盘"
        />
        <Form form={handleForm} layout="vertical">
          <Form.Item
            label="落后原因分析"
            name="delay_reason"
            rules={[{ required: true, message: '请填写落后原因' }]}
            tooltip="分析为什么会出现进度落后的情况（如：学员请假、伤病、训练强度不适应等）"
          >
            <TextArea
              rows={4}
              placeholder="请详细描述导致进度落后的原因，例如：学员连续请假3天；训练量过大导致恢复不足；近期工作繁忙无法按时到店等"
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            label="采取的处理动作"
            name="action_taken"
            rules={[{ required: true, message: '请填写处理动作' }]}
            tooltip="已采取或即将采取的措施"
          >
            <TextArea
              rows={4}
              placeholder="描述采取的措施，例如：与学员沟通调整计划；增加周末补训；调整训练强度；督促教练跟进等"
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            label="是否同时关闭通知"
            name="close_notification"
            valuePropName="checked"
            tooltip="如果问题已解决，可以勾选直接关闭此通知"
          >
            <Select
              placeholder="选择状态"
              style={{ width: 200 }}
              defaultValue={false}
            >
              <Option value={false}>仅保存处理记录（保持处理中）</Option>
              <Option value={true}>保存并关闭通知（问题已解决）</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
