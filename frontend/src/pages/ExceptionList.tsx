import React, { useState } from 'react'
import { Table, Button, Space, Popconfirm, App as AntdApp, Tabs } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { exceptionApi } from '@/api/exception'
import { samplingApi } from '@/api/sampling'
import StatusTag from '@/components/StatusTag'
import { ExceptionStatus, ExceptionType } from '@/types/enums'
import { ExceptionOrder, SamplingRecord } from '@/types'
import dayjs from 'dayjs'

const ExceptionList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExceptionStatus>(ExceptionStatus.OPEN)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: samplingsData } = useQuery({
    queryKey: ['samplings-all'],
    queryFn: () => samplingApi.list({ skip: 0, limit: 500 }),
  })

  const samplingsMap = (samplingsData?.items || []).reduce<Record<number, SamplingRecord>>(
    (acc, item) => {
      acc[item.id] = item
      return acc
    },
    {}
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['exceptions', activeTab, pagination],
    queryFn: () =>
      exceptionApi.list({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        status: activeTab,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => exceptionApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['exceptions'] })
      refetch()
    },
    onError: () => message.error('删除失败'),
  })

  const exceptionTypeTextMap: Record<string, string> = {
    [ExceptionType.EVIDENCE_MISSING]: '证据缺失',
    [ExceptionType.NON_COMPLIANCE]: '不合规',
    [ExceptionType.OTHER]: '其他',
  }

  const columns = [
    {
      title: '异常类型',
      dataIndex: 'exceptionType',
      width: 120,
      render: (val: ExceptionType) => exceptionTypeTextMap[val] || val,
    },
    {
      title: '关联抽样',
      dataIndex: 'samplingId',
      width: 160,
      render: (samplingId: number) => {
        const sampling = samplingsMap[samplingId]
        if (!sampling) return '-';
        return (
          <Link to={`/sampling/$id`} params={{ id: String(samplingId) }}>
            {sampling.sampleCode || sampling.sampleName}
          </Link>
        )
      },
    },
    {
      title: '影响范围',
      dataIndex: 'impactScope',
      ellipsis: true,
      render: (val?: string) => val || '-',
    },
    {
      title: '责任人',
      dataIndex: 'responsiblePerson',
      width: 100,
      render: (val?: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: ExceptionStatus) => <StatusTag status={val} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: ExceptionOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate({ to: '/exceptions/$id/edit', params: { id: String(record.id) } })}
          >
            处理
          </Button>
          <Popconfirm title="确定删除该异常单？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const items = data?.items || []
  const total = data?.total || 0

  const tabItems = [
    {
      key: ExceptionStatus.OPEN,
      label: '待处理',
    },
    {
      key: ExceptionStatus.PROCESSING,
      label: '处理中',
    },
    {
      key: ExceptionStatus.CLOSED,
      label: '已关闭',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>异常单处理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/exceptions/new' })}>
          新增异常单
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as ExceptionStatus)
          setPagination({ current: 1, pageSize: 10 })
        }}
        items={tabItems}
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
        scroll={{ x: 1100 }}
      />
    </div>
  )
}

export default ExceptionList
