import { useState } from 'react'
import {
  App, Button, Card, Descriptions, Drawer, Form, Input, Modal,
  Select, Space, Table, Tag,
} from 'antd'
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { conflictApi, masterDataApi } from '../services/api'
import {
  ConflictLog,
  ConflictStatus,
  ConflictStatusText,
  ConflictType,
  ConflictTypeText,
  NotificationChannel,
  NotificationChannelText,
} from '../types'

const { Option } = Select
const { TextArea } = Input

function ConflictsPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [scenicSpotId, setScenicSpotId] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<ConflictStatus | undefined>()
  const [typeFilter, setTypeFilter] = useState<ConflictType | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<ConflictLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [processOpen, setProcessOpen] = useState(false)
  const [processForm] = Form.useForm()

  const query = useQuery({
    queryKey: ['conflicts', 'active', scenicSpotId, statusFilter, typeFilter, page, pageSize],
    queryFn: () => conflictApi.getActiveConflicts({
      scenicSpotId,
      status: statusFilter,
      conflictType: typeFilter,
      pageIndex: page,
      pageSize,
    }).catch(() => ({ items: [], totalCount: 0, pageIndex: 1, pageSize: 10, totalPages: 0 })),
  })

  const spotsQuery = useQuery({
    queryKey: ['scenic-spots'],
    queryFn: () => masterDataApi.getScenicSpots().catch(() => []),
  })

  const detailQuery = useQuery({
    queryKey: ['conflict', selected?.id],
    queryFn: () => selected?.id ? conflictApi.getConflict(selected.id).catch(() => null) : Promise.resolve(null),
    enabled: !!selected?.id && detailOpen,
  })

  const processMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      conflictApi.processConflict(id, {
        ...values,
        status: values.action === 'resolve' ? ConflictStatus.Resolved
          : values.action === 'ignore' ? ConflictStatus.Ignored
          : ConflictStatus.Processing,
        processedBy: '运营管理员',
      }),
    onSuccess: (r) => {
      message.success('冲突已处理')
      setProcessOpen(false)
      processForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['conflicts'] })
      if (r) {
        setSelected(r)
      }
    },
    onError: () => message.error('处理失败'),
  })

  const triggerMutation = useMutation({
    mutationFn: () => conflictApi.triggerDetection().catch(() => null),
    onSuccess: () => {
      message.success('已触发冲突检测，稍后查看结果')
      queryClient.invalidateQueries({ queryKey: ['conflicts'] })
    },
  })

  const data = query.data?.items || []
  const spots = spotsQuery.data || []
  const detail = detailQuery.data || selected

  const renderStatusTag = (status: ConflictStatus) => {
    const colorMap: Record<ConflictStatus, string> = {
      [ConflictStatus.Detected]: 'red',
      [ConflictStatus.Notified]: 'orange',
      [ConflictStatus.Processing]: 'blue',
      [ConflictStatus.Resolved]: 'green',
      [ConflictStatus.Ignored]: 'default',
    }
    return <Tag color={colorMap[status]} icon={status >= ConflictStatus.Resolved ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>{ConflictStatusText[status]}</Tag>
  }

  const columns = [
    {
      title: '冲突类型',
      key: 'type',
      width: 110,
      render: (_: any, r: ConflictLog) => (
        <Tag color="red" icon={<ThunderboltOutlined />}>{ConflictTypeText[r.conflictType]}</Tag>
      ),
    },
    { title: '预约编号', dataIndex: 'bookingNo', key: 'no', width: 120 },
    {
      title: '关联预约',
      key: 'rel',
      width: 120,
      render: (_: any, r: ConflictLog) => r.relatedBookingNo || '-',
    },
    { title: '时段', key: 'slot', width: 170, render: (_: any, r: ConflictLog) => r.timeSlotDisplay || '-' },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (v: string) => <span style={{ color: '#cf1322' }}>{v}</span>,
    },
    { title: '负责人', dataIndex: 'responsiblePerson', key: 'rp', width: 100 },
    { title: '通知时间', key: 'notified', width: 140,
      render: (_: any, r: ConflictLog) => r.notifiedAt ? dayjs(r.notifiedAt).format('MM-DD HH:mm') : '-' },
    { title: '状态', key: 'st', width: 100, render: (_: any, r: ConflictLog) => renderStatusTag(r.status) },
    { title: '关闭时间', key: 'closed', width: 140,
      render: (_: any, r: ConflictLog) => r.closedAt ? dayjs(r.closedAt).format('MM-DD HH:mm') : '-' },
    { title: '检测时间', key: 't', width: 140,
      render: (_: any, r: ConflictLog) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'act',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, r: ConflictLog) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setSelected(r); setDetailOpen(true) }}>详情</Button>
          {r.status <= ConflictStatus.Notified && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => { setSelected(r); setProcessOpen(true) }}>处理</Button>
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
            placeholder="景区"
            style={{ width: 160 }}
            value={scenicSpotId}
            onChange={(v) => { setScenicSpotId(v); setPage(1) }}
          >
            {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
          </Select>
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1) }}
          >
            {Object.entries(ConflictStatusText).map(([k, v]) => (
              <Option key={k} value={Number(k)}>{v}</Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="冲突类型"
            style={{ width: 140 }}
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1) }}
          >
            {Object.entries(ConflictTypeText).map(([k, v]) => (
              <Option key={k} value={Number(k)}>{v}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setPage(1)}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['conflicts'] })}>刷新</Button>
          <Button type="dashed" icon={<ThunderboltOutlined />} loading={triggerMutation.isPending} onClick={() => triggerMutation.mutate()}>
            手动触发检测
          </Button>
        </Space>
      </Card>

      <Card className="page-container">
        <Table
          rowKey="id"
          loading={query.isLoading || detailQuery.isLoading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.totalCount || 0,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Drawer
        title={`冲突详情`}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={800}
      >
        {detail && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="冲突类型">
                <Tag color="red" icon={<ThunderboltOutlined />}>{ConflictTypeText[detail.conflictType]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">{renderStatusTag(detail.status)}</Descriptions.Item>
              <Descriptions.Item label="预约编号">{detail.bookingNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联预约">{detail.relatedBookingNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="时段">{detail.timeSlotDisplay || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detail.responsiblePerson || '-'}</Descriptions.Item>
              <Descriptions.Item label="原因" span={2}>
                <span style={{ color: '#cf1322' }}>{detail.reason}</span>
              </Descriptions.Item>
              <Descriptions.Item label="检测时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="检测人">{detail.createdBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="通知时间">{detail.notifiedAt ? dayjs(detail.notifiedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{detail.processedAt ? dayjs(detail.processedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detail.processedBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="关闭时间">{detail.closedAt ? dayjs(detail.closedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="处理动作" span={2}>{detail.resolveAction || '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>发送的通知</h4>
              {(!detail.notifications || detail.notifications.length === 0) ? (
                <div style={{ color: '#999', padding: 16, textAlign: 'center' }}>暂无通知记录</div>
              ) : (
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={detail.notifications || []}
                  columns={[
                    { title: '渠道', key: 'ch', width: 90, render: (_, r: any) => <Tag>{NotificationChannelText[r.channel as NotificationChannel]}</Tag> },
                    { title: '标题', dataIndex: 'title', key: 'title' },
                    { title: '接收方', dataIndex: 'recipient', key: 'rec', width: 140 },
                    { title: '已发送', key: 'sent', width: 80,
                      render: (_, r: any) => r.isSent ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag> },
                    { title: '重试', dataIndex: 'retryCount', key: 'retry', width: 60 },
                    { title: '发送时间', key: 't', width: 150,
                      render: (_, r: any) => r.sentAt ? dayjs(r.sentAt).format('MM-DD HH:mm') : '-' },
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="处理冲突"
        open={processOpen}
        onCancel={() => setProcessOpen(false)}
        onOk={processForm.submit}
        confirmLoading={processMutation.isPending}
      >
        {selected && (
          <div>
            <div className="export-metadata" style={{ marginBottom: 16 }}>
              <div style={{ color: '#cf1322' }}>
                <strong>{ConflictTypeText[selected.conflictType]}：</strong>{selected.reason}
              </div>
              <div style={{ marginTop: 4, color: '#666' }}>预约号：{selected.bookingNo}</div>
            </div>
            <Form
              form={processForm}
              layout="vertical"
              onFinish={(v) => processMutation.mutate({ id: selected.id, values: v })}
            >
              <Form.Item label="处理动作" name="action" rules={[{ required: true }]} initialValue="process">
                <Select>
                  <Option value="process">标记处理中</Option>
                  <Option value="resolve">已解决</Option>
                  <Option value="ignore">忽略此冲突</Option>
                </Select>
              </Form.Item>
              <Form.Item label="处理说明 / 处理动作" name="resolveAction" rules={[{ required: true, message: '请填写处理说明' }]}>
                <TextArea rows={4} placeholder="请描述处理方式、与客户沟通结果等，这些会被记录到日志中" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ConflictsPage
