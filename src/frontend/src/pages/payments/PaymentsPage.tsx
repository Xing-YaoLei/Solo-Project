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
  Row,
  Col,
  Statistic,
  Alert,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { paymentApi, projectApi, documentApi } from '@/api'
import {
  formatCurrency,
  paymentStatusColors,
  paymentStatusLabels,
} from '@/config/status'
import { PaymentStatus, type Payment, type CreatePaymentDto } from '@/types'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>()
  const [projectFilter, setProjectFilter] = useState<string | undefined>()

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [form] = Form.useForm()

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', pagination.current, pagination.pageSize, statusFilter, projectFilter],
    queryFn: () =>
      paymentApi.getPayments({
        pageIndex: (pagination.current || 1) - 1,
        pageSize: pagination.pageSize,
        status: statusFilter,
        projectId: projectFilter,
      }),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectApi.getProjects({ pageSize: 1000 }),
  })

  const { data: documents } = useQuery({
    queryKey: ['documents', 'all'],
    queryFn: () => documentApi.getDocuments({ pageSize: 1000 }),
    enabled: isModalOpen,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentDto) => paymentApi.createPayment(data),
    onSuccess: () => {
      message.success('创建款项记录成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: () => {
      message.error('创建款项记录失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payment> }) =>
      paymentApi.updatePayment(id, data as any),
    onSuccess: () => {
      message.success('更新款项记录成功')
      setIsModalOpen(false)
      setEditingPayment(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: () => {
      message.error('更新款项记录失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentApi.deletePayment(id),
    onSuccess: () => {
      message.success('删除款项记录成功')
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: () => {
      message.error('删除款项记录失败')
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        paymentDate: values.paymentDate ? dayjs(values.paymentDate).toISOString() : undefined,
      }

      if (editingPayment) {
        updateMutation.mutate({ id: editingPayment.id, data: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    } catch {
      // 表单验证失败
    }
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    form.setFieldsValue({
      paymentType: payment.paymentType,
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transactionId,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate ? dayjs(payment.paymentDate) : undefined,
      remarks: payment.remarks,
      projectId: payment.projectId,
      documentId: payment.documentId,
    })
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingPayment(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const statusOptions = Object.values(PaymentStatus).map((s) => ({
    value: s,
    label: paymentStatusLabels[s],
  }))

  const projectOptions =
    projects?.items?.map((p) => ({
      value: p.id,
      label: `${p.projectNumber} - ${p.name}`,
    })) || []

  const documentOptions =
    documents?.items?.map((d) => ({
      value: d.id,
      label: `${d.documentNumber} - ${d.title}`,
    })) || []

  const paymentTypeOptions = [
    { value: '首付款', label: '首付款' },
    { value: '进度款', label: '进度款' },
    { value: '材料款', label: '材料款' },
    { value: '人工费', label: '人工费' },
    { value: '尾款', label: '尾款' },
    { value: '退款', label: '退款' },
    { value: '其他', label: '其他' },
  ]

  const paymentMethodOptions = [
    { value: '银行转账', label: '银行转账' },
    { value: '微信支付', label: '微信支付' },
    { value: '支付宝', label: '支付宝' },
    { value: '现金', label: '现金' },
    { value: '支票', label: '支票' },
    { value: '其他', label: '其他' },
  ]

  const totalPaid = data?.items?.filter((p) => p.status === PaymentStatus.Paid).reduce((sum, p) => sum + p.amount, 0) || 0
  const totalPending = data?.items?.filter((p) => p.status === PaymentStatus.Pending).reduce((sum, p) => sum + p.amount, 0) || 0
  const totalOverdue = data?.items?.filter((p) => p.status === PaymentStatus.Overdue).reduce((sum, p) => sum + p.amount, 0) || 0

  const columns: ColumnsType<Payment> = [
    {
      title: '付款编号',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 140,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '款项类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      ellipsis: true,
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/projects/${record.projectId}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '关联单据',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 140,
      render: (text, record) =>
        text ? (
          <Button type="link" onClick={() => navigate(`/documents/${record.documentId}`)}>
            {text}
          </Button>
        ) : (
          '-'
        ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (value) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={paymentStatusColors[status as PaymentStatus]} icon={
          status === PaymentStatus.Paid ? <CheckCircleOutlined /> :
          status === PaymentStatus.Overdue ? <WarningOutlined /> :
          <ClockCircleOutlined />
        }>
          {paymentStatusLabels[status as PaymentStatus]}
        </Tag>
      ),
      filters: statusOptions.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
    },
    {
      title: '交易单号',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      sorter: (a, b) => dayjs(a.paymentDate || 0).valueOf() - dayjs(b.paymentDate || 0).valueOf(),
    },
    {
      title: '记录人',
      dataIndex: 'recordedByName',
      key: 'recordedByName',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
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
            title="确定删除这条款项记录吗？"
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
        <Alert type="error" message="加载款项列表失败，请稍后重试" />
      </Card>
    )
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ marginBottom: 8 }}>
          款项管理
        </Title>
        <Text type="secondary">管理所有款项记录，跟踪收付款情况</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已收款总额"
              value={totalPaid}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
              prefixCls="ant-statistic"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="待收款总额"
              value={totalPending}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="逾期总额"
              value={totalOverdue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="搜索付款编号、项目名称、交易单号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="款项状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              allowClear
              options={statusOptions}
            />
            <Select
              placeholder="所属项目"
              value={projectFilter}
              onChange={setProjectFilter}
              style={{ width: 220 }}
              allowClear
              options={projectOptions}
              showSearch
              optionFilterProp="label"
            />
            <RangePicker
              placeholder={['付款开始日期', '付款结束日期']}
              style={{ width: 280 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('')
                setStatusFilter(undefined)
                setProjectFilter(undefined)
                queryClient.invalidateQueries({ queryKey: ['payments'] })
              }}
            >
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增款项
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
            scroll={{ x: 1600 }}
          />
        </Space>
      </Card>

      <Modal
        title={editingPayment ? '编辑款项' : '新增款项'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingPayment(null)
          form.resetFields()
        }}
        okText={editingPayment ? '保存' : '创建'}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentType"
                label="款项类型"
                rules={[{ required: true, message: '请选择款项类型' }]}
              >
                <Select placeholder="选择款项类型" options={paymentTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额（元）"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="请输入金额"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态" options={statusOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="付款日期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择付款日期" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="付款方式"
              >
                <Select placeholder="选择付款方式" options={paymentMethodOptions} allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="transactionId"
                label="交易单号"
              >
                <Input placeholder="请输入交易单号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="所属项目"
                rules={[{ required: true, message: '请选择所属项目' }]}
              >
                <Select
                  placeholder="选择所属项目"
                  options={projectOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="documentId"
                label="关联单据"
              >
                <Select
                  placeholder="选择关联单据（选填）"
                  options={documentOptions}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PaymentsPage
