import { createFileRoute } from '@tanstack/react-router'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Card,
  message,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { User } from '../../types'
import { authApi } from '../../api'
import { userRoleOptions, getUserRoleLabel, formatDateTime } from '../../utils/format'

export const Route = createFileRoute('/_layout/users')({
  component: UsersPage,
})

function UsersPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })
  const [filters, setFilters] = useState({
    role: undefined as string | undefined,
    keyword: '',
  })
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [editVisible, setEditVisible] = useState(false)
  const [editForm] = Form.useForm()
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await authApi.listUsers({
        page: pagination.page,
        page_size: pagination.page_size,
        role: filters.role,
        keyword: filters.keyword || undefined,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination, filters])

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      await authApi.createUser(values)
      message.success('用户创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '创建失败')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    editForm.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      is_active: user.is_active,
    })
    setEditVisible(true)
  }

  const handleEditSubmit = async () => {
    if (!editingUser) return
    try {
      const values = await editForm.validateFields()
      await authApi.updateUser(editingUser.id, values)
      message.success('更新成功')
      setEditVisible(false)
      setEditingUser(null)
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '更新失败')
    }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'full_name', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '电话', dataIndex: 'phone', width: 120 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (v: string) => <Tag color="blue">{getUserRoleLabel(v)}</Tag>,
    },
    { title: '部门', dataIndex: 'department', width: 120 },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (v: boolean) => (v ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: User) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
          新增用户
        </Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input
              allowClear
              placeholder="搜索用户名/姓名/邮箱"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select
              allowClear
              placeholder="角色"
              style={{ width: 120 }}
              options={userRoleOptions}
              value={filters.role}
              onChange={(v) => setFilters({ ...filters, role: v })}
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title="新增用户"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateVisible(false)
          createForm.resetFields()
        }}
        width={480}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="姓名" name="full_name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role" initialValue="lawyer" rules={[{ required: true }]}>
            <Select options={userRoleOptions} />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditVisible(false)
          setEditingUser(null)
          editForm.resetFields()
        }}
        width={480}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="姓名" name="full_name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select options={userRoleOptions} />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Input />
          </Form.Item>
          <Form.Item label="是否启用" name="is_active" valuePropName="checked">
            <Select
              options={[
                { value: true, label: '启用' },
                { value: false, label: '禁用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
