import React, { useState } from 'react'
import { Table, Button, Space, Popconfirm, App as AntdApp, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { checklistApi } from '@/api/checklist'
import SearchFilter, { FilterField } from '@/components/SearchFilter'
import { AuditChecklist } from '@/types'
import dayjs from 'dayjs'

const ChecklistList: React.FC = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [searchParams, setSearchParams] = useState<Record<string, any>>({})
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: categoriesData } = useQuery({
    queryKey: ['checklist-categories'],
    queryFn: checklistApi.getCategories,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['checklists', pagination, searchParams],
    queryFn: () =>
      checklistApi.list({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        keyword: searchParams.keyword,
        category: searchParams.category,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => checklistApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['checklists'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const categoryOptions = (categoriesData?.categories || []).map((cat) => ({
    label: cat,
    value: cat,
  }))

  const filterFields: FilterField[] = [
    {
      key: 'category',
      label: '分类',
      type: 'select',
      options: categoryOptions,
      placeholder: '请选择分类',
    },
  ]

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (text: string, record: AuditChecklist) => (
        <a onClick={() => navigate({ to: '/checklist/$id/edit', params: { id: String(record.id) } })}>
          {text}
        </a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (text?: string) => text || '-',
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
      render: (_: unknown, record: AuditChecklist) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate({ to: '/checklist/$id/edit', params: { id: String(record.id) } })}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该检查清单？" onConfirm={() => deleteMutation.mutate(record.id)}>
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
        <h2 style={{ margin: 0 }}>检查清单管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/checklist/new' })}>
          新增检查清单
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
        searchPlaceholder="搜索标题或描述"
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
        scroll={{ x: 900 }}
      />
    </div>
  )
}

export default ChecklistList
