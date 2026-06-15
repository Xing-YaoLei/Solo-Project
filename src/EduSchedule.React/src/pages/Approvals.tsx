import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Descriptions,
  Alert,
} from 'antd'
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { api } from '../services/api'
import { approvalStatusLabels } from '../utils/enumLabels'
import type { ApprovalRecord } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const Approvals = () => {
  const [loading, setLoading] = useState(false)
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('todo')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRecord | null>(null)
  const [stats, setStats] = useState<any>({})
  const [trendData, setTrendData] = useState<any[]>([])
  const [approveForm] = Form.useForm()
  const [rejectForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [page, pageSize, searchText, statusFilter, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
        search: searchText,
        status: statusFilter,
      }

      let approvalsRes
      if (activeTab === 'todo') {
        approvalsRes = await api.approvals.getTodoList(params)
      } else if (activeTab === 'done') {
        approvalsRes = await api.approvals.getDoneList(params)
      } else {
        approvalsRes = await api.approvals.getAll(params)
      }

      const [statsRes, trendRes] = await Promise.all([
        api.approvals.getStats(),
        api.dashboard.getApprovalTrend(),
      ])

      setApprovals(approvalsRes.data.items)
      setTotal(approvalsRes.data.total)
      setStats(statsRes.data)
      setTrendData(trendRes.data.dailyData || [])
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (approval: ApprovalRecord) => {
    setSelectedApproval(approval)
    setDetailModalVisible(true)
  }

  const handleApprove = (approval: ApprovalRecord) => {
    setSelectedApproval(approval)
    approveForm.resetFields()
    setApproveModalVisible(true)
  }

  const handleReject = (approval: ApprovalRecord) => {
    setSelectedApproval(approval)
    rejectForm.resetFields()
    setRejectModalVisible(true)
  }

  const submitApprove = async () => {
    try {
      const values = await approveForm.validateFields()
      if (!selectedApproval) return

      await api.approvals.approve(selectedApproval.id, {
        comment: values.comment,
      })

      message.success('审核通过')
      setApproveModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const submitReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      if (!selectedApproval) return

      await api.approvals.reject(selectedApproval.id, {
        comment: values.comment,
      })

      message.success('已驳回')
      setRejectModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'default',
      Pending: 'processing',
      Approved: 'success',
      Rejected: 'error',
      NeedsRevision: 'warning',
    }
    return colors[status] || 'default'
  }

  const getApprovalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Schedule: '排课审核',
      Course: '课程审核',
      Conflict: '冲突处理审核',
      Application: '申请审核',
      Other: '其他审核',
    }
    return labels[type] || type
  }

  const columns = [
    {
      title: '审核类型',
      dataIndex: 'approvalType',
      key: 'approvalType',
      width: 120,
      render: (type: string) => (
        <Tag icon={<FileTextOutlined />}>{getApprovalTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '审核事项',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '申请人',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 100,
      render: (name: string) => (
        <span>
          <UserOutlined style={{ marginRight: 4 }} />
          {name}
        </span>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{approvalStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '审核时长',
      key: 'duration',
      width: 100,
      render: (_: any, record: ApprovalRecord) => {
        if (record.status === 'Pending') {
          const hours = Math.round((Date.now() - new Date(record.submittedAt).getTime()) / (1000 * 60 * 60))
          return <span style={{ color: hours > 24 ? '#f5222d' : '#faad14' }}>{hours} 小时</span>
        }
        if (record.completedAt) {
          const hours = Math.round((new Date(record.completedAt).getTime() - new Date(record.submittedAt).getTime()) / (1000 * 60 * 60))
          return <span>{hours} 小时</span>
        }
        return '-'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: ApprovalRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'Pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
                danger
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待我审核"
              value={stats.pending || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="我已审核"
              value={stats.approved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已驳回"
              value={stats.rejected || 0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均审核时长"
              value={stats.avgHours || 0}
              suffix="小时"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="审核时长趋势" size="small" style={{ marginBottom: 16 }}>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgApprovalHours"
                name="平均审核时长(小时)"
                stroke="#1890ff"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="approvalCount"
                name="审核数量"
                stroke="#52c41a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card size="small">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`待办 (${stats.pending || 0})`} key="todo" />
          <TabPane tab={`已办 (${(stats.approved || 0) + (stats.rejected || 0)})`} key="done" />
          <TabPane tab="全部" key="all" />
        </Tabs>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search
              placeholder="搜索审核事项或申请人"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 250 }}
              onSearch={(value) => {
                setSearchText(value)
                setPage(1)
              }}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <Option value="Pending">待审核</Option>
              <Option value="Approved">已通过</Option>
              <Option value="Rejected">已驳回</Option>
              <Option value="NeedsRevision">需修改</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={approvals}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      <Modal
        title="审核详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          selectedApproval?.status === 'Pending' ? (
            <Space>
              <Button onClick={() => { setDetailModalVisible(false); handleReject(selectedApproval) }} danger>
                驳回
              </Button>
              <Button type="primary" onClick={() => { setDetailModalVisible(false); handleApprove(selectedApproval) }}>
                通过
              </Button>
            </Space>
          ) : null
        }
        width={600}
      >
        {selectedApproval && (
          <div>
            <Alert
              message={approvalStatusLabels[selectedApproval.status]}
              type={selectedApproval.status === 'Approved' ? 'success' :
                    selectedApproval.status === 'Rejected' ? 'error' :
                    selectedApproval.status === 'NeedsRevision' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="审核类型">
                {getApprovalTypeLabel(selectedApproval.approvalType)}
              </Descriptions.Item>
              <Descriptions.Item label="审核事项">
                {selectedApproval.title}
              </Descriptions.Item>
              <Descriptions.Item label="申请内容">
                {selectedApproval.description}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedApproval.requesterName}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedApproval.submittedAt).toLocaleString()}
              </Descriptions.Item>
              {selectedApproval.approverName && (
                <>
                  <Descriptions.Item label="审核人">
                    {selectedApproval.approverName}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核时间">
                    {selectedApproval.completedAt && new Date(selectedApproval.completedAt).toLocaleString()}
                  </Descriptions.Item>
                  {selectedApproval.comment && (
                    <Descriptions.Item label="审核意见">
                      {selectedApproval.comment}
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="审核通过"
        open={approveModalVisible}
        onOk={submitApprove}
        onCancel={() => setApproveModalVisible(false)}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item name="comment" label="审核意见">
            <TextArea rows={3} placeholder="请输入审核意见（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回申请"
        open={rejectModalVisible}
        onOk={submitReject}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="comment"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={3} placeholder="请输入驳回原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Approvals
