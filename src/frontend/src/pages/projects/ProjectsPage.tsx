import { useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Typography,
  message,
  Popconfirm,
  Alert,
  Row,
  Col,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { projectApi, authApi } from '@/api'
import { formatCurrency, documentStatusColors, documentStatusLabels } from '@/config/status'
import { DocumentStatus, UserRole, type Project, type CreateProjectDto } from '@/types'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', pagination.current, pagination.pageSize, searchText, statusFilter],
    queryFn: () =>
      projectApi.getProjects({
        pageIndex: pagination.current || 1,
        pageSize: pagination.pageSize,
        search: searchText || undefined,
        status: statusFilter,
      }),
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsersByRole(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectApi.createProject(data),
    onSuccess: () => {
      message.success('创建项目成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      message.error('创建项目失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectApi.updateProject(id, data as any),
    onSuccess: () => {
      message.success('更新项目成功')
      setIsModalOpen(false)
      setEditingProject(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      message.error('更新项目失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectApi.deleteProject(id),
    onSuccess: () => {
      message.success('删除项目成功')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      message.error('删除项目失败')
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        startDate: dayjs(values.startDate).toISOString(),
        expectedEndDate: values.expectedEndDate ? dayjs(values.expectedEndDate).toISOString() : undefined,
      }

      if (editingProject) {
        updateMutation.mutate({ id: editingProject.id, data: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    } catch {
      // 表单验证失败
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    form.setFieldsValue({
      name: project.name,
      address: project.address,
      description: project.description,
      totalBudget: project.totalBudget,
      startDate: dayjs(project.startDate),
      expectedEndDate: project.expectedEndDate ? dayjs(project.expectedEndDate) : undefined,
      ownerId: project.ownerId,
      designerId: project.designerId,
      foremanId: project.foremanId,
      supervisorId: project.supervisorId,
    })
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingProject(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const ownerOptions = users?.filter((u) => u.role === UserRole.Owner).map((u) => ({ value: u.id, label: u.fullName })) || []
  const designerOptions = users?.filter((u) => u.role === UserRole.Designer).map((u) => ({ value: u.id, label: u.fullName })) || []
  const foremanOptions = users?.filter((u) => u.role === UserRole.Foreman).map((u) => ({ value: u.id, label: u.fullName })) || []
  const supervisorOptions = users?.filter((u) => u.role === UserRole.Supervisor).map((u) => ({ value: u.id, label: u.fullName })) || []

  const statusOptions = Object.values(DocumentStatus).map((s) => ({
    value: s,
    label: documentStatusLabels[s],
  }))

  const columns: ColumnsType<Project> = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'projectNumber',
      width: 140,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '业主',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 100,
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      width: 130,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.totalBudget - b.totalBudget,
    },
    {
      title: '已支付',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 130,
      render: (value) => formatCurrency(value),
    },
    {
      title: '待支付',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 130,
      render: (value) => <Text type="warning">{formatCurrency(value)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={documentStatusColors[status as DocumentStatus]}>{documentStatusLabels[status as DocumentStatus]}</Tag>,
    },
    {
      title: '单据数',
      dataIndex: 'documentCount',
      key: 'documentCount',
      width: 80,
    },
    {
      title: '待审批',
      dataIndex: 'pendingApprovals',
      key: 'pendingApprovals',
      width: 80,
      render: (value) =>
        value > 0 ? <Tag color="orange">{value}</Tag> : <Text type="secondary">0</Text>,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个项目吗？"
            description="删除后无法恢复"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (error) {
    return (
      <Card>
        <Alert type="error" message="加载项目列表失败，请稍后重试" />
      </Card>
    )
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ marginBottom: 8 }}>
          项目管理
        </Title>
        <Text type="secondary">管理所有装修项目的信息和进度</Text>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="搜索项目名称、地址、编号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              allowClear
              options={statusOptions}
            />
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 280 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('')
                setStatusFilter(undefined)
                queryClient.invalidateQueries({ queryKey: ['projects'] })
              }}
            >
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建项目
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={data?.items}
            rowKey="id"
            loading={isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
            pagination={{
              ...pagination,
              total: data?.totalCount || 0,
              onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            }}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingProject(null)
          form.resetFields()
        }}
        okText={editingProject ? '保存' : '创建'}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="address"
            label="项目地址"
            rules={[{ required: true, message: '请输入项目地址' }]}
          >
            <Input placeholder="请输入项目地址" />
          </Form.Item>

          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalBudget"
                label="总预算（元）"
                rules={[{ required: true, message: '请输入总预算' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="请输入总预算"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedEndDate" label="预计完成日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择预计完成日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ownerId"
                label="业主"
                rules={[{ required: true, message: '请选择业主' }]}
              >
                <Select placeholder="选择业主" options={ownerOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="designerId" label="设计师">
                <Select placeholder="选择设计师" options={designerOptions} allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="foremanId" label="工长">
                <Select placeholder="选择工长" options={foremanOptions} allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supervisorId" label="监理">
                <Select placeholder="选择监理" options={supervisorOptions} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectsPage
