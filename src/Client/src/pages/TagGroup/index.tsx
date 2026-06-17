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
  getTagGroupList,
  createTagGroup,
  updateTagGroup,
  deleteTagGroup
} from '@/services/tagGroup'
import type {
  TagGroupRule,
  TagGroupRuleQuery,
  TagGroupRuleCreate,
  TagGroupRuleUpdate
} from '@/types'
import { formatDateTime } from '@/utils/date'

const { Option } = Select

function TagGroup() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TagGroupRule[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [queryParams, setQueryParams] = useState<TagGroupRuleQuery>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<TagGroupRule | null>(null)
  const [form] = Form.useForm<TagGroupRuleCreate & TagGroupRuleUpdate>()

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getTagGroupList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取标签分组列表失败')
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
    form.setFieldsValue({ isActive: true, sortOrder: 0 })
    setModalVisible(true)
  }

  const handleEdit = (record: TagGroupRule) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTagGroup(id)
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
        await updateTagGroup({ ...values, id: editingItem.id })
        message.success('更新成功')
      } else {
        await createTagGroup(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleActive = async (record: TagGroupRule, checked: boolean) => {
    try {
      await updateTagGroup({
        id: record.id,
        name: record.name,
        sortOrder: record.sortOrder,
        isActive: checked,
        description: record.description,
        rules: record.rules
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
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a: TagGroupRule, b: TagGroupRule) => a.sortOrder - b.sortOrder
    },
    {
      title: '分组名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => desc || '-'
    },
    {
      title: '规则配置',
      dataIndex: 'rules',
      key: 'rules',
      ellipsis: true,
      render: (rules: string) => rules || '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean, record: TagGroupRule) => (
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
      render: (_: unknown, record: TagGroupRule) => (
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
            title="确定删除该标签分组吗？"
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
              placeholder="分组名称"
              style={{ width: 200 }}
              allowClear
              value={queryParams.name}
              onChange={(e) => setQueryParams({ ...queryParams, name: e.target.value })}
              prefix={<SearchOutlined />}
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
            新增标签分组
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
        title={editingItem ? '编辑标签分组' : '新增标签分组'}
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
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
          >
            <InputNumber style={{ width: '100%' }} placeholder="排序号" />
          </Form.Item>
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
          <Form.Item name="rules" label="规则配置">
            <Input.TextArea rows={4} placeholder="请输入规则配置（JSON格式）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TagGroup
