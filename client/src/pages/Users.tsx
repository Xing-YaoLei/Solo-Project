import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Form,
  Space,
  Tag,
  Modal,
  message,
  Switch,
} from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import { getUsers, createUser, updateUser, deleteUser } from '@/api/auth'
import { getStores } from '@/api/business'
import { UserRole, UserRoleNames } from '@/types'
import type { User, Store } from '@/types'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

const { Option } = Select

const Users = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [stores, setStores] = useState<Store[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize])

  const fetchStores = async () => {
    try {
      const data = await getStores()
      setStores(data)
    } catch (error) {
      console.error('Fetch stores error:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getUsers({
        pageIndex: pagination.current,
        pageSize: pagination.pageSize,
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingUser(record)
    form.setFieldsValue({
      realName: record.realName,
      role: record.role,
      storeId: record.storeId,
      phone: record.phone,
      isActive: record.isActive,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingUser) {
        await updateUser(editingUser.id, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleDelete = (record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.realName}" 吗？`,
      onOk: async () => {
        try {
          await deleteUser(record.id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          console.error('Delete error:', error)
        }
      },
    })
  }

  const columns: TableProps<User>['columns'] = [
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'realName', width: 120 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (role) => {
        const colorMap: Record<number, string> = {
          0: 'blue',
          1: 'green',
          2: 'orange',
          3: 'purple',
        }
        return <Tag color={colorMap[role]}>{UserRoleNames[role as UserRole]}</Tag>
      },
    },
    { title: '所属门店', dataIndex: 'storeName', width: 140, render: (v) => v || '总部' },
    { title: '电话', dataIndex: 'phone', width: 140 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">用户管理</div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={(pag) =>
          setPagination({ current: pag.current || 1, pageSize: pag.pageSize || 20 })
        }
        size="middle"
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editingUser && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {Object.entries(UserRoleNames).map(([key, value]) => (
                <Option key={key} value={Number(key)}>
                  {value}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="storeId" label="所属门店">
            <Select placeholder="请选择门店" allowClear>
              {stores.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          {editingUser && (
            <Form.Item name="isActive" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default Users
