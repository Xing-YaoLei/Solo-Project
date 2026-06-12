import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Space, Modal, Form, message, Popconfirm, Tag, Row, Col, Card, Image } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { productApi } from '../../api'
import { Product } from '../../types'

const { Option } = Select

export default function ProductList() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, keyword, categoryFilter],
    queryFn: () => productApi.list({
      page,
      page_size: pageSize,
      keyword,
      category: categoryFilter,
    }),
  })

  const categories = ['蔬菜', '水果', '肉类', '海鲜', '粮油', '日用', '其他']

  const createMutation = useMutation({
    mutationFn: (values: Partial<Product>) => productApi.create(values),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<Product> }) =>
      productApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingItem(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleSearch = () => {
    searchForm.validateFields().then((values) => {
      setKeyword(values.keyword || '')
      setCategoryFilter(values.category)
      setPage(1)
    })
  }

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      category: '其他',
      unit: '件',
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Product) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
    })
    setModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id!, values })
      } else {
        createMutation.mutate(values)
      }
    })
  }

  const categoryColorMap: Record<string, string> = {
    '蔬菜': 'green',
    '水果': 'orange',
    '肉类': 'red',
    '海鲜': 'blue',
    '粮油': 'gold',
    '日用': 'purple',
    '其他': 'default',
  }

  const columns = [
    {
      title: '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 80,
      render: (url: string) => (
        url ? (
          <Image
            width={50}
            height={50}
            src={url}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#999' }}>
            无图
          </div>
        )
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={categoryColorMap[category] || 'default'}>{category || '-'}</Tag>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right' as const,
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-',
    },
    {
      title: '成本价',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      align: 'right' as const,
      render: (cost: number) => cost ? `¥${cost.toFixed(2)}` : '-',
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Product) => (
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
            title="确定删除这个商品吗？"
            onConfirm={() => deleteMutation.mutate(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">商品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建商品
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" className="filter-form" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="SKU/商品名称" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="全部分类" allowClear style={{ width: 140 }}>
              {categories.map((category) => (
                <Option key={category} value={category}>
                  <Tag color={categoryColorMap[category]}>{category}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => {
                searchForm.resetFields()
                setKeyword('')
                setCategoryFilter(undefined)
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑商品' : '新建商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingItem(null)
        }}
        width={600}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sku"
                label="商品SKU"
                rules={[{ required: true, message: '请输入SKU' }]}
              >
                <Input placeholder="如：VEG-001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="商品分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select>
                  {categories.map((category) => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="unit"
                label="计量单位"
                rules={[{ required: true, message: '请输入单位' }]}
              >
                <Select>
                  <Option value="件">件</Option>
                  <Option value="斤">斤</Option>
                  <Option value="kg">kg</Option>
                  <Option value="个">个</Option>
                  <Option value="份">份</Option>
                  <Option value="箱">箱</Option>
                  <Option value="袋">袋</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="price"
                label="售价"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="cost" label="成本价">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="supplier" label="供应商">
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item name="image_url" label="商品图片">
            <Input placeholder="请输入图片URL" />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
