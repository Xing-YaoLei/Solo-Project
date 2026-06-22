import React, { useState } from 'react'
import { Table, Button, Space, Popconfirm, App as AntdApp, Tooltip } from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { samplingApi } from '@/api/sampling'
import SearchFilter, { FilterField } from '@/components/SearchFilter'
import StatusTag from '@/components/StatusTag'
import { SamplingStatus, EvidenceStatus } from '@/types/enums'
import { SamplingRecord } from '@/types'
import dayjs from 'dayjs'

const SamplingList: React.FC = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [searchParams, setSearchParams] = useState<Record<string, any>>({})
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['samplings', pagination, searchParams],
    queryFn: () =>
      samplingApi.list({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        keyword: searchParams.keyword,
        status: searchParams.status,
        evidenceStatus: searchParams.evidenceStatus,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => samplingApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['samplings'] })
    },
    onError: () => message.error('删除失败'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: number; status: SamplingStatus }) =>
      samplingApi.updateStatus(params.id, { status: params.status }),
    onSuccess: () => {
      message.success('状态更新成功')
      queryClient.invalidateQueries({ queryKey: ['samplings'] })
    },
    onError: () => message.error('状态更新失败'),
  })

  const filterFields: FilterField[] = [
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '待审核', value: SamplingStatus.PENDING },
        { label: '已审核', value: SamplingStatus.REVIEWED },
        { label: '需跟进', value: SamplingStatus.FOLLOW_UP },
      ],
    },
    {
      key: 'evidenceStatus',
      label: '证据状态',
      type: 'select',
      options: [
        { label: '证据完整', value: EvidenceStatus.COMPLETE },
        { label: '证据缺失', value: EvidenceStatus.MISSING },
        { label: '部分证据', value: EvidenceStatus.PARTIAL },
      ],
    },
  ]

  const columns = [
    {
      title: '样本名称',
      dataIndex: 'sampleName',
      render: (text: string, record: SamplingRecord) => (
        <a onClick={() => navigate({ to: '/sampling/$id', params: { id: String(record.id) } })}>
          {text}
        </a>
      ),
    },
    {
      title: '样本编码',
      dataIndex: 'sampleCode',
      width: 140,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 120,
      render: (text?: string) => text || '-',
    },
    {
      title: '抽样日期',
      dataIndex: 'samplingDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '抽样人',
      dataIndex: 'sampledBy',
      width: 100,
      render: (text?: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: '证据状态',
      dataIndex: 'evidenceStatus',
      width: 120,
      render: (status: EvidenceStatus) => {
        const isWarning = status === EvidenceStatus.MISSING || status === EvidenceStatus.PARTIAL
        return isWarning ? (
          <Tooltip title={status === EvidenceStatus.MISSING ? '证据缺失，请及时补充' : '证据不完整，请检查'}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              <StatusTag status={status} />
            </span>
          </Tooltip>
        ) : (
          <StatusTag status={status} />
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: SamplingRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate({ to: '/sampling/$id', params: { id: String(record.id) } })}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate({ to: '/sampling/$id/edit', params: { id: String(record.id) } })}
          >
            编辑
          </Button>
          <Popconfirm
            title="变更状态"
            onConfirm={() =>
              updateStatusMutation.mutate({
                id: record.id,
                status:
                  record.status === SamplingStatus.PENDING
                    ? SamplingStatus.REVIEWED
                    : SamplingStatus.FOLLOW_UP,
              })
            }
          >
            <Button type="link" size="small">
              状态变更
            </Button>
          </Popconfirm>
          <Popconfirm title="确定删除该抽样记录？" onConfirm={() => deleteMutation.mutate(record.id)}>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>抽样记录管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/sampling/new' })}>
          新增抽样记录
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
        searchPlaceholder="搜索样本名称或编码"
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
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

export default SamplingList
