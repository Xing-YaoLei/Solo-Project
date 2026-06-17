import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message,
  Spin,
  Tag,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined
} from '@ant-design/icons'
import {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '@/services/customer'
import type {
  CustomerProfile,
  CustomerProfileQuery,
  CustomerProfileCreate,
  CustomerProfileUpdate
} from '@/types'
import { formatDateTime } from '@/utils/date'

function CustomerList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CustomerProfile[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [queryParams, setQueryParams] = useState<CustomerProfileQuery>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<CustomerProfile | null>(null)
  const [form] = Form.useForm<CustomerProfileCreate & CustomerProfileUpdate>()

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getCustomerList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取客户列表失败')
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
    setModalVisible(true)
  }

  const handleEdit = (record: CustomerProfile) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCustomer(id)
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
        await updateCustomer({ ...values, id: editingItem.id })
        message.success('更新成功')
      } else {
        await createCustomer(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-'
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => address || '-'
    },
    {
      title: '关联工地数',
      dataIndex: 'siteCount',
      key: 'siteCount',
      render: (count: number) => (
        <Tag color="blue">
          <HomeOutlined style={{ marginRight: '4px' }} />
          {count} 个
        </Tag>
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
      render: (_: unknown, record: CustomerProfile) => (
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
            title="确定删除该客户吗？"
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
              placeholder="客户姓名"
              style={{ width: 200 }}
              allowClear
              value={queryParams.customerName}
              onChange={(e) => setQueryParams({ ...queryParams, customerName: e.target.value })}
              prefix={<SearchOutlined />}
            />
            <Input
              placeholder="手机号"
              style={{ width: 150 }}
              allowClear
              value={queryParams.phone}
              onChange={(e) => setQueryParams({ ...queryParams, phone: e.target.value })}
            />
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
            新增客户
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
        title={editingItem ? '编辑客户' : '新增客户'}
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
            name="customerName"
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号">
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CustomerList
