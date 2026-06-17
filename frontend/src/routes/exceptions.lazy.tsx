import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Form,
  Drawer,
  Descriptions,
  message,
  Popconfirm,
  Divider,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { exceptionApi, timelineApi } from '@/api'
import type { ExceptionOrder, ExceptionAffectedObject } from '@/types'
import dayjs from 'dayjs'
import StatusTimelineComponent from '@/components/StatusTimeline'

// @ts-ignore
export const Route = createLazyFileRoute('/exceptions')({
  component: ExceptionsPage,
})

const { Title, Text } = Typography

const priorityOptions = [
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' },
]

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
]

const exceptionTypeOptions = [
  { value: 'amount_diff', label: '金额差异' },
  { value: 'approval_timeout', label: '审批超时' },
  { value: 'data_missing', label: '资料缺失' },
  { value: 'contract_violation', label: '合同违约' },
  { value: 'quality_issue', label: '质量问题' },
  { value: 'other', label: '其他' },
]

const impactLevelOptions = [
  { value: 'critical', label: '严重' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

const objectTypeOptions = [
  { value: 'contract', label: '合同' },
  { value: 'bill', label: '单据' },
  { value: 'reconciliation', label: '对账记录' },
  { value: 'project', label: '项目' },
  { value: 'material', label: '材料' },
  { value: 'other', label: '其他' },
]

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'red',
    medium: 'gold',
    low: 'green',
  }
  return colors[priority] || 'default'
}

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return texts[priority] || priority
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    processing: 'processing',
    resolved: 'success',
    closed: 'default',
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return texts[status] || status
}

const getExceptionTypeText = (type: string) => {
  const texts: Record<string, string> = {
    amount_diff: '金额差异',
    approval_timeout: '审批超时',
    data_missing: '资料缺失',
    contract_violation: '合同违约',
    quality_issue: '质量问题',
    other: '其他',
  }
  return texts[type] || type
}

const getImpactLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'gold',
    low: 'green',
  }
  return colors[level] || 'default'
}

const getImpactLevelText = (level: string) => {
  const texts: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
  }
  return texts[level] || level
}

const getObjectTypeText = (type: string) => {
  const texts: Record<string, string> = {
    contract: '合同',
    bill: '单据',
    reconciliation: '对账记录',
    project: '项目',
    material: '材料',
    other: '其他',
  }
  return texts[type] || type
}

function ExceptionsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>()

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [closeModalVisible, setCloseModalVisible] = useState(false)
  const [selectedException, setSelectedException] = useState<ExceptionOrder | null>(null)
  const [affectedObjects, setAffectedObjects] = useState<Partial<ExceptionAffectedObject>[]>([])
  const [editingObject, setEditingObject] = useState<Partial<ExceptionAffectedObject> | null>(null)
  const [objectModalVisible, setObjectModalVisible] = useState(false)

  const [createForm] = Form.useForm()
  const [closeForm] = Form.useForm()
  const [objectForm] = Form.useForm()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['exceptions', page, pageSize, keyword, statusFilter, priorityFilter],
    queryFn: () =>
      exceptionApi.getList({
        page,
        page_size: pageSize,
        keyword,
        status: statusFilter,
      }),
  })

  const { data: detailData } = useQuery({
    queryKey: ['exception', selectedException?.id],
    queryFn: () => exceptionApi.getDetail(selectedException!.id),
    enabled: !!selectedException?.id && detailDrawerVisible,
  })

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline', 'exception', selectedException?.id],
    queryFn: () => timelineApi.getByException(selectedException!.id),
    enabled: !!selectedException?.id && detailDrawerVisible,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<ExceptionOrder>) =>
      exceptionApi.create({ ...data, affected_objects: affectedObjects as any }),
    onSuccess: () => {
      message.success('创建异常单成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      setAffectedObjects([])
      queryClient.invalidateQueries({ queryKey: ['exceptions'] })
    },
    onError: () => {
      message.error('创建异常单失败')
    },
  })

  const closeMutation = useMutation({
    mutationFn: (data: { id: number; final_conclusion: string }) =>
      exceptionApi.close(data.id, { final_conclusion: data.final_conclusion }),
    onSuccess: () => {
      message.success('关闭异常单成功')
      setCloseModalVisible(false)
      closeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['exceptions'] })
      queryClient.invalidateQueries({ queryKey: ['exception', selectedException?.id] })
    },
    onError: () => {
      message.error('关闭异常单失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => exceptionApi.delete(id),
    onSuccess: () => {
      message.success('删除异常单成功')
      queryClient.invalidateQueries({ queryKey: ['exceptions'] })
    },
    onError: () => {
      message.error('删除异常单失败')
    },
  })

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter(undefined)
    setPriorityFilter(undefined)
    setPage(1)
    refetch()
  }

  const handleCreate = (values: any) => {
    createMutation.mutate(values)
  }

  const handleClose = (values: any) => {
    if (selectedException) {
      closeMutation.mutate({ id: selectedException.id, final_conclusion: values.final_conclusion })
    }
  }

  const handleViewDetail = (record: ExceptionOrder) => {
    setSelectedException(record)
    setDetailDrawerVisible(true)
  }

  const handleCloseClick = (record: ExceptionOrder) => {
    setSelectedException(record)
    setCloseModalVisible(true)
  }

  const handleDelete = (record: ExceptionOrder) => {
    deleteMutation.mutate(record.id)
  }

  const handleAddObject = () => {
    setEditingObject(null)
    objectForm.resetFields()
    setObjectModalVisible(true)
  }

  const handleEditObject = (obj: Partial<ExceptionAffectedObject>, index: number) => {
    setEditingObject({ ...obj, id: index as any })
    objectForm.setFieldsValue(obj)
    setObjectModalVisible(true)
  }

  const handleDeleteObject = (index: number) => {
    const newObjects = [...affectedObjects]
    newObjects.splice(index, 1)
    setAffectedObjects(newObjects)
  }

  const handleSaveObject = (values: any) => {
    if (editingObject !== null && editingObject.id !== undefined) {
      const newObjects = [...affectedObjects]
      newObjects[editingObject.id as number] = values
      setAffectedObjects(newObjects)
    } else {
      setAffectedObjects([...affectedObjects, values])
    }
    setObjectModalVisible(false)
    objectForm.resetFields()
    setEditingObject(null)
  }

  const columns = [
    {
      title: '异常编号',
      dataIndex: 'exception_no',
      key: 'exception_no',
      width: 140,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      width: 100,
      render: (type: string) => getExceptionTypeText(type),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: ['handler', 'full_name'],
      key: 'handler',
      width: 100,
      render: (name?: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: ExceptionOrder) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status !== 'closed' && (
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleCloseClick(record)}>
              关闭
            </Button>
          )}
          <Popconfirm title="确定要删除这个异常单吗？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const objectColumns = [
    {
      title: '对象类型',
      dataIndex: 'object_type',
      key: 'object_type',
      render: (type: string) => getObjectTypeText(type),
    },
    {
      title: '对象名称',
      dataIndex: 'object_name',
      key: 'object_name',
    },
    {
      title: '影响级别',
      dataIndex: 'impact_level',
      key: 'impact_level',
      render: (level: string) => (
        <Tag color={getImpactLevelColor(level)}>{getImpactLevelText(level)}</Tag>
      ),
    },
    {
      title: '影响说明',
      dataIndex: 'impact_description',
      key: 'impact_description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, __: any, index: number) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditObject(affectedObjects[index], index)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteObject(index)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card title="异常单管理" className="card-wrapper">
        <div className="space-y-4">
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="搜索异常编号、标题"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="按状态筛选"
                allowClear
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={statusOptions}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="按优先级筛选"
                allowClear
                style={{ width: '100%' }}
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                options={priorityOptions}
              />
            </Col>
            <Col span={10} className="flex justify-end gap-2">
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
                新建异常单
              </Button>
            </Col>
          </Row>

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
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
            rowClassName={(record) => {
              if (record.priority === 'high') return 'exception-card high'
              if (record.priority === 'medium') return 'exception-card medium'
              return 'exception-card low'
            }}
          />
        </div>
      </Card>

      <Modal
        title="新建异常单"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          createForm.resetFields()
          setAffectedObjects([])
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Title level={5} className="mb-4">基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="exception_type"
                label="异常类型"
                rules={[{ required: true, message: '请选择异常类型' }]}
              >
                <Select options={exceptionTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select options={priorityOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入异常单标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入异常描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="expected_amount" label="预期金额">
                <Input type="number" placeholder="预期金额" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actual_amount" label="实际金额">
                <Input type="number" placeholder="实际金额" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="diff_amount" label="差异金额">
                <Input type="number" placeholder="差异金额" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="handler_id" label="处理人">
                <Input placeholder="处理人ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supervisor_id" label="督办人">
                <Input placeholder="督办人ID" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <div className="flex justify-between items-center mb-4">
            <Title level={5} className="mb-0">影响对象</Title>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddObject}>
              添加影响对象
            </Button>
          </div>
          <Table
            dataSource={affectedObjects}
            columns={objectColumns}
            rowKey={(_record, index) => index?.toString() || Math.random().toString()}
            pagination={false}
            size="small"
            locale={{ emptyText: '暂无影响对象，点击上方按钮添加' }}
          />

          <Divider />
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setCreateModalVisible(false)
              createForm.resetFields()
              setAffectedObjects([])
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              创建
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={editingObject ? '编辑影响对象' : '添加影响对象'}
        open={objectModalVisible}
        onCancel={() => {
          setObjectModalVisible(false)
          objectForm.resetFields()
          setEditingObject(null)
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={objectForm} layout="vertical" onFinish={handleSaveObject}>
          <Form.Item
            name="object_type"
            label="对象类型"
            rules={[{ required: true, message: '请选择对象类型' }]}
          >
            <Select options={objectTypeOptions} />
          </Form.Item>
          <Form.Item
            name="object_name"
            label="对象名称"
            rules={[{ required: true, message: '请输入对象名称' }]}
          >
            <Input placeholder="请输入对象名称" />
          </Form.Item>
          <Form.Item
            name="object_id"
            label="对象ID"
          >
            <Input type="number" placeholder="请输入对象ID" />
          </Form.Item>
          <Form.Item
            name="impact_level"
            label="影响级别"
            rules={[{ required: true, message: '请选择影响级别' }]}
          >
            <Select options={impactLevelOptions} />
          </Form.Item>
          <Form.Item name="impact_description" label="影响说明">
            <Input.TextArea rows={3} placeholder="请输入影响说明" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setObjectModalVisible(false)
              objectForm.resetFields()
              setEditingObject(null)
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      <Drawer
        title="异常单详情"
        placement="right"
        width={720}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        destroyOnClose
      >
        {detailData && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Title level={4} className="mb-2">{detailData.title}</Title>
                  <Space>
                    <Tag color={getStatusColor(detailData.status)}>{getStatusText(detailData.status)}</Tag>
                    <Tag color={getPriorityColor(detailData.priority)}>{getPriorityText(detailData.priority)}优先级</Tag>
                    <Tag>{getExceptionTypeText(detailData.exception_type)}</Tag>
                  </Space>
                </div>
                <Button type="primary" icon={<CloseOutlined />} onClick={() => {
                  setSelectedException(detailData)
                  setCloseModalVisible(true)
                }} disabled={detailData.status === 'closed'}>
                  关闭异常单
                </Button>
              </div>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="异常编号">{detailData.exception_no}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              </Descriptions>
            </Card>

            {detailData.expected_amount !== undefined && (
              <Card title="金额差异信息" size="small">
                <Row gutter={16}>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">预期金额</div>
                      <div className="text-xl font-bold amount-highlight">
                        ¥{detailData.expected_amount?.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">实际金额</div>
                      <div className="text-xl font-bold amount-warning">
                        ¥{detailData.actual_amount?.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">差异金额</div>
                      <div className="text-xl font-bold amount-error">
                        ¥{detailData.diff_amount?.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            <Card title="影响对象" size="small">
              <Table
                dataSource={(detailData.affected_objects as any) || []}
                columns={[
                  { title: '对象类型', dataIndex: 'object_type', key: 'object_type', render: (t) => getObjectTypeText(t) },
                  { title: '对象名称', dataIndex: 'object_name', key: 'object_name' },
                  { title: '影响级别', dataIndex: 'impact_level', key: 'impact_level', render: (l) => <Tag color={getImpactLevelColor(l)}>{getImpactLevelText(l)}</Tag> },
                ]}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>

            <Card title="负责人信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="处理人">
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span>{detailData.handler?.full_name || '-'}</span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="督办人">
                  <div className="flex items-center gap-2">
                    <TeamOutlined />
                    <span>{detailData.supervisor?.full_name || '-'}</span>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {detailData.final_conclusion && (
              <Card title="最终结论" size="small">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Text>{detailData.final_conclusion}</Text>
                </div>
                {detailData.closed_at && (
                  <div className="mt-2 text-sm text-gray-500">
                    关闭时间：{dayjs(detailData.closed_at).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                )}
              </Card>
            )}

            <Card title="状态时间线" size="small">
              <StatusTimelineComponent
                data={timelineData || []}
                loading={timelineLoading}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title="关闭异常单"
        open={closeModalVisible}
        onCancel={() => {
          setCloseModalVisible(false)
          closeForm.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <div className="mb-4 flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
          <ExclamationCircleOutlined className="text-orange-500 text-xl mt-0.5" />
          <div>
            <div className="font-medium text-orange-800">关闭后将无法重新打开</div>
            <div className="text-sm text-orange-600">请填写最终结论，说明问题原因和解决方案。</div>
          </div>
        </div>
        <Form form={closeForm} layout="vertical" onFinish={handleClose}>
          <Form.Item
            name="final_conclusion"
            label="最终结论"
            rules={[{ required: true, message: '请填写最终结论' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细说明问题原因、处理过程和最终解决方案..."
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setCloseModalVisible(false)
              closeForm.resetFields()
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={closeMutation.isPending}>
              确认关闭
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
