import { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Drawer, Form, Input, message,
  Badge, Empty, Modal, Timeline, Radio, Descriptions, Alert, List, Avatar,
} from 'antd'
import {
  BellOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TeamOutlined, FileDoneOutlined,
  CloseOutlined, CheckOutlined, EyeOutlined, ReadOutlined,
} from '@ant-design/icons'
import { notificationsApi, reviewsApi, auditApi } from '../services'
import dayjs from 'dayjs'

const TYPE_MAP = {
  materials_missing: { label: '材料缺失', color: 'error', icon: <WarningOutlined /> },
  review_status_changed: { label: '状态变更', color: 'processing', icon: <BellOutlined /> },
  advisor_quota_changed: { label: '名额变更', color: 'warning', icon: <TeamOutlined /> },
  report_ready: { label: '报表就绪', color: 'success', icon: <FileDoneOutlined /> },
  system_alert: { label: '系统通知', color: 'default', icon: <BellOutlined /> },
}

export default function Notifications() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [processModal, setProcessModal] = useState(false)
  const [filters, setFilters] = useState({})
  const [auditLogs, setAuditLogs] = useState([])
  const [reviewDetail, setReviewDetail] = useState(null)
  const [processForm] = Form.useForm()

  useEffect(() => { loadData() }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await notificationsApi.list({
        page: pagination.current,
        page_size: pagination.page_size,
        ...filters,
      })
      setData(res.data.data)
      setPagination(p => ({ ...p, total: res.data.pagination.total }))
    } catch {}
    setLoading(false)
  }

  const handleReadAll = async () => {
    Modal.confirm({
      title: '确认操作',
      content: '将所有通知标记为已读？',
      onOk: async () => {
        try {
          await notificationsApi.readAll()
          message.success('已全部标记为已读')
          loadData()
        } catch {}
      },
    })
  }

  const viewDetail = async (record) => {
    setDetail(record)
    setDetailDrawer(true)
    if (record.id) {
      try {
        await notificationsApi.get(record.id)
      } catch {}
    }
    if (record.review_id) {
      try {
        const [rRes, aRes] = await Promise.all([
          reviewsApi.get(record.review_id),
          auditApi.byReview(record.review_id),
        ])
        setReviewDetail(rRes.data)
        setAuditLogs(aRes.data)
      } catch {
        setReviewDetail(null)
        setAuditLogs([])
      }
    }
  }

  const openProcess = (record) => {
    setDetail(record)
    processForm.resetFields()
    processForm.setFieldsValue({ close: true })
    setProcessModal(true)
  }

  const handleProcess = async () => {
    const vals = await processForm.validateFields()
    try {
      await notificationsApi.process(detail.id, vals)
      message.success('处理完成')
      setProcessModal(false)
      loadData()
    } catch {}
  }

  const columns = [
    { title: '类型', dataIndex: 'type', width: 110, render: t => {
      const cfg = TYPE_MAP[t] || {}
      return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
    } },
    { title: '标题', dataIndex: 'title', render: (v, r) => (
      <Space>
        {!r.is_read && <Badge color="red" dot />}
        <a onClick={() => viewDetail(r)} style={{ fontWeight: r.is_read ? 400 : 600 }}>{v}</a>
      </Space>
    ) },
    { title: '接收人', dataIndex: 'recipient_name', width: 100 },
    { title: '关联复核', dataIndex: 'review_id', width: 100, render: v => v ? <Tag color="blue">#{v}</Tag> : '-' },
    { title: '原因', dataIndex: 'reason', width: 200, ellipsis: true, render: v => v || '-' },
    { title: '状态', width: 140, render: (_, r) => (
      <Space size="small">
        {r.is_read
          ? <Tag icon={<ReadOutlined />} color="default">已读</Tag>
          : <Tag icon={<BellOutlined />} color="processing">未读</Tag>}
        {r.is_processed
          ? <Tag icon={<CheckOutlined />} color="success">已处理</Tag>
          : <Tag icon={<ClockCircleOutlined />} color="warning">待处理</Tag>}
      </Space>
    ) },
    { title: '时间', dataIndex: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', width: 180, fixed: 'right', render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>查看</Button>
        {!r.is_processed && (
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openProcess(r)}>处理</Button>
        )}
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title" style={{ margin: 0 }}>
          通知中心
          <Tag color="orange" style={{ marginLeft: 8 }}>
            <WarningOutlined /> 材料缺失自动通知
          </Tag>
        </div>
        <Space>
          <Radio.Group
            value={filters.is_processed !== undefined ? (filters.is_processed ? 'processed' : 'pending') : 'all'}
            onChange={e => {
              const v = e.target.value
              if (v === 'all') setFilters({})
              else setFilters(f => ({ ...f, is_processed: v === 'processed' }))
            }}
          >
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="pending">待处理</Radio.Button>
            <Radio.Button value="processed">已处理</Radio.Button>
          </Radio.Group>
          <SelectPlaceholder
            value={filters.type || undefined}
            onChange={v => setFilters(f => ({ ...f, type: v || '' }))}
            options={Object.entries(TYPE_MAP).map(([v, cfg]) => ({ label: cfg.label, value: v }))}
          />
          <Button icon={<CheckOutlined />} onClick={handleReadAll}>全部已读</Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条通知`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            {TYPE_MAP[detail?.type]?.icon}
            通知详情
            {detail && !detail.is_read && <Badge color="red" dot />}
          </Space>
        }
        placement="right"
        width={560}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
        extra={detail && !detail.is_processed && (
          <Button type="primary" icon={<CheckOutlined />} onClick={() => openProcess(detail)}>
            处理此通知
          </Button>
        )}
      >
        {detail && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="标题" span={2}>{detail.title}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag color={TYPE_MAP[detail.type]?.color} icon={TYPE_MAP[detail.type]?.icon}>
                    {TYPE_MAP[detail.type]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="接收人">{detail.recipient_name}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="读取状态">
                  {detail.is_read ? <Tag color="success">已读</Tag> : <Tag color="processing">未读</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="处理状态">
                  {detail.is_processed ? <Tag color="success">已处理</Tag> : <Tag color="warning">待处理</Tag>}
                </Descriptions.Item>
                {detail.closed_at && (
                  <Descriptions.Item label="关闭时间" span={2}>
                    {dayjs(detail.closed_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {detail.reason && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: 16 }}
                message={
                  <div>
                    <b>通知原因：</b>{detail.reason}
                  </div>
                }
              />
            )}

            <Card size="small" title="通知内容" style={{ marginBottom: 16 }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{detail.content}</p>
            </Card>

            {detail.action_taken && (
              <Card size="small" title="处理动作（已记录）" style={{ marginBottom: 16 }}>
                <Tag color="blue"><CheckOutlined /> {detail.action_taken}</Tag>
              </Card>
            )}

            {reviewDetail && (
              <Card
                size="small"
                title={
                  <Space>
                    <FileDoneOutlined style={{ color: '#1677ff' }} />
                    关联复核申请 #{reviewDetail.application_no}
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="学生">{reviewDetail.student_name}</Descriptions.Item>
                  <Descriptions.Item label="课程">{reviewDetail.course_name}</Descriptions.Item>
                  <Descriptions.Item label="当前分数">{reviewDetail.current_score}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag>{reviewDetail.status}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {auditLogs.length > 0 && (
              <Card
                size="small"
                title={
                  <Space>
                    <ClockCircleOutlined />
                    审计轨迹（原因·处理·关闭时间全记录）
                  </Space>
                }
              >
                <Timeline
                  items={auditLogs.map(l => ({
                    color: l.closed_at ? 'green' : l.reason ? 'orange' : 'blue',
                    children: (
                      <div style={{ fontSize: 12 }}>
                        <div>
                          <Tag>{l.action}</Tag>
                          <b>{l.operator_name}</b>
                          <span style={{ color: '#8c8c8c', marginLeft: 6 }}>
                            {dayjs(l.created_at).format('MM-DD HH:mm')}
                          </span>
                        </div>
                        {l.reason && (
                          <div style={{ marginTop: 4, background: '#fffbe6', padding: '4px 8px', borderRadius: 4 }}>
                            <b style={{ color: '#d46b08' }}>原因:</b> {l.reason}
                          </div>
                        )}
                        {l.action_taken && (
                          <div style={{ marginTop: 4, background: '#e6f4ff', padding: '4px 8px', borderRadius: 4 }}>
                            <b style={{ color: '#0958d9' }}>处理动作:</b> {l.action_taken}
                          </div>
                        )}
                        {l.closed_at && (
                          <div style={{ marginTop: 4, background: '#f6ffed', padding: '4px 8px', borderRadius: 4 }}>
                            <b style={{ color: '#389e0d' }}>关闭时间:</b> {dayjs(l.closed_at).format('YYYY-MM-DD HH:mm')}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="处理通知"
        open={processModal}
        onCancel={() => setProcessModal(false)}
        onOk={handleProcess}
        okText="提交处理结果"
      >
        <Alert
          type="info"
          showIcon
          message={
            <Space>
              <CheckCircleOutlined />
              <span>处理动作将写入审计日志，包含<b>原因</b>、<b>操作内容</b>和<b>关闭时间</b></span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
        <Form form={processForm} layout="vertical">
          <Form.Item name="action_taken" label="处理动作说明" rules={[{ required: true, message: '请填写处理动作' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述您对该通知做了什么处理..." />
          </Form.Item>
          <Form.Item name="close" label="关闭通知" valuePropName="checked">
            <Radio.Group>
              <Radio value={true}>处理完毕，关闭此通知</Radio>
              <Radio value={false}>标记处理，保留待跟进</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function SelectPlaceholder(props) {
  return <Select allowClear placeholder="通知类型" style={{ width: 140 }} {...props} />
}
