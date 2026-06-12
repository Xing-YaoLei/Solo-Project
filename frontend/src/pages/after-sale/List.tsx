import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Space, Modal, Form, message, Popconfirm, Tag, Row, Col, Card } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { afterSaleVoucherApi, pickupCodeApi } from '../../api'
import { AfterSaleVoucher, AfterSaleVoucherTypeMap, AfterSaleVoucherStatusMap, StatusColorMap } from '../../types'
import StatusBadge from '../../components/StatusBadge'

const { Option } = Select

export default function AfterSaleList() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<AfterSaleVoucher | null>(null)

  const { data: pickupCodes } = useQuery({
    queryKey: ['pickup-codes', 'all'],
    queryFn: () => pickupCodeApi.list({ page: 1, page_size: 200 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['after-sale-vouchers', page, pageSize, keyword, statusFilter, typeFilter],
    queryFn: () => afterSaleVoucherApi.list({
      page,
      page_size: pageSize,
      keyword,
      status: statusFilter,
      type: typeFilter,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (values: Partial<AfterSaleVoucher>) => afterSaleVoucherApi.create(values),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['after-sale-vouchers'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<AfterSaleVoucher> }) =>
      afterSaleVoucherApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingItem(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['after-sale-vouchers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => afterSaleVoucherApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['after-sale-vouchers'] })
    },
  })

  const handleSearch = () => {
    searchForm.validateFields().then((values) => {
      setKeyword(values.keyword || '')
      setStatusFilter(values.status)
      setTypeFilter(values.type)
      setPage(1)
    })
  }

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'refund',
      status: 'pending',
    })
    setModalVisible(true)
  }

  const handleEdit = (record: AfterSaleVoucher) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      apply_time: record.apply_time ? dayjs(record.apply_time) : undefined,
      process_time: record.process_time ? dayjs(record.process_time) : undefined,
    })
    setModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const formattedValues = {
        ...values,
        apply_time: values.apply_time?.toISOString(),
        process_time: values.process_time?.toISOString(),
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id!, values: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    })
  }

  const columns = [
    {
      title: '凭证号',
      dataIndex: 'voucher_no',
      key: 'voucher_no',
      width: 140,
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          refund: 'red',
          exchange: 'blue',
          compensation: 'orange',
          other: 'default',
        }
        return <Tag color={colorMap[type] || 'default'}>{AfterSaleVoucherTypeMap[type]}</Tag>
      },
    },
    {
      title: '自提码',
      dataIndex: 'pickup_code_id',
      key: 'pickup_code_id',
      width: 120,
      render: (id: number) => {
        const code = pickupCodes?.list.find((c: any) => c.id === id)
        return code ? code.code : '-'
      },
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'applicant_phone',
      key: 'applicant_phone',
      width: 120,
    },
    {
      title: '商品信息',
      dataIndex: 'product_info',
      key: 'product_info',
      ellipsis: true,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '退款金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      width: 100,
      align: 'right' as const,
      render: (amount: number) => amount ? `¥${amount.toFixed(2)}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="afterSale" />,
    },
    {
      title: '申请时间',
      dataIndex: 'apply_time',
      key: 'apply_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '处理人',
      dataIndex: 'processor',
      key: 'processor',
      width: 100,
    },
    {
      title: '处理结果',
      dataIndex: 'process_result',
      key: 'process_result',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: AfterSaleVoucher) => (
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
            title="确定删除这个售后凭证吗？"
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
        <h1 className="page-title">售后凭证管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建售后
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" className="filter-form" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="凭证号/申请人" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部类型" allowClear style={{ width: 120 }}>
              {Object.entries(AfterSaleVoucherTypeMap).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 120 }}>
              {Object.entries(AfterSaleVoucherStatusMap).map(([value, label]) => (
                <Option key={value} value={value}>
                  <Tag color={StatusColorMap[value] as any}>{label}</Tag>
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
                setStatusFilter(undefined)
                setTypeFilter(undefined)
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
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑售后凭证' : '新建售后凭证'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingItem(null)
        }}
        width={700}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="voucher_no"
                label="凭证号"
                rules={[{ required: true, message: '请输入凭证号' }]}
              >
                <Input placeholder="自动生成或手动输入" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="pickup_code_id"
                label="关联自提码"
                rules={[{ required: true, message: '请选择自提码' }]}
              >
                <Select placeholder="请选择自提码" showSearch optionFilterProp="children">
                  {pickupCodes?.list.map((code: any) => (
                    <Option key={code.id} value={code.id}>
                      {code.code} - {code.customer_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="type"
                label="售后类型"
                rules={[{ required: true, message: '请选择售后类型' }]}
              >
                <Select>
                  {Object.entries(AfterSaleVoucherTypeMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  {Object.entries(AfterSaleVoucherStatusMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="refund_amount" label="退款金额">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="applicant" label="申请人">
                <Input placeholder="请输入申请人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="applicant_phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="product_info" label="商品信息">
            <Input.TextArea rows={2} placeholder="商品信息描述" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="售后原因"
            rules={[{ required: true, message: '请输入售后原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入售后原因" />
          </Form.Item>
          <Form.Item name="apply_time" label="申请时间">
            <Input type="datetime-local" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="processor" label="处理人">
                <Input placeholder="请输入处理人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="process_time" label="处理时间">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="process_result" label="处理结果">
            <Input.TextArea rows={3} placeholder="请输入处理结果" />
          </Form.Item>
          <Form.Item name="evidence_images" label="凭证图片">
            <Input placeholder="图片链接，多个用逗号分隔" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
