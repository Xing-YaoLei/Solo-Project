import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  Drawer,
  Descriptions,
  message,
  Popconfirm,
  Card,
  Typography,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reconciliationApi, contractApi, billApi, timelineApi } from '@/api'
import type { ReconciliationDiff, Contract, Bill } from '@/types'
import dayjs from 'dayjs'
import { useState, useMemo } from 'react'
import StatusTimelineComponent from '@/components/StatusTimeline'
import ExportWithCaliber from '@/components/ExportWithCaliber'

// @ts-ignore
export const Route = createLazyFileRoute('/reconciliation')({
  component: ReconciliationPage,
})

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Title } = Typography

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'warning' },
  { value: 'processing', label: '处理中', color: 'processing' },
  { value: 'resolved', label: '已解决', color: 'success' },
  { value: 'rejected', label: '已驳回', color: 'error' },
]

const diffTypeOptions = [
  { value: 'amount', label: '金额差异' },
  { value: 'item', label: '项目差异' },
  { value: 'discount', label: '折扣差异' },
  { value: 'other', label: '其他差异' },
]

function ReconciliationPage() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [handleForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingDiff, setEditingDiff] = useState<ReconciliationDiff | null>(null)
  const [selectedDiff, setSelectedDiff] = useState<ReconciliationDiff | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reconciliation', 'list', page, pageSize, searchForm.getFieldsValue()],
    queryFn: () => {
      const values = searchForm.getFieldsValue()
      const params: any = {
        page,
        page_size: pageSize,
        keyword: values.keyword,
        status: values.status,
        diff_type: values.diff_type,
      }
      if (values.dateRange) {
        params.start_date = values.dateRange[0]?.format('YYYY-MM-DD')
        params.end_date = values.dateRange[1]?.format('YYYY-MM-DD')
      }
      return reconciliationApi.getList(params)
    },
  })

  const { data: contracts } = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: () => contractApi.getList({ page_size: 100 }),
  })

  const { data: bills } = useQuery({
    queryKey: ['bills', 'all'],
    queryFn: () => billApi.getList({ page_size: 100 }),
  })

  const { data: detailData, refetch: refetchDetail } = useQuery({
    queryKey: ['reconciliationDetail', selectedDiff?.id],
    queryFn: () => {
      if (!selectedDiff?.id) return null
      return reconciliationApi.getDetail(selectedDiff.id)
    },
    enabled: !!selectedDiff?.id,
  })

  const { data: contractDetail } = useQuery({
    queryKey: ['diffContract', detailData?.contract_id],
    queryFn: () => {
      if (!detailData?.contract_id) return null
      return contractApi.getDetail(detailData.contract_id)
    },
    enabled: !!detailData?.contract_id,
  })

  const { data: billDetail } = useQuery({
    queryKey: ['diffBill', detailData?.bill_id],
    queryFn: () => {
      if (!detailData?.bill_id) return null
      return billApi.getDetail(detailData.bill_id)
    },
    enabled: !!detailData?.bill_id,
  })

  const { data: timelineData } = useQuery({
    queryKey: ['reconciliationTimeline', selectedDiff?.id],
    queryFn: () => {
      if (!selectedDiff?.id) return []
      return timelineApi.getByReconciliation(selectedDiff.id)
    },
    enabled: !!selectedDiff?.id,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<ReconciliationDiff>) => reconciliationApi.create(data),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['reconciliation', 'list'] })
    },
    onError: () => {
      message.error('创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ReconciliationDiff> }) =>
      reconciliationApi.update(id, data),
    onSuccess: () => {
      message.success('更新成功')
      setHandleModalVisible(false)
      handleForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['reconciliation', 'list'] })
    },
    onError: () => {
      message.error('更新失败')
    },
  })

  const handleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string; handler_conclusion: string } }) =>
      reconciliationApi.handle(id, data),
    onSuccess: () => {
      message.success('处理成功')
      setHandleModalVisible(false)
      handleForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['reconciliation', 'list'] })
      if (selectedDiff) {
        refetchDetail()
      }
    },
    onError: () => {
      message.error('处理失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reconciliationApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['reconciliation', 'list'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((o) => o.value === status)
    return option?.color || 'default'
  }

  const getStatusText = (status: string) => {
    const option = statusOptions.find((o) => o.value === status)
    return option?.label || status
  }

  const getDiffTypeText = (type: string) => {
    const option = diffTypeOptions.find((o) => o.value === type)
    return option?.label || type
  }

  const handleCreate = () => {
    setEditingDiff(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleProcess = (record: ReconciliationDiff) => {
    setEditingDiff(record)
    handleForm.resetFields()
    handleForm.setFieldsValue({
      status: record.status === 'pending' ? 'processing' : record.status,
    })
    setHandleModalVisible(true)
  }

  const handleViewDetail = (record: ReconciliationDiff) => {
    setSelectedDiff(record)
    setDrawerVisible(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      createMutation.mutate(values)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleProcessSubmit = async () => {
    if (!editingDiff) return
    try {
      const values = await handleForm.validateFields()
      handleMutation.mutate({ id: editingDiff.id, data: values })
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPage(1)
    refetch()
  }

  const getFilterConditions = () => {
    const values = searchForm.getFieldsValue()
    const conditions: Record<string, any> = {}
    if (values.keyword) conditions.keyword = values.keyword
    if (values.status) conditions.status = values.status
    if (values.diff_type) conditions.diff_type = values.diff_type
    if (values.dateRange) {
      conditions.start_date = values.dateRange[0]?.format('YYYY-MM-DD')
      conditions.end_date = values.dateRange[1]?.format('YYYY-MM-DD')
    }
    return conditions
  }

  const columns = useMemo(
    () => [
      {
        title: '差异编号',
        dataIndex: 'diff_no',
        key: 'diff_no',
        render: (text: string) => (
          <span className="font-mono text-blue-600">{text}</span>
        ),
      },
      {
        title: '差异类型',
        dataIndex: 'diff_type',
        key: 'diff_type',
        render: (type: string) => (
          <Tag color="blue">{getDiffTypeText(type)}</Tag>
        ),
      },
      {
        title: '预期金额',
        dataIndex: 'expected_amount',
        key: 'expected_amount',
        render: (val: number) => (
          <span className="amount-highlight">¥{val.toLocaleString()}</span>
        ),
      },
      {
        title: '实际金额',
        dataIndex: 'actual_amount',
        key: 'actual_amount',
        render: (val: number) => (
          <span className="amount-warning">¥{val.toLocaleString()}</span>
        ),
      },
      {
        title: '差异金额',
        dataIndex: 'diff_amount',
        key: 'diff_amount',
        render: (val: number) => (
          <span className="amount-error">¥{val.toLocaleString()}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '操作',
        key: 'action',
        width: 240,
        render: (_: any, record: ReconciliationDiff) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            {record.status !== 'resolved' && record.status !== 'rejected' && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleProcess(record)}
              >
                处理
              </Button>
            )}
            <Popconfirm
              title="确定删除该对账差异吗？"
              onConfirm={() => handleDelete(record.id)}
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
    ],
    []
  )

  return (
    <div className="page-container">
      <Card className="card-wrapper mb-4">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="差异编号/合同编号" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Form.Item>
          <Form.Item name="diff_type" label="差异类型">
            <Select
              placeholder="全部类型"
              allowClear
              style={{ width: 140 }}
              options={diffTypeOptions}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="创建时间">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="card-wrapper">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} style={{ margin: 0 }}>
            对账差异列表
          </Title>
          <Space>
            <ExportWithCaliber
              defaultType="reconciliation"
              filterConditions={getFilterConditions()}
              buttonText="导出数据"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建差异
            </Button>
          </Space>
        </div>

        <Table
          dataSource={data?.items || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      <Modal
        title="新建对账差异"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingDiff(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="contract_id"
            label="关联合同"
            rules={[{ required: true, message: '请选择关联合同' }]}
          >
            <Select
              placeholder="请选择关联合同"
              showSearch
              optionFilterProp="label"
              options={contracts?.items?.map((c: Contract) => ({
                value: c.id,
                label: `${c.contract_no} - ${c.project_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="bill_id" label="关联单据">
            <Select
              placeholder="请选择关联单据（可选）"
              showSearch
              optionFilterProp="label"
              allowClear
              options={bills?.items?.map((b: Bill) => ({
                value: b.id,
                label: `${b.bill_no} - ${b.bill_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="diff_type"
            label="差异类型"
            rules={[{ required: true, message: '请选择差异类型' }]}
          >
            <Select placeholder="请选择差异类型" options={diffTypeOptions} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="expected_amount"
              label="预期金额"
              rules={[{ required: true, message: '请输入预期金额' }]}
            >
              <Input
                type="number"
                prefix="¥"
                placeholder="请输入预期金额"
                addonBefore="¥"
              />
            </Form.Item>
            <Form.Item
              name="actual_amount"
              label="实际金额"
              rules={[{ required: true, message: '请输入实际金额' }]}
            >
              <Input
                type="number"
                prefix="¥"
                placeholder="请输入实际金额"
                addonBefore="¥"
              />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注说明">
            <TextArea rows={3} placeholder="请输入差异说明或备注信息" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button
              onClick={() => {
                setModalVisible(false)
                setEditingDiff(null)
                form.resetFields()
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending}
            >
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理对账差异"
        open={handleModalVisible}
        onCancel={() => {
          setHandleModalVisible(false)
          setEditingDiff(null)
          handleForm.resetFields()
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        {editingDiff && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{editingDiff.diff_no}</span>
              <Tag color={getStatusColor(editingDiff.status)}>
                {getStatusText(editingDiff.status)}
              </Tag>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">预期金额：</span>
                <span className="amount-highlight">¥{editingDiff.expected_amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">实际金额：</span>
                <span className="amount-warning">¥{editingDiff.actual_amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">差异金额：</span>
                <span className="amount-error">¥{editingDiff.diff_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
        <Form form={handleForm} layout="vertical">
          <Form.Item
            name="status"
            label="更新状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择处理状态"
              options={[
                { value: 'processing', label: '处理中' },
                { value: 'resolved', label: '已解决' },
                { value: 'rejected', label: '已驳回' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="handler_conclusion"
            label="处理结论"
            rules={[{ required: true, message: '请填写处理结论' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述处理方案、原因或结果..."
            />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button
              onClick={() => {
                setHandleModalVisible(false)
                setEditingDiff(null)
                handleForm.resetFields()
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleProcessSubmit}
              loading={handleMutation.isPending || updateMutation.isPending}
            >
              确认处理
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="对账差异详情"
        placement="right"
        width={800}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false)
          setSelectedDiff(null)
        }}
        destroyOnClose
      >
        {selectedDiff && (
          <div className="space-y-6">
            <Card title="差异信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="差异编号">
                  {detailData?.diff_no || selectedDiff.diff_no}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(detailData?.status || selectedDiff.status)}>
                    {getStatusText(detailData?.status || selectedDiff.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="差异类型">
                  <Tag color="blue">
                    {getDiffTypeText(detailData?.diff_type || selectedDiff.diff_type)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="差异金额">
                  <span className="amount-error">
                    ¥{(detailData?.diff_amount || selectedDiff.diff_amount).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="预期金额">
                  <span className="amount-highlight">
                    ¥{(detailData?.expected_amount || selectedDiff.expected_amount).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="实际金额">
                  <span className="amount-warning">
                    ¥{(detailData?.actual_amount || selectedDiff.actual_amount).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(detailData?.created_at || selectedDiff.created_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="处理人">
                  {detailData?.handled_by || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="处理时间">
                  {detailData?.handled_at
                    ? dayjs(detailData.handled_at).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="处理结论" span={2}>
                  {detailData?.handler_conclusion || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {detailData?.remark || selectedDiff.remark || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileTextOutlined />
                  关联信息
                </div>
              }
              size="small"
            >
              {contractDetail && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-700 mb-2">关联合同</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">合同编号：</span>
                      {contractDetail.contract_no}
                    </div>
                    <div>
                      <span className="text-gray-500">项目名称：</span>
                      {contractDetail.project_name}
                    </div>
                    <div>
                      <span className="text-gray-500">客户名称：</span>
                      {contractDetail.client_name}
                    </div>
                    <div>
                      <span className="text-gray-500">合同金额：</span>
                      <span className="amount-highlight">¥{contractDetail.contract_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
              {billDetail && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-700 mb-2">关联单据</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">单据编号：</span>
                      {billDetail.bill_no}
                    </div>
                    <div>
                      <span className="text-gray-500">单据名称：</span>
                      {billDetail.bill_name}
                    </div>
                    <div>
                      <span className="text-gray-500">单据类型：</span>
                      {billDetail.bill_type}
                    </div>
                    <div>
                      <span className="text-gray-500">总金额：</span>
                      <span className="amount-highlight">¥{billDetail.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
              {!contractDetail && !billDetail && (
                <div className="text-center text-gray-400 py-4">
                  暂无关联信息
                </div>
              )}
            </Card>

            <Divider />

            <Card
              title={
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined />
                  状态时间线
                </div>
              }
              size="small"
            >
              <StatusTimelineComponent data={timelineData || []} />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}
