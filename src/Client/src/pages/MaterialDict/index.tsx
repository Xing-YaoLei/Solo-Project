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
  Tag,
  Popconfirm,
  InputNumber
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons'
import {
  getMaterialList,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from '@/services/material'
import type {
  AttachmentMaterial,
  AttachmentMaterialQuery,
  AttachmentMaterialCreate,
  AttachmentMaterialUpdate
} from '@/types'
import { MaterialCategory, MaterialCategoryText } from '@/types'
import { formatDateTime } from '@/utils/date'

const { Option } = Select

function MaterialDict() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AttachmentMaterial[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [queryParams, setQueryParams] = useState<AttachmentMaterialQuery>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<AttachmentMaterial | null>(null)
  const [form] = Form.useForm<AttachmentMaterialCreate & AttachmentMaterialUpdate>()

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getMaterialList({
        ...queryParams,
        pageIndex: pagination.current,
        pageSize: pagination.pageSize
      })
      setData(result.items)
      setTotal(result.totalCount)
    } catch (error) {
      message.error('获取材料列表失败')
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
    form.setFieldsValue({ isRequired: false, isActive: true, sortOrder: 0 })
    setModalVisible(true)
  }

  const handleEdit = (record: AttachmentMaterial) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMaterial(id)
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
        await updateMaterial({ ...values, id: editingItem.id })
        message.success('更新成功')
      } else {
        await createMaterial(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleActive = async (record: AttachmentMaterial, checked: boolean) => {
    try {
      await updateMaterial({
        id: record.id,
        name: record.name,
        category: record.category,
        isRequired: record.isRequired,
        sortOrder: record.sortOrder,
        isActive: checked,
        description: record.description,
        fileExtensions: record.fileExtensions,
        maxFileSize: record.maxFileSize
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
      sorter: (a: AttachmentMaterial, b: AttachmentMaterial) => a.sortOrder - b.sortOrder
    },
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: MaterialCategory) => (
        <Tag>{MaterialCategoryText[category]}</Tag>
      )
    },
    {
      title: '是否必需',
      dataIndex: 'isRequired',
      key: 'isRequired',
      width: 100,
      render: (required: boolean) => (
        required ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined style={{ color: '#d9d9d9' }} />
      )
    },
    {
      title: '允许文件类型',
      dataIndex: 'fileExtensions',
      key: 'fileExtensions',
      render: (ext: string) => ext || '-'
    },
    {
      title: '最大文件大小',
      dataIndex: 'maxFileSize',
      key: 'maxFileSize',
      render: (size: number) => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean, record: AttachmentMaterial) => (
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
      render: (_: unknown, record: AttachmentMaterial) => (
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
            title="确定删除该材料吗？"
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
              placeholder="材料名称"
              style={{ width: 200 }}
              allowClear
              value={queryParams.name}
              onChange={(e) => setQueryParams({ ...queryParams, name: e.target.value })}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="分类"
              style={{ width: 150 }}
              allowClear
              value={queryParams.category}
              onChange={(value) => setQueryParams({ ...queryParams, category: value })}
            >
              {Object.entries(MaterialCategoryText).map(([key, text]) => (
                <Option key={key} value={Number(key)}>{text}</Option>
              ))}
            </Select>
            <Select
              placeholder="是否必需"
              style={{ width: 120 }}
              allowClear
              value={queryParams.isRequired}
              onChange={(value) => setQueryParams({ ...queryParams, isRequired: value })}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
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
            新增材料
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
        title={editingItem ? '编辑材料' : '新增材料'}
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
            label="材料名称"
            rules={[{ required: true, message: '请输入材料名称' }]}
          >
            <Input placeholder="请输入材料名称" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择分类">
                {Object.entries(MaterialCategoryText).map(([key, text]) => (
                  <Option key={key} value={Number(key)}>{text}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="sortOrder"
              label="排序"
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="排序号" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="isRequired"
              label="是否必需"
              valuePropName="checked"
              style={{ flex: 1 }}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="isActive"
              label="是否启用"
              valuePropName="checked"
              style={{ flex: 1 }}
            >
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="fileExtensions" label="允许文件类型" style={{ flex: 1 }}>
              <Input placeholder=".pdf,.doc,.docx" />
            </Form.Item>
            <Form.Item name="maxFileSize" label="最大文件大小(MB)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="MB" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default MaterialDict
