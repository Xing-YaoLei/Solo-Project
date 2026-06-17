import { useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Modal,
  Form,
  InputNumber,
  Typography,
  message,
  Popconfirm,
  Switch,
  Alert,
  Row,
  Col,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { materialApi } from '@/api'
import { formatCurrency } from '@/config/status'
import { type Material, type CreateMaterialDto } from '@/types'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

const { Title, Text } = Typography

const MaterialsPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>()

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [form] = Form.useForm<CreateMaterialDto & { isActive: boolean }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['materials', pagination.current, pagination.pageSize, searchText, categoryFilter, isActiveFilter],
    queryFn: () =>
      materialApi.getMaterials({
        pageIndex: (pagination.current || 1) - 1,
        pageSize: pagination.pageSize,
        search: searchText || undefined,
        category: categoryFilter,
        isActive: isActiveFilter,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialDto) => materialApi.createMaterial(data),
    onSuccess: () => {
      message.success('创建材料成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: () => {
      message.error('创建材料失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Material> }) =>
      materialApi.updateMaterial(id, data as any),
    onSuccess: () => {
      message.success('更新材料成功')
      setIsModalOpen(false)
      setEditingMaterial(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: () => {
      message.error('更新材料失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialApi.deleteMaterial(id),
    onSuccess: () => {
      message.success('删除材料成功')
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: () => {
      message.error('删除材料失败')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Material> }) =>
      materialApi.updateMaterial(id, data as any),
    onSuccess: () => {
      message.success('状态更新成功')
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: () => {
      message.error('状态更新失败')
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const { isActive, ...createData } = values

      if (editingMaterial) {
        updateMutation.mutate({ id: editingMaterial.id, data: values })
      } else {
        createMutation.mutate(createData)
      }
    } catch {
      // 表单验证失败
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    form.setFieldsValue({
      materialCode: material.materialCode,
      name: material.name,
      specification: material.specification,
      brand: material.brand,
      unit: material.unit,
      standardPrice: material.standardPrice,
      category: material.category,
      isActive: material.isActive,
    })
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingMaterial(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true })
    setIsModalOpen(true)
  }

  const handleToggleStatus = (material: Material, checked: boolean) => {
    toggleStatusMutation.mutate({
      id: material.id,
      data: {
        ...material,
        isActive: checked,
      },
    })
  }

  const categoryOptions = [
    { value: '墙地砖', label: '墙地砖' },
    { value: '木地板', label: '木地板' },
    { value: '涂料', label: '涂料' },
    { value: '板材', label: '板材' },
    { value: '五金', label: '五金' },
    { value: '洁具', label: '洁具' },
    { value: '灯具', label: '灯具' },
    { value: '门窗', label: '门窗' },
    { value: '水电材料', label: '水电材料' },
    { value: '其他', label: '其他' },
  ]

  const unitOptions = [
    { value: '块', label: '块' },
    { value: '片', label: '片' },
    { value: '卷', label: '卷' },
    { value: '桶', label: '桶' },
    { value: '米', label: '米' },
    { value: '平方米', label: '平方米' },
    { value: '立方米', label: '立方米' },
    { value: '件', label: '件' },
    { value: '套', label: '套' },
    { value: '箱', label: '箱' },
    { value: '个', label: '个' },
    { value: '公斤', label: '公斤' },
    { value: '吨', label: '吨' },
  ]

  const columns: ColumnsType<Material> = [
    {
      title: '材料编码',
      dataIndex: 'materialCode',
      key: 'materialCode',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (value) => value ? <Tag color="blue">{value}</Tag> : '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '标准单价',
      dataIndex: 'standardPrice',
      key: 'standardPrice',
      width: 120,
      render: (value) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(value)}</Text>,
      sorter: (a, b) => a.standardPrice - b.standardPrice,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (value, record) => (
        <Space>
          {value ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>启用</Tag>
          ) : (
            <Tag color="gray" icon={<CloseCircleOutlined />}>禁用</Tag>
          )}
          <Switch
            size="small"
            checked={value}
            onChange={(checked) => handleToggleStatus(record, checked)}
            loading={toggleStatusMutation.isPending}
          />
        </Space>
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
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
            title="确定删除这个材料吗？"
            description="删除后无法恢复"
            onConfirm={() => deleteMutation.mutate(record.id)}
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

  if (error) {
    return (
      <Card>
        <Alert type="error" message="加载材料列表失败，请稍后重试" />
      </Card>
    )
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ marginBottom: 8 }}>
          材料管理
        </Title>
        <Text type="secondary">管理装修材料库，维护材料信息和价格</Text>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="搜索材料编码、名称、品牌、规格"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="材料分类"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 140 }}
              allowClear
              options={categoryOptions}
            />
            <Select
              placeholder="状态筛选"
              value={isActiveFilter === undefined ? undefined : String(isActiveFilter)}
              onChange={(value) => setIsActiveFilter(value === undefined ? undefined : value === 'true')}
              style={{ width: 140 }}
              allowClear
              options={[
                { value: 'true', label: '启用' },
                { value: 'false', label: '禁用' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('')
                setCategoryFilter(undefined)
                setIsActiveFilter(undefined)
                queryClient.invalidateQueries({ queryKey: ['materials'] })
              }}
            >
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增材料
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={data?.items}
            rowKey="id"
            loading={
              isLoading ||
              createMutation.isPending ||
              updateMutation.isPending ||
              deleteMutation.isPending ||
              toggleStatusMutation.isPending
            }
            pagination={{
              ...pagination,
              total: data?.totalCount || 0,
              onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            }}
            scroll={{ x: 1300 }}
          />
        </Space>
      </Card>

      <Modal
        title={editingMaterial ? '编辑材料' : '新增材料'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingMaterial(null)
          form.resetFields()
        }}
        okText={editingMaterial ? '保存' : '创建'}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="materialCode"
                label="材料编码"
                rules={[{ required: true, message: '请输入材料编码' }]}
              >
                <Input placeholder="请输入材料编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="材料名称"
                rules={[{ required: true, message: '请输入材料名称' }]}
              >
                <Input placeholder="请输入材料名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="品牌"
                rules={[{ required: true, message: '请输入品牌' }]}
              >
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类" options={categoryOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="计量单位"
                rules={[{ required: true, message: '请选择计量单位' }]}
              >
                <Select placeholder="选择计量单位" options={unitOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="standardPrice"
                label="标准单价（元）"
                rules={[{ required: true, message: '请输入标准单价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="请输入标准单价"
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specification"
            label="规格型号"
          >
            <Input placeholder="请输入规格型号（选填）" />
          </Form.Item>

          {editingMaterial && (
            <Form.Item
              name="isActive"
              label="状态"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default MaterialsPage
