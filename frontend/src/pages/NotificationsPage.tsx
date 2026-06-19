import { useState } from 'react'
import {
  App, Button, Card, Col, Descriptions, Drawer, Form, Input,
  List, Modal,
  Row, Select, Space, Switch, Table, Tag, Typography,
} from 'antd'
import {
  CheckOutlined, BellOutlined, MailOutlined, MessageOutlined,
  MobileOutlined, WechatOutlined, DingtalkOutlined, ReloadOutlined,
  PlusOutlined, ReadOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { notificationApi, reminderListApi } from '../services/api'
import { Notification, NotificationChannel, NotificationChannelText } from '../types'

const { Option } = Select
const { Text, Paragraph } = Typography
const { TextArea } = Input

const channelIcons: Record<NotificationChannel, any> = {
  [NotificationChannel.System]: <BellOutlined />,
  [NotificationChannel.Email]: <MailOutlined />,
  [NotificationChannel.SMS]: <MobileOutlined />,
  [NotificationChannel.WeChat]: <WechatOutlined />,
  [NotificationChannel.DingTalk]: <DingtalkOutlined />,
}

const channelColors: Record<NotificationChannel, string> = {
  [NotificationChannel.System]: 'blue',
  [NotificationChannel.Email]: 'cyan',
  [NotificationChannel.SMS]: 'purple',
  [NotificationChannel.WeChat]: 'green',
  [NotificationChannel.DingTalk]: 'geekblue',
}

function NotificationsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | undefined>()
  const [readFilter, setReadFilter] = useState<boolean | undefined>()
  const [selected, setSelected] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendForm] = Form.useForm()

  const query = useQuery({
    queryKey: ['notifications', page, pageSize, channelFilter, readFilter],
    queryFn: () => notificationApi.getNotifications({
      channel: channelFilter,
      isRead: readFilter,
      pageIndex: page,
      pageSize,
    }).catch(() => ({ items: [], totalCount: 0, pageIndex: 1, pageSize: 20, totalPages: 0 })),
  })

  const reminderListsQuery = useQuery({
    queryKey: ['reminder-lists-mini'],
    queryFn: () => reminderListApi.getLists({ pageIndex: 1, pageSize: 100 }).catch(() => ({ items: [], totalCount: 0 })),
  })

  const readMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      message.success('已全部标记为已读')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => message.error('操作失败'),
  })

  const sendMutation = useMutation({
    mutationFn: (data: any) => notificationApi.sendCustom(data),
    onSuccess: () => {
      message.success('消息已发送')
      setSendOpen(false)
      sendForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => message.error('发送失败'),
  })

  const data = query.data?.items || []
  const reminderLists = reminderListsQuery.data?.items || []

  const columns = [
    {
      title: '渠道',
      key: 'ch',
      width: 100,
      render: (_: any, r: Notification) => (
        <Tag color={channelColors[r.channel]} icon={channelIcons[r.channel]}>
          {NotificationChannelText[r.channel]}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r: Notification) => (
        <Space>
          {!r.isRead && <Tag color="red">未读</Tag>}
          <span style={{ fontWeight: r.isRead ? 400 : 600 }}>{v}</span>
        </Space>
      ),
    },
    { title: '接收方', dataIndex: 'recipient', key: 'rec', width: 160, render: (v: string) => v || '-' },
    {
      title: '已发送',
      key: 'sent',
      width: 80,
      render: (_: any, r: Notification) =>
        r.isSent ? <Tag color="green">已发</Tag>
          : r.retryCount > 0 ? <Tag color="orange" icon={<ReloadOutlined />}>重试{r.retryCount}</Tag>
          : <Tag color="default">待发</Tag>,
    },
    { title: '重试', dataIndex: 'retryCount', key: 'retry', width: 60 },
    {
      title: '发送时间',
      key: 't',
      width: 160,
      render: (_: any, r: Notification) => (r.sentAt || r.createdAt)
        ? dayjs(r.sentAt || r.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'act',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, r: Notification) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setSelected(r); setDetailOpen(true) }}>详情</Button>
          {!r.isRead && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => readMutation.mutate(r.id)}>
              标为已读
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card className="page-container" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder="通知渠道"
            style={{ width: 150 }}
            value={channelFilter}
            onChange={(v) => { setChannelFilter(v); setPage(1) }}
          >
            {Object.entries(NotificationChannelText).map(([k, v]) => (
              <Option key={k} value={Number(k)}>{v}</Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="已读状态"
            style={{ width: 150 }}
            value={readFilter}
            onChange={(v) => { setReadFilter(v); setPage(1) }}
          >
            <Option value={true}>仅已读</Option>
            <Option value={false}>仅未读</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}>刷新</Button>
          <Button icon={<ReadOutlined />} onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
            全部标为已读
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSendOpen(true)}>
            发送自定义通知
          </Button>
        </Space>
      </Card>

      <Card className="page-container">
        <Table
          rowKey="id"
          loading={query.isLoading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.totalCount || 0,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onRow={(r) => ({
            onClick: () => {
              setSelected(r)
              setDetailOpen(true)
              if (!r.isRead) readMutation.mutate(r.id)
            },
            style: { cursor: 'pointer', background: !r.isRead ? '#f6ffed' : 'transparent' },
          })}
        />
      </Card>

      <Drawer
        title="通知详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={600}
      >
        {selected && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="渠道">
                <Tag color={channelColors[selected.channel]} icon={channelIcons[selected.channel]}>
                  {NotificationChannelText[selected.channel]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题">{selected.title}</Descriptions.Item>
              <Descriptions.Item label="接收方">{selected.recipient || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联冲突ID">{selected.conflictLogId || '-'}</Descriptions.Item>
              <Descriptions.Item label="已读">
                {selected.isRead ? (
                  <Tag color="green" icon={<CheckOutlined />}>
                    已读 {selected.readAt && `(${dayjs(selected.readAt).format('MM-DD HH:mm')})`}
                  </Tag>
                ) : <Tag color="red">未读</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="已发送">
                {selected.isSent ? (
                  <Tag color="green" icon={<CheckOutlined />}>
                    已发送 {selected.sentAt && `(${dayjs(selected.sentAt).format('MM-DD HH:mm')})`}
                  </Tag>
                ) : <Tag color="orange">待发送（已重试 {selected.retryCount} 次）</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(selected.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>内容</div>
              <Card size="small" style={{ background: '#fafafa', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {selected.content}
              </Card>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="发送自定义通知"
        open={sendOpen}
        onCancel={() => setSendOpen(false)}
        onOk={sendForm.submit}
        confirmLoading={sendMutation.isPending}
        width={560}
      >
        <Form form={sendForm} layout="vertical" onFinish={(v) => sendMutation.mutate({ ...v, createdBy: '运营管理员' })}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="发送渠道" name="channel" rules={[{ required: true }]} initialValue={NotificationChannel.System}>
                <Select>
                  {Object.entries(NotificationChannelText).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="发送对象" name="targetType" rules={[{ required: true }]} initialValue="custom">
                <Select>
                  <Option value="custom">自定义接收人</Option>
                  <Option value="reminderList">提醒名单</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.targetType !== cur.targetType}
              >
                {() => {
                  const type = sendForm.getFieldValue('targetType')
                  return type === 'reminderList' ? (
                    <Form.Item label="选择提醒名单" name="reminderListId" rules={[{ required: true }]}>
                      <Select
                        placeholder="选择要发送的名单"
                        loading={reminderListsQuery.isLoading}
                        showSearch
                        optionFilterProp="children"
                      >
                        {reminderLists.map((l) => (
                          <Option key={l.id} value={l.id}>{l.name}（{l.items.length}人）</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : (
                    <Form.Item label="接收方" name="recipient" rules={[{ required: true, message: '请输入手机号/邮箱/用户名' }]}>
                      <Input placeholder="手机号/邮箱/用户名，多个用逗号分隔" />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="通知标题" name="title" rules={[{ required: true }]}>
                <Input placeholder="通知标题" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="通知内容" name="content" rules={[{ required: true }]}>
                <TextArea rows={5} placeholder="通知正文内容" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default NotificationsPage
