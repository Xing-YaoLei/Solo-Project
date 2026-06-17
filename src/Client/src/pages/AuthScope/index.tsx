import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Switch,
  Modal,
  Form,
  message,
  Spin,
  Popconfirm,
  InputNumber
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import {
  getAuthScopeList,
  createAuthScope,
  updateAuthScope,
  deleteAuthScope
} from '@/services/authScope'
import type {
  AuthScopeThreshold,
  AuthScopeThresholdQuery,
  AuthScopeThresholdCreate,
  AuthScopeThresholdUpdate
} from '@/types'
import { formatDateTime } from '@/utils/date'

const { Option } = Select

function AuthScope() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AuthScopeThreshold[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [queryParams, setQueryParams] = useState<AuthScopeThresholdQuery>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<AuthScopeThreshold | null>(null)
  const [form] = Form.useForm<AuthScopeThresholdCreate & AuthScopeThresholdUpdate>()

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getAuthScopeList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取授权阈值列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchData()
  }

  const handleReset = () => {
    setQueryParams({})
    setPagination({ current: 1, pageSize: 10 })
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true })
    setModalVisible(true)
  }

  const handleEdit = (record: AuthScopeThreshold) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAuthScope(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        await updateAuthScope({ ...values, id: editingItem.id })
        message.success('更新成功')
      } else {
        await createAuthScope(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleActive = async (record: AuthScopeThreshold, checked: boolean) => {
    try {
      await updateAuthScope({
        id: record.id,
        scopeName: record.scopeName,
        scopeCode: record.scopeCode,
        isActive: checked,
        minValue: record.minValue,
        maxValue: record.maxValue,
        unit: record.unit,
        description: record.description
      })
      message.success(checked ? '已启用' : '已禁用')
      fetchData()
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  const columns = [
    {
      title: '范围名称',
      dataIndex: 'scopeName',
      key: 'scopeName'
    },
    {
      title: '范围编码',
      dataIndex: 'scopeCode',
      key: 'scopeCode',
      render: (code: string) => <code>{code}</code>
    },
    {
      title: '最小值',
      dataIndex: 'minValue',
      key: 'minValue',
      render: (val: number, record: AuthScopeThreshold) =>
        val !== undefined ? `${val} ${record.unit || ''}` : '-'
    },
    {
      title: '最大值',
      dataIndex: 'maxValue',
      key: 'maxValue',
      render: (val: number, record: AuthScopeThreshold) =>
        val !== undefined ? `${val} ${record.unit || ''}` : '-'
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => unit || '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => desc || '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean, record: AuthScopeThreshold) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: AuthScopeThreshold) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该授权阈值吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="范围名称"
              style={{ width: 200 }}
              allowClear
              value={queryParams.scopeName}
              onChange={(e) => setQueryParams({ ...queryParams, scopeName: e.target.value })}
              prefix={<SearchOutlined />}
            />
            <Input
              placeholder="范围编码"
              style={{ width: 150 }}
              allowClear
              value={queryParams.scopeCode}
              onChange={(e) => setQueryParams({ ...queryParams, scopeCode: e.target.value })}
            />
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              value={queryParams.isActive}
              onChange={(value) => setQueryParams({ ...queryParams, isActive: value })}
            >
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增授权阈值
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize })
              }
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingItem ? '编辑授权阈值' : '新增授权阈值'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="scopeName"
            label="范围名称"
            rules={[{ required: true, message: '请输入范围名称' }]}
          >
            <Input placeholder="请输入范围名称" />
          </Form.Item>
          <Form.Item
            name="scopeCode"
            label="范围编码"
            rules={[{ required: true, message: '请输入范围编码' }]}
          >
            <Input placeholder="请输入范围编码" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="minValue" label="最小值" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="最小值" />
            </Form.Item>
            <Form.Item name="maxValue" label="最大值" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="最大值" />
            </Form.Item>
            <Form.Item name="unit" label="单位" style={{ flex: 1 }}>
              <Input placeholder="单位" />
            </Form.Item>
          </div>
          <Form.Item
            name="isActive"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AuthScope
