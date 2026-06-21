'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Typography,
  Tabs,
  Row,
  Col,
  Divider,
  Tooltip,
  message,
  Spin,
  Empty,
  theme,
  Popconfirm,
} from 'antd';
import {
  BellOutlined,
  SendOutlined,
  PlusOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  MobileOutlined,
  WechatOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  CalendarOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reminderApi, hearingApi } from '@/lib/api';
import {
  Reminder,
  ReminderRecipient,
  ReminderType,
  ReminderStatus,
  Hearing,
  STATUS_COLOR_MAP,
  STATUS_LABEL_MAP,
} from '@/types';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

interface CreateReminderFormData {
  hearingId: string;
  reminderType: ReminderType;
  title: string;
  content: string;
  scheduledTime: Dayjs;
  templateCode?: string;
}

interface RecipientFormItem {
  userId?: string;
  clientId?: string;
  recipientName: string;
  recipientContact: string;
  contactType: string;
}

const REMINDER_TYPE_ICONS: Record<ReminderType, React.ReactNode> = {
  [ReminderType.EMAIL]: <MailOutlined />,
  [ReminderType.SMS]: <MessageOutlined />,
  [ReminderType.APP]: <MobileOutlined />,
  [ReminderType.WECHAT]: <WechatOutlined />,
  [ReminderType.PHONE]: <PhoneOutlined />,
};

const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  [ReminderType.EMAIL]: '邮件',
  [ReminderType.SMS]: '短信',
  [ReminderType.APP]: '应用通知',
  [ReminderType.WECHAT]: '微信',
  [ReminderType.PHONE]: '电话',
};

