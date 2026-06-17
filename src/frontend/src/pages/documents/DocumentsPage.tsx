import { useState, useMemo } from 'react'
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
  Checkbox,
  Row,
  Col,
  Badge,
  Drawer,
  List,
  Descriptions,
  Divider,
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
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { documentApi, projectApi } from '@/api'
import {
  formatCurrency,
  documentStatusColors,
  documentStatusLabels,
  documentTypeLabels,
  amountConsistencyColors,
  amountConsistencyLabels,
} from '@/config/status'
import {
  DocumentType,
  DocumentStatus,
  AmountConsistencyStatus,
  type Document,
  type DocumentFilterParams,
  type CreateDocumentDto,
  type CreateDocumentItemDto,
} from '@/types'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | undefined>(
    (searchParams.get('type') as DocumentType) || undefined
  )
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>(
    (searchParams.get('status') as DocumentStatus) || undefined
  )
  const [amountConsistencyFilter, setAmountConsistencyFilter] = useState<AmountConsistencyStatus | undefined>(
    (searchParams.get('amountConsistency') as AmountConsistencyStatus) || undefined
  )
  const [projectFilter, setProjectFilter] = useState<string | undefined>()

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)
  const [historyDocument, setHistoryDocument] = useState<Document | null>(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | 'status'>('status')
  const [batchStatus, setBatchStatus] = useState<DocumentStatus | undefined>()

  const [form] = Form.useForm<CreateDocumentDto & { items: CreateDocumentItemDto[] }>()
  const [items, setItems] = useState<CreateDocumentItemDto[]>([
    { itemOrder: 1, itemCode: '', name: '', unit: '', quantity: 1, unitPrice: 0 },
  ])

  const filterParams: DocumentFilterParams & { pageIndex?: number; pageSize?: number } = {
    type: typeFilter,
    status: statusFilter,
    amountConsistency: amountConsistencyFilter,
    projectId: projectFilter,
    search: searchText || undefined,
    pageIndex: pagination.current || 1,
    pageSize: pagination.pageSize,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents', filterParams],
    queryFn: () => documentApi.getDocuments(filterParams),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectApi.getProjects({ pageSize: 1000 }),
  })

  const { data: documentHistory } = useQuery({
    queryKey: ['document', historyDocument?.id, 'history'],
    queryFn: () => documentApi.getDocumentHistory(historyDocument!.id),
    enabled: !!historyDocument,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentDto) => documentApi.createDocument(data),
    onSuccess: () => {
      message.success('创建单据成功')
      setIsModalOpen(false)
      form.resetFields()
      setItems([{ itemOrder: 1, itemCode: '', name: '', unit: '', quantity: 1, unitPrice: 0 }])
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      message.error('创建单据失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: () => {
      message.success('删除单据成功')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      message.error('删除单据失败')
    },
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => documentApi.submitForApproval(id),
    onSuccess: () => {
      message.success('提交审批成功')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      message.error('提交审批失败')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => documentApi.approve(id),
    onSuccess: () => {
      message.success('审批通过成功')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      message.error('审批操作失败')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => documentApi.reject(id),
    onSuccess: () => {
      message.success('拒绝审批成功')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      message.error('拒绝操作失败')
    },
  })

  const batchUpdateMutation = useMutation({
    mutationFn: (params: { documentIds: string[]; status?: DocumentStatus }) =>
      documentApi.batchUpdate(params),
    onSuccess: () => {
      message.success('批量操作成功')
      setIsBatchModalOpen(false)
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      message.error('批量操作失败')
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const validItems = items.filter((item) => item.name && item.quantity > 0 && item.unitPrice > 0)
      
      if (validItems.length === 0) {
        message.error('请至少添加一个有效明细项')
        return
      }

      const totalAmount = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

      const createData: CreateDocumentDto = {
        type: values.type,
        title: values.title,
        description: values.description,
        expectedAmount: totalAmount,
        measurementDate: dayjs(values.measurementDate).toISOString(),
        projectId: values.projectId,
        items: validItems.map((item, index) => ({
          ...item,
          itemOrder: index + 1,
        })),
      }

      createMutation.mutate(createData)
    } catch {
      // 表单验证失败
    }
  }

  const handleBatchAction = () => {
    if (batchAction === 'approve') {
      batchUpdateMutation.mutate({
        documentIds: selectedRowKeys as string[],
        status: DocumentStatus.Approved,
      })
    } else if (batchAction === 'reject') {
      batchUpdateMutation.mutate({
        documentIds: selectedRowKeys as string[],
        status: DocumentStatus.Rejected,
      })
    } else if (batchAction === 'status' && batchStatus) {
      batchUpdateMutation.mutate({
        documentIds: selectedRowKeys as string[],
        status: batchStatus,
      })
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        itemOrder: items.length + 1,
        itemCode: '',
        name: '',
        unit: '',
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems.map((item, i) => ({ ...item, itemOrder: i + 1 })))
  }

  const updateItem = (index: number, field: keyof CreateDocumentItemDto, value: string | number) => {
    const newItems = [...items]
    ;(newItems[index] as any)[field] = value
    setItems(newItems)
  }

  const handleViewHistory = (document: Document) => {
    setHistoryDocument(document)
    setIsHistoryDrawerOpen(true)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  const totalExpected = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items]
  )

  const typeOptions = Object.values(DocumentType).map((t) => ({
    value: t,
    label: documentTypeLabels[t],
  }))

  const statusOptions = Object.values(DocumentStatus).map((s) => ({
    value: s,
    label: documentStatusLabels[s],
  }))

  const consistencyOptions = Object.values(AmountConsistencyStatus).map((s) => ({
    value: s,
    label: amountConsistencyLabels[s],
  }))

  const projectOptions =
    projects?.items?.map((p) => ({
      value: p.id,
      label: `${p.projectNumber} - ${p.name}`,
    })) || []

  const columns: ColumnsType<Document> = [
    {
      title: '单据编号',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 140,
      fixed: 'left',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/documents/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => documentTypeLabels[type as DocumentType] || type,
      filters: typeOptions.map((t) => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '预期金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      width: 130,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.expectedAmount - b.expectedAmount,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 130,
      render: (value) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: '差额',
      dataIndex: 'amountDifference',
      key: 'amountDifference',
      width: 120,
      render: (value, record) => {
        if (record.amountConsistency === AmountConsistencyStatus.Consistent) {
          return <span className="amount-consistent">{formatCurrency(value)}</span>
        }
        return <span className="amount-difference">{formatCurrency(value)}</span>
      },
    },
    {
      title: '金额一致性',
      dataIndex: 'amountConsistency',
      key: 'amountConsistency',
      width: 120,
      render: (status) => {
        const icon =
          status === AmountConsistencyStatus.Inconsistent ? (
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          ) : status === AmountConsistencyStatus.Consistent ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <WarningOutlined style={{ color: '#faad14' }} />
          )
        return (
          <Tag color={amountConsistencyColors[status as AmountConsistencyStatus]} icon={icon}>
            {amountConsistencyLabels[status as AmountConsistencyStatus]}
          </Tag>
        )
      },
      filters: consistencyOptions.map((c) => ({ text: c.label, value: c.value })),
      onFilter: (value, record) => record.amountConsistency === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={documentStatusColors[status as DocumentStatus]}>{documentStatusLabels[status as DocumentStatus]}</Tag>,
      filters: statusOptions.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100,
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/documents/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            历史
          </Button>
          {record.status === DocumentStatus.Draft && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => submitMutation.mutate(record.id)}
              loading={submitMutation.isPending}
            >
              提交
            </Button>
          )}
          {(record.status === DocumentStatus.PendingReview ||
            record.status === DocumentStatus.PendingApproval) && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => approveMutation.mutate(record.id)}
                loading={approveMutation.isPending}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => rejectMutation.mutate(record.id)}
                loading={rejectMutation.isPending}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === DocumentStatus.Draft && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
            >
              编辑
            </Button>
          )}
          <Popconfirm
            title="确定删除这个单据吗？"
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
        <Alert type="error" message="加载单据列表失败，请稍后重试" />
      </Card>
    )
  }

  const hasSelected = selectedRowKeys.length > 0

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ marginBottom: 8 }}>
          单据管理
        </Title>
        <Text type="secondary">管理所有业务单据，支持筛选、批量操作和审批流程</Text>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="搜索单据编号、标题、项目名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="单据类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 160 }}
              allowClear
              options={typeOptions}
            />
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              allowClear
              options={statusOptions}
            />
            <Select
              placeholder="金额一致性"
              value={amountConsistencyFilter}
              onChange={setAmountConsistencyFilter}
              style={{ width: 140 }}
              allowClear
              options={consistencyOptions}
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
              placeholder={['开始日期', '结束日期']}
              style={{ width: 280 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('')
                setTypeFilter(undefined)
                setStatusFilter(undefined)
                setAmountConsistencyFilter(undefined)
                setProjectFilter(undefined)
                queryClient.invalidateQueries({ queryKey: ['documents'] })
              }}
            >
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              新建单据
            </Button>
          </Space>

          {hasSelected && (
            <Alert
              message={
                <Space>
                  <Badge count={selectedRowKeys.length} showZero style={{ backgroundColor: '#1890ff' }}>
                    <span>已选择</span>
                  </Badge>
                  <Button size="small" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                  </Button>
                  <Button type="primary" size="small" onClick={() => { setBatchAction('approve'); setIsBatchModalOpen(true) }}>
                    批量通过
                  </Button>
                  <Button danger size="small" onClick={() => { setBatchAction('reject'); setIsBatchModalOpen(true) }}>
                    批量拒绝
                  </Button>
                  <Button size="small" onClick={() => { setBatchAction('status'); setIsBatchModalOpen(true) }}>
                    批量改状态
                  </Button>
                </Space>
              }
              type="info"
              showIcon
            />
          )}

          <Table
            columns={columns}
            dataSource={data?.items}
            rowKey="id"
            loading={
              isLoading ||
              createMutation.isPending ||
              deleteMutation.isPending ||
              submitMutation.isPending ||
              approveMutation.isPending ||
              rejectMutation.isPending
            }
            pagination={{
              ...pagination,
              total: data?.totalCount || 0,
              onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            }}
            rowSelection={rowSelection}
            scroll={{ x: 1800 }}
            rowClassName={(record) => {
              if (record.amountConsistency === AmountConsistencyStatus.Inconsistent) {
                return 'inconsistent-row'
              }
              if (
                record.status === DocumentStatus.PendingApproval ||
                record.status === DocumentStatus.PendingReview
              ) {
                return 'pending-row'
              }
              return ''
            }}
          />
        </Space>
      </Card>

      <Modal
        title="新建单据"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
          setItems([{ itemOrder: 1, itemCode: '', name: '', unit: '', quantity: 1, unitPrice: 0 }])
        }}
        okText="创建"
        confirmLoading={createMutation.isPending}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="单据类型"
                rules={[{ required: true, message: '请选择单据类型' }]}
              >
                <Select placeholder="选择单据类型" options={typeOptions} />
              </Form.Item>
            </Col>
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
          </Row>

          <Form.Item
            name="title"
            label="单据标题"
            rules={[{ required: true, message: '请输入单据标题' }]}
          >
            <Input placeholder="请输入单据标题" />
          </Form.Item>

          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={2} placeholder="请输入备注说明" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="measurementDate"
                label="测量/记录日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="明细合计金额">
                <Input
                  value={formatCurrency(totalExpected)}
                  readOnly
                  style={{ fontWeight: 'bold', color: '#1890ff' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">明细项</Divider>

          {items.map((item, index) => (
            <Row gutter={8} key={index} style={{ marginBottom: 8 }} align="top">
              <Col span={1}>
                <div style={{ paddingTop: 8, textAlign: 'center' }}>{item.itemOrder}</div>
              </Col>
              <Col span={4}>
                <Input
                  placeholder="编码"
                  value={item.itemCode}
                  onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                />
              </Col>
              <Col span={6}>
                <Input
                  placeholder="名称 *"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                />
              </Col>
              <Col span={4}>
                <Input
                  placeholder="规格"
                  value={item.specification}
                  onChange={(e) => updateItem(index, 'specification', e.target.value)}
                />
              </Col>
              <Col span={3}>
                <Input
                  placeholder="单位"
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                />
              </Col>
              <Col span={3}>
                <InputNumber
                  placeholder="数量"
                  min={0}
                  precision={2}
                  value={item.quantity}
                  onChange={(value) => updateItem(index, 'quantity', value || 0)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="单价"
                  min={0}
                  precision={2}
                  value={item.unitPrice}
                  onChange={(value) => updateItem(index, 'unitPrice', value || 0)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={2}>
                <Input
                  value={formatCurrency(item.quantity * item.unitPrice)}
                  readOnly
                  style={{ fontWeight: 'bold', color: '#1890ff' }}
                />
              </Col>
              <Col span={1}>
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                />
              </Col>
            </Row>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>
            添加明细项
          </Button>
        </Form>
      </Modal>

      <Modal
        title="批量操作"
        open={isBatchModalOpen}
        onOk={handleBatchAction}
        onCancel={() => setIsBatchModalOpen(false)}
        confirmLoading={batchUpdateMutation.isPending}
      >
        <p>已选择 {selectedRowKeys.length} 条单据</p>
        {batchAction === 'status' && (
          <Form.Item label="目标状态" style={{ marginTop: 16 }}>
            <Select
              value={batchStatus}
              onChange={setBatchStatus}
              placeholder="选择目标状态"
              style={{ width: '100%' }}
              options={statusOptions}
            />
          </Form.Item>
        )}
        <Checkbox style={{ marginTop: 16 }}>我已确认操作内容，此操作不可撤销</Checkbox>
      </Modal>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>{historyDocument?.documentNumber} - 变更历史</span>
          </Space>
        }
        placement="right"
        onClose={() => {
          setIsHistoryDrawerOpen(false)
          setHistoryDocument(null)
        }}
        open={isHistoryDrawerOpen}
        width={600}
      >
        {historyDocument && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="单据编号">{historyDocument.documentNumber}</Descriptions.Item>
              <Descriptions.Item label="单据标题">{historyDocument.title}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={documentStatusColors[historyDocument.status]}>
                  {documentStatusLabels[historyDocument.status]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">变更记录</Divider>

            <List
              dataSource={documentHistory || []}
              loading={!documentHistory}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.action}</Text>
                        {item.oldStatus && item.newStatus && (
                          <>
                            <Tag color={documentStatusColors[item.oldStatus]}>
                              {documentStatusLabels[item.oldStatus]}
                            </Tag>
                            <span>→</span>
                            <Tag color={documentStatusColors[item.newStatus]}>
                              {documentStatusLabels[item.newStatus]}
                            </Tag>
                          </>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          {item.createdByName} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                        {item.conclusion && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">结论：</Text>
                            <Text>{item.conclusion}</Text>
                          </div>
                        )}
                        {item.oldValues && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">变更前：</Text>
                            <Text>{item.oldValues}</Text>
                          </div>
                        )}
                        {item.newValues && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">变更后：</Text>
                            <Text>{item.newValues}</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default DocumentsPage
