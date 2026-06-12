import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Descriptions, Tabs, Table, Button, Space, Tag, Row, Col, Statistic, Modal, Form, Select, Input, message } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { groupBatchApi, statusLogApi, arrivalListApi, productApi } from '../../api'
import {
  GroupBatchStatusMap,
  StatusColorMap,
  ProductTagTypeMap,
  ArrivalList,
} from '../../types'
import StatusTimeline from '../../components/StatusTimeline'
import StatusBadge from '../../components/StatusBadge'
import { useAppStore } from '../../store'

export default function GroupBatchDetail() {
  const navigate = useNavigate()
  const params = useParams({ from: '/group-batches/$id' })
  const batchId = parseInt(params.id)
  const { currentOperator } = useAppStore()
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [arrivalModalVisible, setArrivalModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [confirmingArrival, setConfirmingArrival] = useState<ArrivalList | null>(null)
  const [statusForm] = Form.useForm()
  const [arrivalForm] = Form.useForm()
  const [confirmForm] = Form.useForm()

  const { data: batch, isLoading } = useQuery({
    queryKey: ['group-batch', batchId],
    queryFn: () => groupBatchApi.get(batchId),
  })

  const { data: statusLogs } = useQuery({
    queryKey: ['status-logs', 'group_batch', batchId],
    queryFn: () => statusLogApi.list({
      related_type: 'group_batch',
      related_id: batchId,
    }),
    enabled: !!batchId,
  })

  const { data: arrivals } = useQuery({
    queryKey: ['arrival-lists', batchId],
    queryFn: () => arrivalListApi.list({ group_batch_id: batchId, page_size: 100 }),
    enabled: !!batchId,
  })

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productApi.list({ page_size: 1000 }),
  })

  const handleStatusChange = () => {
    statusForm.validateFields().then((values) => {
      groupBatchApi.updateStatus(batchId, {
        ...values,
        operator: currentOperator,
      }).then(() => {
        message.success('状态更新成功')
        setStatusModalVisible(false)
        statusForm.resetFields()
      })
    })
  }

  const handleAddArrival = () => {
    arrivalForm.validateFields().then((values) => {
      const product = products?.list.find(p => p.id === values.product_id)
      arrivalListApi.create({
        ...values,
        group_batch_id: batchId,
        product_sku: product?.sku,
        product_name: product?.name,
      }).then(() => {
        message.success('添加成功')
        setArrivalModalVisible(false)
        arrivalForm.resetFields()
      })
    })
  }

  const handleConfirmArrival = () => {
    if (!confirmingArrival) return
    confirmForm.validateFields().then((values) => {
      arrivalListApi.confirm(confirmingArrival.id!, {
        ...values,
        warehouse_operator: currentOperator,
      }).then(() => {
        message.success('到货确认成功')
        setConfirmModalVisible(false)
        setConfirmingArrival(null)
        confirmForm.resetFields()
      })
    })
  }

  const openConfirmModal = (record: ArrivalList) => {
    setConfirmingArrival(record)
    confirmForm.setFieldsValue({
      actual_quantity: record.expected_quantity,
      remark: '',
      create_exception_on_shortage: true,
    })
    setConfirmModalVisible(true)
  }

  const arrivalColumns = [
    {
      title: '商品SKU',
      dataIndex: 'product_sku',
      key: 'product_sku',
      width: 120,
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '预计数量',
      dataIndex: 'expected_quantity',
      key: 'expected_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '实际数量',
      dataIndex: 'actual_quantity',
      key: 'actual_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '短少数量',
      dataIndex: 'shortage_quantity',
      key: 'shortage_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{qty}</span> : qty,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="arrival" />,
    },
    {
      title: '标签',
      dataIndex: 'product_tags',
      key: 'product_tags',
      render: (tags: any[]) => (
        <Space wrap>
          {tags?.map(tag => (
            <Tag key={tag.id} color={tag.tag_color} style={{ margin: 2 }}>
              {tag.tag_name || ProductTagTypeMap[tag.tag_type] || tag.tag_type}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '到货时间',
      dataIndex: 'arrival_time',
      key: 'arrival_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: ArrivalList) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              onClick={() => openConfirmModal(record)}
            >
              确认到货
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const pickupColumns = [
    {
      title: '自提码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      width: 120,
    },
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140,
    },
    {
      title: '商品件数',
      dataIndex: 'total_items',
      key: 'total_items',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="pickup" />,
    },
    {
      title: '提货时间',
      dataIndex: 'pickup_time',
      key: 'pickup_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
  ]

  const exceptionColumns = [
    {
      title: '异常单号',
      dataIndex: 'exception_no',
      key: 'exception_no',
      width: 140,
      render: (text: string) => <strong style={{ color: '#ff4d4f' }}>{text}</strong>,
    },
    {
      title: '异常标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => ({
        shortage: '到货短少',
        quality: '质量问题',
        damage: '破损',
        delay: '配送延迟',
        other: '其他',
      }[type] || type),
    },
    {
      title: '影响数量',
      dataIndex: 'affected_quantity',
      key: 'affected_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '预估损失',
      dataIndex: 'estimated_loss',
      key: 'estimated_loss',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '责任方',
      dataIndex: 'responsibility_party',
      key: 'responsibility_party',
      width: 100,
      render: (party: string) => ({
        supplier: '供应商',
        warehouse: '仓库',
        logistics: '物流',
        platform: '平台',
        customer: '客户',
        unknown: '待确认',
      }[party] || party),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="exception" />,
    },
  ]

  const tabItems = [
    {
      key: 'arrivals',
      label: (
        <span>
          到货清单
          {arrivals?.total ? <Tag color="blue" style={{ marginLeft: 8 }}>{arrivals.total}</Tag> : null}
        </span>
      ),
      children: (
        <div>
          <div className="table-toolbar">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setArrivalModalVisible(true)}
            >
              添加到货
            </Button>
          </div>
          <Table
            columns={arrivalColumns}
            dataSource={arrivals?.list || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 900 }}
          />
        </div>
      ),
    },
    {
      key: 'pickup',
      label: (
        <span>
          自提码
          {batch?.pickup_codes?.length ? <Tag color="blue" style={{ marginLeft: 8 }}>{batch.pickup_codes.length}</Tag> : null}
        </span>
      ),
      children: (
        <Table
          columns={pickupColumns}
          dataSource={batch?.pickup_codes || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
        />
      ),
    },
    {
      key: 'exceptions',
      label: (
        <span>
          异常单
          {batch?.exception_orders?.length ? (
            <Tag color="red" style={{ marginLeft: 8 }}>{batch.exception_orders.length}</Tag>
          ) : null}
        </span>
      ),
      children: (
        <Table
          columns={exceptionColumns}
          dataSource={batch?.exception_orders || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
        />
      ),
    },
    {
      key: 'logs',
      label: '状态日志',
      children: <StatusTimeline logs={statusLogs || []} />,
    },
  ]

  if (isLoading) {
    return <div className="page-container">加载中...</div>
  }

  if (!batch) {
    return <div className="page-container">团单不存在</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate({ to: '/group-batches', search: {} })}
          >
            返回列表
          </Button>
          <h1 className="page-title">
            {batch.name}
            <Tag color={StatusColorMap[batch.status] as any} style={{ marginLeft: 12 }}>
              {GroupBatchStatusMap[batch.status]}
            </Tag>
          </h1>
        </Space>
        <Space>
          <Button onClick={() => setStatusModalVisible(true)}>
            变更状态
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="订单总数" value={batch.total_orders || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="商品件数" value={batch.total_items || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总金额"
              value={batch.total_amount || 0}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="异常单数"
              value={batch.exception_orders?.length || 0}
              valueStyle={{ color: batch.exception_orders?.length ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="团单号">{batch.batch_no}</Descriptions.Item>
          <Descriptions.Item label="操作人">{batch.operator || '-'}</Descriptions.Item>
          <Descriptions.Item label="开团时间">
            {batch.group_start_time ? dayjs(batch.group_start_time).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="截团时间">
            {batch.group_end_time ? dayjs(batch.group_end_time).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="预计到货">
            {batch.expected_arrival_time ? dayjs(batch.expected_arrival_time).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际到货">
            {batch.actual_arrival_time ? dayjs(batch.actual_arrival_time).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="提货点">{batch.pickup_point || '-'}</Descriptions.Item>
          <Descriptions.Item label="提货截止">
            {batch.pickup_deadline ? dayjs(batch.pickup_deadline).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系人">{batch.contact_person || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{batch.contact_phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{batch.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs defaultActiveKey="arrivals" items={tabItems} />
      </Card>

      <Modal
        title="变更团单状态"
        open={statusModalVisible}
        onOk={handleStatusChange}
        onCancel={() => {
          setStatusModalVisible(false)
          statusForm.resetFields()
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              {Object.entries(GroupBatchStatusMap).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  <Tag color={StatusColorMap[value] as any}>{label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="change_reason" label="变更原因">
            <Input.TextArea rows={3} placeholder="请输入变更原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加到货清单"
        open={arrivalModalVisible}
        onOk={handleAddArrival}
        onCancel={() => {
          setArrivalModalVisible(false)
          arrivalForm.resetFields()
        }}
        okText="添加"
        cancelText="取消"
        width={600}
      >
        <Form form={arrivalForm} layout="vertical">
          <Form.Item
            name="product_id"
            label="选择商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select
              showSearch
              placeholder="选择商品"
              optionFilterProp="children"
            >
              {products?.list.map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.sku} - {product.name} (¥{product.price})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expected_quantity"
                label="预计到货数量"
                rules={[{ required: true, message: '请输入预计数量' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="unit_price" label="单价">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            确认到货 - {confirmingArrival?.product_name}
          </Space>
        }
        open={confirmModalVisible}
        onOk={handleConfirmArrival}
        onCancel={() => {
          setConfirmModalVisible(false)
          setConfirmingArrival(null)
          confirmForm.resetFields()
        }}
        okText="确认到货"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#666' }}>预计到货数量：</span>
            <strong>{confirmingArrival?.expected_quantity} 份</strong>
          </div>
          {confirmingArrival?.shortage_quantity! > 0 && (
            <div style={{ color: '#ff4d4f' }}>
              注意：实际数量少于预计数量时将自动生成异常单
            </div>
          )}
        </div>
        <Form form={confirmForm} layout="vertical">
          <Form.Item
            name="actual_quantity"
            label="实际到货数量"
            rules={[{ required: true, message: '请输入实际数量' }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item
            name="create_exception_on_shortage"
            label="短少时自动生成异常单"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