const ReminderManager: React.FC = () => {
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<ReminderType | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [createForm] = Form.useForm<CreateReminderFormData>();
  const [editForm] = Form.useForm<Partial<CreateReminderFormData>>();
  const [recipients, setRecipients] = useState<RecipientFormItem[]>([
    { recipientName: '', recipientContact: '', contactType: 'EMAIL' },
  ]);

  const { data: hearings = [] } = useQuery(['reminderHearings'], async () => {
    const res = await hearingApi.list({ page: 1, limit: 50 });
    return res.data.list as Hearing[];
  });

  const { data, isLoading, refetch } = useQuery(
    ['reminders', statusFilter, typeFilter, dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD'), keyword],
    async () => {
      const params: any = { page: 1, limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.reminderType = typeFilter;
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (keyword) params.keyword = keyword;
      const res = await reminderApi.list(params);
      return res.data;
    }
  );

  const { data: statsData } = useQuery(['reminderStats'], async () => {
    const res = await reminderApi.stats();
    return res.data as any;
  });

  const createMutation = useMutation(
    async (data: CreateReminderFormData & { recipients: RecipientFormItem[] }) => {
      return reminderApi.create({
        ...data,
        scheduledTime: data.scheduledTime.toISOString(),
      });
    },
    {
      onSuccess: () => {
        void message.success('提醒创建成功');
        setCreateModalOpen(false);
        createForm.resetFields();
        setRecipients([{ recipientName: '', recipientContact: '', contactType: 'EMAIL' }]);
        void queryClient.invalidateQueries(['reminders']);
        void queryClient.invalidateQueries(['reminderStats']);
      },
      onError: () => {
        void message.error('创建失败');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<CreateReminderFormData> }) => {
      const payload: any = { ...data };
      if (data.scheduledTime) payload.scheduledTime = data.scheduledTime.toISOString();
      return reminderApi.update(id, payload);
    },
    {
      onSuccess: () => {
        void message.success('更新成功');
        setEditModalOpen(false);
        setEditReminder(null);
        void queryClient.invalidateQueries(['reminders']);
      },
      onError: () => {
        void message.error('更新失败');
      },
    }
  );

  const sendMutation = useMutation(
    async (ids?: string[]) => {
      const res = await reminderApi.send({ ids });
      return res.data;
    },
    {
      onSuccess: (res) => {
        void message.success(`发送完成：成功 ${res.sent} 条，失败 ${res.failed} 条`);
        void queryClient.invalidateQueries(['reminders']);
        void queryClient.invalidateQueries(['reminderStats']);
      },
      onError: () => {
        void message.error('发送失败');
      },
    }
  );

  const resendMutation = useMutation(
    async (id: string) => {
      return reminderApi.resend(id);
    },
    {
      onSuccess: () => {
        void message.success('重发成功');
        void queryClient.invalidateQueries(['reminders']);
      },
      onError: () => {
        void message.error('重发失败');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      return reminderApi.delete(id);
    },
    {
      onSuccess: () => {
        void message.success('删除成功');
        void queryClient.invalidateQueries(['reminders']);
        void queryClient.invalidateQueries(['reminderStats']);
      },
      onError: () => {
        void message.error('删除失败');
      },
    }
  );

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const validRecipients = recipients.filter(
        (r) => r.recipientName && r.recipientContact
      );
      if (validRecipients.length === 0) {
        void message.warning('请至少添加一个有效接收人');
        return;
      }
      createMutation.mutate({
        ...values,
        recipients: validRecipients,
      });
    } catch {
      // validation error
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (editReminder) {
        updateMutation.mutate({ id: editReminder.id, data: values });
      }
    } catch {
      // validation error
    }
  };

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { recipientName: '', recipientContact: '', contactType: 'EMAIL' },
    ]);
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRecipient = (
    index: number,
    field: keyof RecipientFormItem,
    value: string
  ) => {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleBatchSend = () => {
    if (selectedRowKeys.length === 0) {
      void message.warning('请先选择要发送的提醒');
      return;
    }
    sendMutation.mutate(selectedRowKeys as string[]);
  };

  const statsCards = useMemo(
    () => [
      {
        title: '待发送',
        value: statsData?.pending || 0,
        icon: <ClockCircleOutlined />,
        color: '#faad14',
        status: ReminderStatus.PENDING,
      },
      {
        title: '已发送',
        value: statsData?.sent || 0,
        icon: <CheckCircleOutlined />,
        color: '#52c41a',
        status: ReminderStatus.SENT,
      },
      {
        title: '发送失败',
        value: statsData?.failed || 0,
        icon: <CloseCircleOutlined />,
        color: '#ff4d4f',
        status: ReminderStatus.FAILED,
      },
      {
        title: '已确认',
        value: statsData?.confirmed || 0,
        icon: <CheckCircleOutlined />,
        color: '#13c2c2',
        status: ReminderStatus.CONFIRMED,
      },
    ],
    [statsData]
  );

  const recipientColumns: ColumnsType<ReminderRecipient> = [
    {
      title: '接收人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'recipientContact',
      key: 'recipientContact',
    },
    {
      title: '发送方式',
      dataIndex: 'contactType',
      key: 'contactType',
      width: 120,
      render: (type: string) => (
        <Tag icon={REMINDER_TYPE_ICONS[type as ReminderType] || undefined}>
          {REMINDER_TYPE_LABELS[type as ReminderType] || type}
        </Tag>
      ),
    },
    {
      title: '发送状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ReminderStatus) => (
        <Tag color={STATUS_COLOR_MAP[status] || 'default'}>
          {STATUS_LABEL_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '操作时间',
      key: 'times',
      width: 200,
      render: (_, record: ReminderRecipient) => (
        <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
          {record.deliveredAt && (
            <Text type="secondary">送达: {dayjs(record.deliveredAt).format('MM-DD HH:mm')}</Text>
          )}
          {record.readAt && (
            <Text type="secondary">已读: {dayjs(record.readAt).format('MM-DD HH:mm')}</Text>
          )}
          {record.confirmedAt && (
            <Text type="secondary">确认: {dayjs(record.confirmedAt).format('MM-DD HH:mm')}</Text>
          )}
          {record.failReason && (
            <Tooltip title={record.failReason}>
              <Text
                type="danger"
                style={{
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                失败: {record.failReason}
              </Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const columns: ColumnsType<Reminder> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Reminder) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag icon={REMINDER_TYPE_ICONS[record.reminderType]} color="blue">
              {REMINDER_TYPE_LABELS[record.reminderType]}
            </Tag>
            <Text strong>{text}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            关联开庭：{record.hearing?.hearingNo || record.hearingId}
          </Text>
        </div>
      ),
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Paragraph
          ellipsis={{ rows: 1, expandable: true, symbol: '查看' }}
          style={{ marginBottom: 0 }}
        >
          {text}
        </Paragraph>
      ),
    },
    {
      title: '计划发送',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 170,
      render: (time: string) => (
        <Space>
          <CalendarOutlined style={{ color: token.colorTextSecondary }} />
          <span>{dayjs(time).format('YYYY-MM-DD HH:mm')}</span>
        </Space>
      ),
    },
    {
      title: '接收人数',
      key: 'recipientCount',
      width: 100,
      align: 'center',
      render: (_, record: Reminder) => (
        <Space>
          <UserOutlined />
          <Text>{record.recipients?.length || 0}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ReminderStatus, record: Reminder) => (
        <div>
          <Tag color={STATUS_COLOR_MAP[status] || 'default'}>
            {STATUS_LABEL_MAP[status] || status}
          </Tag>
          {record.retryCount > 0 && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              重试 {record.retryCount} 次
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '实际发送',
      dataIndex: 'sentAt',
      key: 'sentAt',
      width: 150,
      render: (time?: string) =>
        time ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(time).format('YYYY-MM-DD HH:mm')}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            --
          </Text>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record: Reminder) => {
        const canSend = record.status === ReminderStatus.PENDING || record.status === ReminderStatus.FAILED;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              disabled={!canSend}
              onClick={() => sendMutation.mutate([record.id])}
            >
              发送
            </Button>
            {record.status === ReminderStatus.FAILED && (
              <Button
                type="link"
                size="small"
                icon={<RetweetOutlined />}
                onClick={() => resendMutation.mutate(record.id)}
              >
                重发
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditReminder(record);
                editForm.setFieldsValue({
                  title: record.title,
                  content: record.content,
                  reminderType: record.reminderType,
                  scheduledTime: dayjs(record.scheduledTime),
                });
                setEditModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const renderCreateModal = () => (
    <Modal
      title={
        <Space>
          <BellOutlined style={{ color: token.colorPrimary }} />
          <span>创建提醒</span>
        </Space>
      }
      open={createModalOpen}
      onCancel={() => setCreateModalOpen(false)}
      onOk={handleCreateSubmit}
      confirmLoading={createMutation.isLoading}
      width={720}
      okText="创建提醒"
    >
      <Form
        form={createForm}
        layout="vertical"
        initialValues={{ reminderType: ReminderType.APP }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="关联开庭"
              name="hearingId"
              rules={[{ required: true, message: '请选择关联开庭' }]}
            >
              <Select
                placeholder="请选择开庭"
                showSearch
                optionFilterProp="label"
              >
                {hearings?.map((h) => (
                  <Option
                    key={h.id}
                    value={h.id}
                    label={`${h.hearingNo} ${h.caseInfo?.title || ''}`}
                  >
                    <Space>
                      <Text strong>{h.hearingNo}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(h.startTime).format('MM-DD HH:mm')}
                      </Text>
                      <Text
                        style={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h.caseInfo?.title}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="提醒类型"
              name="reminderType"
              rules={[{ required: true, message: '请选择提醒类型' }]}
            >
              <Select>
                {Object.values(ReminderType).map((type) => (
                  <Option key={type} value={type}>
                    <Space>
                      {REMINDER_TYPE_ICONS[type]}
                      {REMINDER_TYPE_LABELS[type]}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="提醒标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="如：开庭前24小时提醒" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="提醒内容"
              name="content"
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <TextArea rows={4} placeholder="请输入提醒内容，支持变量占位符..." />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="计划发送时间"
              name="scheduledTime"
              rules={[{ required: true, message: '请选择发送时间' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="消息模板（可选）" name="templateCode">
              <Select allowClear placeholder="选择模板">
                <Option value="HEARING_24H">开庭24小时提醒模板</Option>
                <Option value="HEARING_2H">开庭2小时提醒模板</Option>
                <Option value="ATTE REMINDER">到庭确认提醒</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <Space>
            <UserOutlined />
            接收人名单
          </Space>
        </Divider>

        {recipients.map((recipient, index) => (
          <Row gutter={12} key={index} style={{ marginBottom: 12 }}>
            <Col span={7}>
              <Input
                placeholder="接收人姓名"
                value={recipient.recipientName}
                onChange={(e) => updateRecipient(index, 'recipientName', e.target.value)}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={7}>
              <Input
                placeholder="联系方式"
                value={recipient.recipientContact}
                onChange={(e) => updateRecipient(index, 'recipientContact', e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Select
                value={recipient.contactType}
                onChange={(val) => updateRecipient(index, 'contactType', val)}
                style={{ width: '100%' }}
              >
                {Object.values(ReminderType).map((type) => (
                  <Option key={type} value={type}>
                    {REMINDER_TYPE_LABELS[type]}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Space>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addRecipient}
                  disabled={index !== recipients.length - 1}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeRecipient(index)}
                  disabled={recipients.length === 1}
                />
              </Space>
            </Col>
          </Row>
        ))}
      </Form>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: token.colorPrimary }} />
          <span>编辑提醒</span>
        </Space>
      }
      open={editModalOpen}
      onCancel={() => setEditModalOpen(false)}
      onOk={handleEditSubmit}
      confirmLoading={updateMutation.isLoading}
      width={640}
    >
      <Form form={editForm} layout="vertical">
        <Form.Item label="提醒标题" name="title">
          <Input />
        </Form.Item>
        <Form.Item label="提醒内容" name="content">
          <TextArea rows={4} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="提醒类型" name="reminderType">
              <Select>
                {Object.values(ReminderType).map((type) => (
                  <Option key={type} value={type}>
                    {REMINDER_TYPE_LABELS[type]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="计划发送时间" name="scheduledTime">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statsCards.map((stat, idx) => (
          <Col xs={12} sm={6} key={idx}>
            <Card
              bordered
              style={{
                borderRadius: 8,
                cursor: 'pointer',
                borderColor: statusFilter === stat.status ? token.colorPrimary : undefined,
              }}
              onClick={() =>
                setStatusFilter(statusFilter === stat.status ? null : stat.status)
              }
            >
              <Space>
                <div
                  style={{
                    fontSize: 28,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stat.title}
                  </Text>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{stat.value}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        bordered
        style={{ marginBottom: 16, borderRadius: 8 }}
        title={
          <Space>
            <FilterOutlined />
            筛选条件
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
            >
              刷新
            </Button>
            <Popconfirm
              title={`确认批量发送选中的 ${selectedRowKeys.length} 条提醒？`}
              onConfirm={handleBatchSend}
              disabled={selectedRowKeys.length === 0}
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                disabled={selectedRowKeys.length === 0}
                loading={sendMutation.isLoading}
              >
                批量发送{selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              创建提醒
            </Button>
          </Space>
        }
      >
        <Space wrap>
          <Input.Search
            placeholder="搜索标题/内容"
            allowClear
            style={{ width: 220 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={setKeyword}
          />
          <Select
            placeholder="提醒类型"
            style={{ width: 150 }}
            allowClear
            value={typeFilter || undefined}
            onChange={(val) => setTypeFilter(val || null)}
          >
            {Object.values(ReminderType).map((type) => (
              <Option key={type} value={type}>
                {REMINDER_TYPE_LABELS[type]}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="发送状态"
            style={{ width: 140 }}
            allowClear
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val || null)}
          >
            {Object.values(ReminderStatus).map((s) => (
              <Option key={s} value={s}>
                {STATUS_LABEL_MAP[s] || s}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range as [Dayjs, Dayjs] | null)}
            allowClear
          />
        </Space>
      </Card>

      <Spin spinning={isLoading}>
        {!data?.list || data.list.length === 0 ? (
          <Card bordered style={{ borderRadius: 8 }}>
            <Empty description="暂无提醒数据" />
          </Card>
        ) : (
          <Card bordered style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
            <Tabs
              defaultActiveKey="list"
              items={[
                {
                  key: 'list',
                  label: '提醒列表',
                  children: (
                    <Table
                      rowKey="id"
                      dataSource={data.list}
                      columns={columns}
                      rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        getCheckboxProps: (record) => ({
                          disabled:
                            record.status !== ReminderStatus.PENDING &&
                            record.status !== ReminderStatus.FAILED,
                        }),
                      }}
                      pagination={{
                        total: data.total,
                        pageSize: data.limit,
                        current: data.page,
                      }}
                      expandable={{
                        expandedRowRender: (record) => (
                          <Table
                            rowKey="id"
                            columns={recipientColumns}
                            dataSource={record.recipients || []}
                            pagination={false}
                            size="small"
                          />
                        ),
                        rowExpandable: (record) => (record.recipients?.length || 0) > 0,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  ),
                },
                {
                  key: 'sending',
                  label: '按接收人查看',
                  children: (
                    <div style={{ padding: 16 }}>
                      {data.list.flatMap((r) =>
                        (r.recipients || []).map((rec) => ({
                          ...rec,
                          reminder: r,
                        }))
                      ).length === 0 ? (
                        <Empty description="暂无接收人数据" />
                      ) : (
                        <Table
                          rowKey={(record) => `${record.reminder.id}-${record.id}`}
                          dataSource={data.list.flatMap((r) =>
                            (r.recipients || []).map((rec) => ({
                              ...rec,
                              reminder: r,
                            }))
                          )}
                          columns={[
                            {
                              title: '提醒标题',
                              dataIndex: ['reminder', 'title'],
                              key: 'title',
                              render: (_: unknown, record: any) => (
                                <div>
                                  <Tag
                                    icon={REMINDER_TYPE_ICONS[record.reminder.reminderType as ReminderType]}
                                  >
                                    {REMINDER_TYPE_LABELS[record.reminder.reminderType as ReminderType]}
                                  </Tag>
                                  {record.reminder.title}
                                </div>
                              ),
                            },
                            ...recipientColumns,
                          ] as ColumnsType<any>}
                          pagination={{ pageSize: 20 }}
                          size="small"
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )}
      </Spin>

      {renderCreateModal()}
      {renderEditModal()}
    </div>
  );
};

export default ReminderManager;
