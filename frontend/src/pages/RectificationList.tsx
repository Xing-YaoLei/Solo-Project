import React, { useState } from 'react'
import { Table, Button, Space, Popconfirm, App as AntdApp, Modal, Form, Select, Input } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { rectificationApi } from '@/api/rectification'
import SearchFilter, { FilterField } from '@/components/SearchFilter'
import StatusTag from '@/components/StatusTag'
import RiskLevelTag from '@/components/RiskLevelTag'
import { RiskLevel, RectificationStatus } from '@/types/enums'
import { RectificationPlan } from '@/types'
import dayjs from 'dayjs'

const RectificationList: React.FC = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [searchParams, setSearchParams] = useState<Record<string, any>>({})
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusForm] = Form.useForm()
  const [editingRecord, setEditingRecord] = useState<RectificationPlan | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['rectifications', pagination, searchParams],
    queryFn: () =>
      rectificationApi.list({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        riskLevel: searchParams.riskLevel,
        status: searchParams.status,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rectificationApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['rectifications'] })
    },
    onError: () => message.error('删除失败'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: number; status: RectificationStatus; remark?: string }) =>
      rectificationApi.updateStatus(params.id, { status: params.status, remark: params.remark }),
    onSuccess: () => {
      message.success('状态更新成功')
      setStatusModalOpen(false)
      statusForm.resetFields()
      setEditingRecord(null)
      queryClient.invalidateQueries({ queryKey: ['rectifications'] })
    },
    onError: () => message.error('状态更新失败'),
  })

  const handleStatusSubmit = async () => {
    if (!editingRecord) return
    try {
      const values = await statusForm.validateFields()
      updateStatusMutation.mutate({ id: editingRecord.id, ...values })
    } catch {
    }
  }

  const openStatusModal = (record: RectificationPlan) => {
    setEditingRecord(record)
    statusForm.resetFields()
    setStatusModalOpen(true)
  }

  const filterFields: FilterField[] = [
    {
      key: 'riskLevel',
      label: '风险等级',
      type: 'select',
      options: [
        { label: '低风险', value: RiskLevel.LOW },
        { label: '中风险', value: RiskLevel.MEDIUM },
        { label: '高风险', value: RiskLevel.HIGH },
        { label: '严重风险', value: RiskLevel.CRITICAL },
      ],
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '未启动', value: RectificationStatus.NOT_STARTED },
        { label: '进行中', value: RectificationStatus.IN_PROGRESS },
        { label: '已提交', value: RectificationStatus.SUBMITTED },
        { label: '已审核', value: RectificationStatus.REVIEWED },
        { label: '已关闭', value: RectificationStatus.CLOSED },
      ],
    },
  ]

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (text: string, record: RectificationPlan) => (
        <a onClick={() => navigate({ to: '/rectification/$id/edit', params: { id: String(record.id) } })}>
          {text}
        </a>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 100,
      render: (val: RiskLevel) => <RiskLevelTag level={val} />,
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      width: 120,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: RectificationStatus) => <StatusTag status={val} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: RectificationPlan) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate({ to: '/rectification/$id/edit', params: { id: String(record.id) } })}
          >
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => openStatusModal(record)}>
            状态变更
          </Button>
          <Popconfirm title="确定删除该整改计划？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>整改计划管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/rectification/new' })}>
          新增整改计划
        </Button>
      </div>

      <SearchFilter
        fields={filterFields}
        onSearch={(values) => {
          setSearchParams(values)
          setPagination({ ...pagination, current: 1 })
        }}
        onReset={() => {
          setSearchParams({})
          setPagination({ ...pagination, current: 1 })
        }}
        searchPlaceholder="搜索标题或负责人"
      />

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={`状态变更 - ${editingRecord?.title || ''}`}
        open={statusModalOpen}
        onCancel={() => {
          setStatusModalOpen(false)
          setEditingRecord(null)
          statusForm.resetFields()
        }}
        onOk={handleStatusSubmit}
        confirmLoading={updateStatusMutation.isPending}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择目标状态"
              options={[
                { label: '未启动', value: RectificationStatus.NOT_STARTED },
                { label: '进行中', value: RectificationStatus.IN_PROGRESS },
                { label: '已提交', value: RectificationStatus.SUBMITTED },
                { label: '已审核', value: RectificationStatus.REVIEWED },
                { label: '已关闭', value: RectificationStatus.CLOSED },
              ]}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RectificationList
