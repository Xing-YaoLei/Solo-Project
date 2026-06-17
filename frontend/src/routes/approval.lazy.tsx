import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  Drawer,
  Tabs,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Steps,
  Switch,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined as AntFileTextOutlined,
  ClockCircleOutlined as AntClockCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalApi, billApi, timelineApi } from '@/api'
import type { ApprovalNode, ApprovalRecord, Bill, PaginationParams } from '@/types'
import dayjs from 'dayjs'
import { useState, useMemo } from 'react'
import StatusTimelineComponent from '@/components/StatusTimeline'

// @ts-ignore
export const Route = createLazyFileRoute('/approval')({
  component: ApprovalPage,
})

const { Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface ExtendedPaginationParams extends PaginationParams {
  bill_id?: number
}

const APPROVAL_STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending: { text: '待审批', color: 'warning' },
  processing: { text: '审批中', color: 'processing' },
  approved: { text: '已通过', color: 'success' },
  rejected: { text: '已驳回', color: 'error' },
}

const APPROVAL_TYPE_MAP: Record<string, string> = {
  and: '会签',
  or: '或签',
  single: '单人审批',
  sequential: '顺序审批',
}

const APPROVAL_TYPE_OPTIONS = Object.entries(APPROVAL_TYPE_MAP).map(([value, label]) => ({
  value,
  label,
}))

const APPROVAL_STATUS_OPTIONS = Object.entries(APPROVAL_STATUS_MAP).map(([value, { text }]) => ({
  value,
  label: text,
}))

const APPROVAL_ROLE_OPTIONS = [
  { value: 'manager', label: '项目经理' },
  { value: 'finance', label: '财务' },
  { value: 'director', label: '总监' },
  { value: 'ceo', label: '总经理' },
  { value: 'designer', label: '设计师' },
  { value: 'sales', label: '销售' },
  { value: 'buyer', label: '采购员' },
  { value: 'qa', label: '质量员' },
]

interface NodeFormData {
  node_name: string
  node_code: string
  approver_role?: string
  approver_id?: number
  approval_type: string
  sort_order: number
  is_active: number
  description?: string
}

interface ApproveFormData {
  approval_opinion?: string
}

function ApprovalPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('nodes')
  const [nodePagination, setNodePagination] = useState({ page: 1, page_size: 10 })
  const [recordPagination, setRecordPagination] = useState({ page: 1, page_size: 10 })
  const [nodeFilters, setNodeFilters] = useState<PaginationParams>({})
  const [recordFilters, setRecordFilters] = useState<ExtendedPaginationParams>({})
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [flowDrawerOpen, setFlowDrawerOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<ApprovalNode | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<ApprovalRecord | null>(null)
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null)
  const [nodeForm] = Form.useForm<NodeFormData>()
  const [approveForm] = Form.useForm<ApproveFormData>()

  const { data: nodesData, isLoading: nodesLoading } = useQuery({
    queryKey: ['approval-nodes', nodePagination, nodeFilters],
    queryFn: () => approvalApi.getNodes({ ...nodePagination, ...nodeFilters }),
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['approval-records', recordPagination, recordFilters],
    queryFn: () => approvalApi.getRecords({ ...recordPagination, ...recordFilters }),
  })

  const { data: billsData } = useQuery({
    queryKey: ['bills', 'all'],
    queryFn: () => billApi.getList({ page_size: 100 }),
  })

  const { data: billFlowRecords } = useQuery({
    queryKey: ['bill-flow-records', selectedBillId],
    queryFn: () => selectedBillId ? approvalApi.getRecordsByBill(selectedBillId) : [],
    enabled: !!selectedBillId,
  })

  const { data: billFlowTimeline } = useQuery({
    queryKey: ['bill-flow-timeline', selectedBillId],
    queryFn: () => selectedBillId ? timelineApi.getByBill(selectedBillId) : [],
    enabled: !!selectedBillId,
  })

  const { data: billDetail } = useQuery({
    queryKey: ['bill-detail', selectedBillId],
    queryFn: () => selectedBillId ? billApi.getDetail(selectedBillId) : null,
    enabled: !!selectedBillId,
  })

  const createNodeMutation = useMutation({
    mutationFn: (data: Partial<ApprovalNode>) => approvalApi.createNode(data),
    onSuccess: () => {
      message.success('审批节点创建成功')
      setNodeModalOpen(false)
      nodeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['approval-nodes'] })
    },
    onError: () => message.error('审批节点创建失败'),
  })

  const updateNodeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApprovalNode> }) =>
      approvalApi.updateNode(id, data),
    onSuccess: () => {
      message.success('审批节点更新成功')
      setNodeModalOpen(false)
      setEditingNode(null)
      nodeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['approval-nodes'] })
    },
    onError: () => message.error('审批节点更新失败'),
  })

  const deleteNodeMutation = useMutation({
    mutationFn: (id: number) => approvalApi.deleteNode(id),
    onSuccess: () => {
      message.success('审批节点删除成功')
      queryClient.invalidateQueries({ queryKey: ['approval-nodes'] })
    },
    onError: () => message.error('审批节点删除失败'),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { approval_opinion?: string } }) =>
      approvalApi.approve(id, data),
    onSuccess: () => {
      message.success('审批通过')
      setApproveModalOpen(false)
      approveForm.resetFields()
      setSelectedRecord(null)
      queryClient.invalidateQueries({ queryKey: ['approval', 'list'] })
    },
    onError: () => message.error('审批操作失败'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { approval_opinion?: string } }) =>
      approvalApi.reject(id, data),
    onSuccess: () => {
      message.success('已驳回')
      setApproveModalOpen(false)
      approveForm.resetFields()
      setSelectedRecord(null)
      queryClient.invalidateQueries({ queryKey: ['approval', 'list'] })
    },
    onError: () => message.error('驳回操作失败'),
  })

  const handleNodeSearch = (value: string) => {
    setNodeFilters({ ...nodeFilters, keyword: value })
    setNodePagination({ ...nodePagination, page: 1 })
  }

  const handleRecordSearch = (value: string) => {
    setRecordFilters({ ...recordFilters, keyword: value })
    setRecordPagination({ ...recordPagination, page: 1 })
  }

  const handleRecordStatusFilter = (value: string | undefined) => {
    setRecordFilters({ ...recordFilters, status: value || undefined })
    setRecordPagination({ ...recordPagination, page: 1 })
  }

  const handleRecordBillFilter = (value: number | undefined) => {
    if (value) {
      setRecordFilters({ ...recordFilters, bill_id: value })
    } else {
      const { bill_id, ...rest } = recordFilters
      setRecordFilters(rest)
    }
    setRecordPagination({ ...recordPagination, page: 1 })
  }

  const handleCreateNode = () => {
    setEditingNode(null)
    nodeForm.resetFields()
    nodeForm.setFieldsValue({
      approval_type: 'single',
      sort_order: (nodesData?.total || 0) + 1,
      is_active: 1,
    })
    setNodeModalOpen(true)
  }

  const handleEditNode = (node: ApprovalNode) => {
    setEditingNode(node)
    nodeForm.setFieldsValue({
      node_name: node.node_name,
      node_code: node.node_code,
      approver_role: node.approver_role,
      approver_id: node.approver_id,
      approval_type: node.approval_type,
      sort_order: node.sort_order,
      is_active: node.is_active,
      description: node.description,
    })
    setNodeModalOpen(true)
  }

  const handleDeleteNode = (id: number) => {
    deleteNodeMutation.mutate(id)
  }

  const handleNodeSubmit = async () => {
    try {
      const values = await nodeForm.validateFields()
      const data = {
        ...values,
        is_active: values.is_active ? 1 : 0,
      }

      if (editingNode) {
        updateNodeMutation.mutate({ id: editingNode.id, data })
      } else {
        createNodeMutation.mutate(data)
      }
    } catch {
      message.error('请检查表单填写是否完整')
    }
  }

  const handleApprove = (record: ApprovalRecord) => {
    setSelectedRecord(record)
    approveForm.resetFields()
    setApproveModalOpen(true)
  }

  const handleApproveSubmit = (approve: boolean) => {
    approveForm.validateFields().then((values) => {
      if (selectedRecord) {
        const data = { approval_opinion: values.approval_opinion }
        if (approve) {
          approveMutation.mutate({ id: selectedRecord.id, data })
        } else {
          rejectMutation.mutate({ id: selectedRecord.id, data })
        }
      }
    })
  }

  const handleViewFlow = (billId: number) => {
    setSelectedBillId(billId)
    setFlowDrawerOpen(true)
  }

  const nodeColumns = [
    {
      title: '节点名称',
      dataIndex: 'node_name',
      key: 'node_name',
      width: 150,
    },
    {
      title: '节点编码',
      dataIndex: 'node_code',
      key: 'node_code',
      width: 120,
    },
    {
      title: '审批角色',
      dataIndex: 'approver_role',
      key: 'approver_role',
      width: 100,
      render: (role: string) => {
        const map: Record<string, string> = {
          manager: '项目经理',
          finance: '财务',
          director: '总监',
          ceo: '总经理',
          designer: '设计师',
          sales: '销售',
          buyer: '采购员',
          qa: '质量员',
        }
        return map[role] || role || '-'
      },
    },
    {
      title: '审批人',
      dataIndex: 'approver_id',
      key: 'approver_id',
      width: 100,
      render: (id: number) => (id ? `用户#${id}` : '-'),
    },
    {
      title: '审批类型',
      dataIndex: 'approval_type',
      key: 'approval_type',
      width: 100,
      render: (type: string) => APPROVAL_TYPE_MAP[type] || type,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (order: number) => order,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: number) => (
        <Tag color={active ? 'success' : 'default'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: ApprovalNode) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditNode(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后数据无法恢复，确认删除吗？"
            onConfirm={() => handleDeleteNode(record.id)}
            okText="确认"
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

  const recordColumns = [
    {
      title: '单据编号',
      key: 'bill_no',
      width: 140,
      render: (_: any, record: ApprovalRecord) => (
        <a onClick={() => handleViewFlow(record.bill_id)}>查看 #{record.bill_id}</a>
      ),
    },
    {
      title: '单据ID',
      dataIndex: 'bill_id',
      key: 'bill_id',
      width: 100,
    },
    {
      title: '审批节点',
      dataIndex: ['node', 'node_name'],
      key: 'node_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '审批人',
      dataIndex: ['approver', 'full_name'],
      key: 'approver',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 100,
      render: (status: string) => {
        const config = APPROVAL_STATUS_MAP[status] || { text: status, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '审批意见',
      dataIndex: 'approval_opinion',
      key: 'approval_opinion',
      ellipsis: true,
      render: (opinion: string) => opinion || '-',
    },
    {
      title: '审批时间',
      dataIndex: 'approved_at',
      key: 'approved_at',
      width: 160,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: ApprovalRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewFlow(record.bill_id)}
          >
            查看流程
          </Button>
          {record.approval_status === 'pending' || record.approval_status === 'processing' ? (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
              >
                审批
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ]

  const flowSteps = useMemo(() => {
    if (!billFlowRecords || billFlowRecords.length === 0) return []

    const sortedRecords = [...billFlowRecords].sort((a, b) => a.sort_order - b.sort_order)

    return sortedRecords.map((record, index) => {
      const statusMap: Record<string, 'process' | 'finish' | 'error' | 'wait'> = {
        pending: 'wait',
        processing: 'process',
        approved: 'finish',
        rejected: 'error',
      }

      const getIconColor = (status: string) => {
        const colors: Record<string, string> = {
          approved: '#52c41a',
          rejected: '#ff4d4f',
          processing: '#1677ff',
          pending: '#faad14',
        }
        return colors[status] || '#faad14'
      }

      const getIcon = (status: string) => {
        if (status === 'approved') return <CheckCircleOutlined />
        if (status === 'rejected') return <CloseCircleOutlined />
        if (status === 'processing') return <UserOutlined />
        return <AntClockCircleOutlined />
      }

      return {
        title: record.node?.node_name || `节点${index + 1}`,
        description: (
          <div className="text-xs">
            <div>
              审批人: {record.approver?.full_name || '待指定'}
            </div>
            {record.approval_opinion && (
              <div className="text-gray-500 mt-1">意见: {record.approval_opinion}</div>
            )}
            {record.approved_at && (
              <div className="text-gray-400 mt-1">
                {dayjs(record.approved_at).format('YYYY-MM-DD HH:mm')}
              </div>
            )}
          </div>
        ),
        status: statusMap[record.approval_status] || 'wait',
        icon: (
          <span style={{ color: getIconColor(record.approval_status) }}>
            {getIcon(record.approval_status)}
          </span>
        ),
      }
    })
  }, [billFlowRecords])

  const nodeTabContent = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input.Search
          placeholder="搜索节点名称/编码"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleNodeSearch}
          style={{ width: 280 }}
        />
        <Button onClick={() => { setNodeFilters({}); setNodePagination({ page: 1, page_size: 10 }) }}>
          重置筛选
        </Button>
      </div>

      <Table
        dataSource={nodesData?.items || []}
        columns={nodeColumns}
        rowKey="id"
        loading={nodesLoading}
        scroll={{ x: 1000 }}
        pagination={{
          current: nodePagination.page,
          pageSize: nodePagination.page_size,
          total: nodesData?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, page_size) => setNodePagination({ page, page_size }),
        }}
      />
    </div>
  )

  const recordTabContent = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input.Search
          placeholder="搜索单据编号/名称"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleRecordSearch}
          style={{ width: 280 }}
        />
        <Select
          placeholder="筛选单据"
          allowClear
          style={{ width: 200 }}
          onChange={handleRecordBillFilter}
          showSearch
          optionFilterProp="children"
        >
          {billsData?.items?.map((bill: Bill) => (
            <Option key={bill.id} value={bill.id}>
              {bill.bill_no} - {bill.bill_name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 160 }}
          onChange={handleRecordStatusFilter}
        >
          {APPROVAL_STATUS_OPTIONS.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
        <Button onClick={() => { setRecordFilters({}); setRecordPagination({ page: 1, page_size: 10 }) }}>
          重置筛选
        </Button>
      </div>

      <Table
        dataSource={recordsData?.items || []}
        columns={recordColumns}
        rowKey="id"
        loading={recordsLoading}
        scroll={{ x: 1100 }}
        pagination={{
          current: recordPagination.page,
          pageSize: recordPagination.page_size,
          total: recordsData?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, page_size) => setRecordPagination({ page, page_size }),
        }}
      />
    </div>
  )

  const tabItems = [
    {
      key: 'nodes',
      label: (
        <span>
          <TeamOutlined />
          审批节点
        </span>
      ),
      children: nodeTabContent,
    },
    {
      key: 'records',
      label: (
        <span>
          <AntFileTextOutlined />
          审批记录
        </span>
      ),
      children: recordTabContent,
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        title="审批管理"
        extra={
          activeTab === 'nodes' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNode}>
              新增节点
            </Button>
          ) : null
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          indicatorSize={(origin) => origin - 16}
        />
      </Card>

      <Modal
        title={editingNode ? '编辑审批节点' : '新增审批节点'}
        open={nodeModalOpen}
        width={600}
        onOk={handleNodeSubmit}
        onCancel={() => { setNodeModalOpen(false); setEditingNode(null) }}
        confirmLoading={createNodeMutation.isPending || updateNodeMutation.isPending}
        okText="保存"
        cancelText="取消"
      >
        <Form form={nodeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="node_name"
                label="节点名称"
                rules={[{ required: true, message: '请输入节点名称' }]}
              >
                <Input placeholder="请输入节点名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="node_code"
                label="节点编码"
                rules={[{ required: true, message: '请输入节点编码' }]}
              >
                <Input placeholder="请输入节点编码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="approver_role" label="审批角色">
                <Select placeholder="请选择审批角色" allowClear>
                  {APPROVAL_ROLE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="approver_id" label="指定审批人">
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder="指定用户ID（可选）"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="approval_type"
                label="审批类型"
                rules={[{ required: true, message: '请选择审批类型' }]}
              >
                <Select placeholder="请选择审批类型">
                  {APPROVAL_TYPE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder="排序值，数字越小越靠前"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入节点描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`审批 - ${selectedRecord?.node?.node_name || ''}`}
        open={approveModalOpen}
        width={500}
        onCancel={() => { setApproveModalOpen(false); setSelectedRecord(null) }}
        confirmLoading={approveMutation.isPending || rejectMutation.isPending}
        footer={[
          <Button key="cancel" onClick={() => setApproveModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleApproveSubmit(false)}
            disabled={selectedRecord?.approval_status !== 'pending' && selectedRecord?.approval_status !== 'processing'}
          >
            驳回
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApproveSubmit(true)}
            disabled={selectedRecord?.approval_status !== 'pending' && selectedRecord?.approval_status !== 'processing'}
          >
            通过
          </Button>,
        ]}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <Text type="secondary">单据ID:</Text> #{selectedRecord.bill_id}
                </div>
                <div>
                  <Text type="secondary">节点:</Text> {selectedRecord.node?.node_name}
                </div>
                <div>
                  <Text type="secondary">当前状态:</Text>{' '}
                  <Tag color={APPROVAL_STATUS_MAP[selectedRecord.approval_status]?.color || 'default'}>
                    {APPROVAL_STATUS_MAP[selectedRecord.approval_status]?.text || selectedRecord.approval_status}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">提交时间:</Text>{' '}
                  {dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            </div>

            <Form form={approveForm} layout="vertical">
              <Form.Item
                name="approval_opinion"
                label="审批意见"
                rules={[{ required: false, message: '请输入审批意见' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入审批意见（驳回时必填）"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Drawer
        title="审批流程"
        placement="right"
        width={600}
        open={flowDrawerOpen}
        onClose={() => { setFlowDrawerOpen(false); setSelectedBillId(null) }}
      >
        {billDetail && (
          <div className="space-y-4">
            <Card size="small" title="单据信息">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <Text type="secondary">单据编号:</Text> {billDetail.bill_no}
                </div>
                <div>
                  <Text type="secondary">单据名称:</Text> {billDetail.bill_name}
                </div>
                <div>
                  <Text type="secondary">单据类型:</Text> {billDetail.bill_type}
                </div>
                <div>
                  <Text type="secondary">总金额:</Text>{' '}
                  <span className="amount-highlight">¥{billDetail.total_amount.toLocaleString()}</span>
                </div>
                <div>
                  <Text type="secondary">状态:</Text>{' '}
                  <Tag color={billDetail.status === 'approved' || billDetail.status === 'completed' ? 'success' : billDetail.status === 'rejected' ? 'error' : 'warning'}>
                    {billDetail.status === 'draft' ? '草稿' : billDetail.status === 'pending' ? '待审批' : billDetail.status === 'processing' ? '审批中' : billDetail.status === 'approved' ? '已审批' : billDetail.status === 'rejected' ? '已驳回' : billDetail.status === 'completed' ? '已完成' : billDetail.status}
                  </Tag>
                </div>
              </div>
            </Card>

            <Card size="small" title="审批进度">
              {flowSteps.length > 0 ? (
                <Steps
                  direction="vertical"
                  size="small"
                  items={flowSteps}
                  current={flowSteps.findIndex((s) => s.status === 'process' || s.status === 'wait')}
                />
              ) : (
                <div className="text-center text-gray-400 py-4">
                  暂无审批流程
                </div>
              )}
            </Card>

            <Card size="small" title="审批记录">
              <Table
                dataSource={billFlowRecords || []}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: '节点',
                    dataIndex: ['node', 'node_name'],
                    key: 'node',
                    width: 120,
                  },
                  {
                    title: '审批人',
                    dataIndex: ['approver', 'full_name'],
                    key: 'approver',
                    width: 100,
                    render: (name: string) => name || '-',
                  },
                  {
                    title: '状态',
                    dataIndex: 'approval_status',
                    key: 'status',
                    width: 80,
                    render: (status: string) => {
                      const config = APPROVAL_STATUS_MAP[status] || { text: status, color: 'default' }
                      return <Tag color={config.color}>{config.text}</Tag>
                    },
                  },
                  {
                    title: '意见',
                    dataIndex: 'approval_opinion',
                    key: 'opinion',
                    render: (opinion: string) => opinion || '-',
                  },
                  {
                    title: '时间',
                    dataIndex: 'approved_at',
                    key: 'time',
                    width: 140,
                    render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
                  },
                ]}
                locale={{ emptyText: '暂无审批记录' }}
              />
            </Card>

            <Card size="small" title="状态变更记录">
              <StatusTimelineComponent data={billFlowTimeline || []} />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}
