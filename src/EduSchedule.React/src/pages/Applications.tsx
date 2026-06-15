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
  Upload,
  DatePicker,
  Descriptions,
  Timeline,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  EyeOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { api } from '../services/api'
import { approvalStatusLabels } from '../utils/enumLabels'
import type { Application } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const Applications = () => {
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [page, pageSize, searchText, typeFilter, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [appRes, statsRes] = await Promise.all([
        api.applications.getList({
          page,
          pageSize,
          search: searchText,
          applicationType: typeFilter,
          status: statusFilter,
        }),
        api.applications.getStats(),
      ])

      setApplications(appRes.data.items)
      setTotal(appRes.data.total)
      setStats(statsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingApplication(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (application: Application) => {
    if (application.status !== 'Draft' && application.status !== 'Rejected') {
      message.warning('该申请已提交，无法编辑')
      return
    }
    setEditingApplication(application)
    form.setFieldsValue({
      ...application,
      applicationDate: application.applicationDate ? dayjs(application.applicationDate) : null,
    })
    setModalVisible(true)
  }

  const handleViewDetail = (application: Application) => {
    setSelectedApplication(application)
    setDetailModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.applications.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        applicationDate: values.applicationDate?.format('YYYY-MM-DD'),
      }
      if (editingApplication) {
        await api.applications.update(editingApplication.id, data)
        message.success('更新成功')
      } else {
        await api.applications.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleSubmitForApproval = async (id: number) => {
    try {
      await api.applications.submitForApproval(id)
      message.success('已提交审核')
      loadData()
    } catch (error) {
      message.error('提交失败')
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CourseSelection: '选课申请',
      CourseDrop: '退课申请',
      CourseChange: '换课申请',
      MakeUpExam: '补考申请',
      StudyAbroad: '留学申请',
      Other: '其他申请',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CourseSelection: 'blue',
      CourseDrop: 'orange',
      CourseChange: 'purple',
      MakeUpExam: 'cyan',
      StudyAbroad: 'green',
      Other: 'default',
    }
    return colors[type] || 'default'
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

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 150,
    },
    {
      title: '申请类型',
      dataIndex: 'applicationType',
      key: 'applicationType',
      width: 120,
      render: (type: string) => (
        <Tag color={getTypeColor(type)} icon={<FormOutlined />}>
          {getTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: '申请标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100,
    },
    {
      title: '申请日期',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      width: 120,
      render: (date: string) => date && new Date(date).toLocaleDateString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'Pending' && <ClockCircleOutlined />}
          {status === 'Approved' && <CheckCircleOutlined />}
          {status === 'Rejected' && <CloseCircleOutlined />}
          {' '}{approvalStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '审核人',
      dataIndex: 'approverName',
      key: 'approverName',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: Application) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {(record.status === 'Draft' || record.status === 'Rejected') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {record.status === 'Draft' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSubmitForApproval(record.id)}
              style={{ color: '#1890ff' }}
            >
              提交
            </Button>
          )}
          {record.status === 'Draft' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
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
              title="待审核"
              value={stats.pending || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已通过"
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
              title="草稿"
              value={stats.draft || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search
              placeholder="搜索申请编号或标题"
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
              placeholder="申请类型"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => {
                setTypeFilter(value)
                setPage(1)
              }}
            >
              <Option value="CourseSelection">选课申请</Option>
              <Option value="CourseDrop">退课申请</Option>
              <Option value="CourseChange">换课申请</Option>
              <Option value="MakeUpExam">补考申请</Option>
              <Option value="StudyAbroad">留学申请</Option>
              <Option value="Other">其他申请</Option>
            </Select>
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <Option value="Draft">草稿</Option>
              <Option value="Pending">待审核</Option>
              <Option value="Approved">已通过</Option>
              <Option value="Rejected">已驳回</Option>
              <Option value="NeedsRevision">需修改</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建申请
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={applications}
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
        title={editingApplication ? '编辑申请' : '新建申请'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="applicationType"
                label="申请类型"
                rules={[{ required: true, message: '请选择申请类型' }]}
              >
                <Select placeholder="请选择申请类型">
                  <Option value="CourseSelection">选课申请</Option>
                  <Option value="CourseDrop">退课申请</Option>
                  <Option value="CourseChange">换课申请</Option>
                  <Option value="MakeUpExam">补考申请</Option>
                  <Option value="StudyAbroad">留学申请</Option>
                  <Option value="Other">其他申请</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="applicationDate"
                label="申请日期"
                rules={[{ required: true, message: '请选择申请日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="申请标题"
            rules={[{ required: true, message: '请输入申请标题' }]}
          >
            <Input placeholder="请简要描述申请事项" />
          </Form.Item>
          <Form.Item
            name="description"
            label="申请详情"
            rules={[{ required: true, message: '请输入申请详情' }]}
          >
            <TextArea rows={4} placeholder="请详细描述申请原因和内容" />
          </Form.Item>
          <Form.Item name="relatedCourseId" label="相关课程">
            <Select placeholder="请选择相关课程（可选）" allowClear>
              <Option value={1}>CS101 - 计算机基础</Option>
              <Option value={2}>MA101 - 高等数学</Option>
              <Option value={3}>EN101 - 大学英语</Option>
            </Select>
          </Form.Item>
          <Form.Item name="attachments" label="附件材料">
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={5}
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedApplication && (
          <div>
            <Alert
              message={approvalStatusLabels[selectedApplication.status]}
              type={selectedApplication.status === 'Approved' ? 'success' :
                    selectedApplication.status === 'Rejected' ? 'error' :
                    selectedApplication.status === 'NeedsRevision' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请编号">
                {selectedApplication.applicationNo}
              </Descriptions.Item>
              <Descriptions.Item label="申请类型">
                <Tag color={getTypeColor(selectedApplication.applicationType)}>
                  {getTypeLabel(selectedApplication.applicationType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedApplication.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="申请日期">
                {selectedApplication.applicationDate &&
                  new Date(selectedApplication.applicationDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="申请标题" span={2}>
                {selectedApplication.title}
              </Descriptions.Item>
              <Descriptions.Item label="申请内容" span={2}>
                {selectedApplication.description}
              </Descriptions.Item>
              {selectedApplication.approverName && (
                <>
                  <Descriptions.Item label="审核人">
                    {selectedApplication.approverName}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核时间">
                    {selectedApplication.approvedAt &&
                      new Date(selectedApplication.approvedAt).toLocaleString()}
                  </Descriptions.Item>
                  {selectedApplication.approvalComment && (
                    <Descriptions.Item label="审核意见" span={2}>
                      {selectedApplication.approvalComment}
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>

            {selectedApplication.approvalHistory && selectedApplication.approvalHistory.length > 0 && (
              <>
                <h4 style={{ marginBottom: 12 }}>审核历史</h4>
                <Timeline
                  size="small"
                  items={selectedApplication.approvalHistory.map((h: any) => ({
                    color: h.status === 'Approved' ? 'green' :
                           h.status === 'Rejected' ? 'red' : 'blue',
                    children: (
                      <div>
                        <Space>
                          <strong>{h.approverName}</strong>
                          <Tag color={h.status === 'Approved' ? 'success' :
                                     h.status === 'Rejected' ? 'error' : 'default'}>
                            {approvalStatusLabels[h.status]}
                          </Tag>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {new Date(h.createdAt).toLocaleString()}
                          </span>
                        </Space>
                        {h.comment && <div style={{ marginTop: 4 }}>{h.comment}</div>}
                      </div>
                    ),
                  }))}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Applications
