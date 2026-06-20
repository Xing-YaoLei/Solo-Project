import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Timeline,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Divider,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  CloseOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ordersAPI, ridersAPI } from '../../api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const statusColors = {
  pending: 'orange',
  accepted: 'blue',
  picked: 'cyan',
  delivering: 'geekblue',
  delivered: 'purple',
  completed: 'green',
  cancelled: 'default',
  rejected: 'red',
  appealed: 'magenta',
  settled: 'gold',
}

const statusLabels = {
  pending: '待接单',
  accepted: '已接单',
  picked: '已取货',
  delivering: '配送中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒单',
  appealed: '申诉中',
  settled: '已结算',
}

const rejectReasons = [
  { value: 'rider_fault', label: '骑手原因' },
  { value: 'system_fault', label: '系统原因' },
  { value: 'merchant_fault', label: '商家原因' },
  { value: 'customer_fault', label: '客户原因' },
  { value: 'other', label: '其他原因' },
]

const responsibilityLabels = {
  rider: '骑手责任',
  platform: '平台责任',
  merchant: '商家责任',
  customer: '客户责任',
}

export default function OrderDetail() {
  const navigate = useNavigate()
  const params = useParams({ from: '/orders/$orderId' })
  const orderId = params.orderId
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [riders, setRiders] = useState([])
  const [assignVisible, setAssignVisible] = useState(false)
  const [closeVisible, setCloseVisible] = useState(false)
  const [supplementVisible, setSupplementVisible] = useState(false)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [form] = Form.useForm()
  const [supplementForm] = Form.useForm()
  const [closeForm] = Form.useForm()
  const [rejectForm] = Form.useForm()

  useEffect(() => {
    if (orderId) {
      loadOrderDetail()
      loadRiders()
    }
  }, [orderId])

  const loadOrderDetail = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.get(orderId)
      setOrder(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadRiders = async () => {
    try {
      const res = await ridersAPI.getOptions()
      setRiders(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleAssign = async () => {
    try {
      const values = await form.validateFields()
      await ordersAPI.assign(orderId, values.rider_id)
      message.success('分派成功')
      setAssignVisible(false)
      form.resetFields()
      loadOrderDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const handleClose = async () => {
    try {
      const values = await closeForm.validateFields()
      await ordersAPI.close(orderId, values.reason, '管理员')
      message.success('订单已关闭')
      setCloseVisible(false)
      closeForm.resetFields()
      loadOrderDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSupplement = async () => {
    try {
      const values = await supplementForm.validateFields()
      await ordersAPI.supplement({
        order_id: parseInt(orderId),
        field_name: values.field_name,
        field_value: values.field_value,
        operator_name: '管理员',
        remark: values.remark,
      })
      message.success('补录成功')
      setSupplementVisible(false)
      supplementForm.resetFields()
      loadOrderDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      await ordersAPI.reject({
        order_id: parseInt(orderId),
        rider_id: order.rider_id,
        reject_reason: values.reject_reason,
        reject_detail: values.reject_detail,
      })
      message.success('拒单已记录')
      setRejectVisible(false)
      rejectForm.resetFields()
      loadOrderDetail()
    } catch (e) {
      console.error(e)
    }
  }

  if (!order) {
    return <div>加载中...</div>
  }

  const statusLogColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '状态变更',
      key: 'status',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.from_status && (
            <>
              <Tag color={statusColors[record.from_status]}>
                {statusLabels[record.from_status] || record.from_status}
              </Tag>
              <span>→</span>
            </>
          )}
          <Tag color={statusColors[record.to_status]}>
            {statusLabels[record.to_status] || record.to_status}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'operator_type',
      key: 'operator_type',
      width: 100,
      render: (val) => {
        const map = { system: '系统', rider: '骑手', admin: '管理员', customer: '客户' }
        return map[val] || val
      },
    },
    {
      title: '原因/备注',
      dataIndex: 'reason',
      key: 'reason',
      render: (val, record) => val || record.remark || '-',
    },
  ]

  const rejectRecordColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '骑手',
      dataIndex: 'rider_name',
      key: 'rider_name',
      width: 100,
    },
    {
      title: '拒单原因',
      dataIndex: 'reject_reason',
      key: 'reject_reason',
      width: 120,
      render: (val) => {
        const opt = rejectReasons.find((r) => r.value === val)
        return opt?.label || val
      },
    },
    {
      title: '责任方',
      dataIndex: 'responsibility',
      key: 'responsibility',
      width: 100,
      render: (val) => responsibilityLabels[val] || val,
    },
    {
      title: '是否已提醒',
      dataIndex: 'is_reminded',
      key: 'is_reminded',
      width: 100,
      render: (val) => (val ? <Tag color="green">已提醒</Tag> : <Tag color="orange">待提醒</Tag>),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 120,
    },
    {
      title: '详情',
      dataIndex: 'reject_detail',
      key: 'reject_detail',
      render: (val) => val || '-',
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/orders' })}>
          返回列表
        </Button>
      </div>

      <Card
        title={
          <Space>
            <span>订单详情</span>
            <span style={{ fontSize: 14, color: '#666' }}>{order.order_no}</span>
            <Tag color={statusColors[order.status]} style={{ marginLeft: 8 }}>
              {statusLabels[order.status]}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            {order.status === 'pending' && (
              <Button type="primary" icon={<UserOutlined />} onClick={() => setAssignVisible(true)}>
                分派骑手
              </Button>
            )}
            {(order.status === 'accepted' || order.status === 'picked' || order.status === 'delivering') && (
              <Button type="primary" icon={<CloseOutlined />} onClick={() => setRejectVisible(true)}>
                记录拒单
              </Button>
            )}
            <Button icon={<EditOutlined />} onClick={() => setSupplementVisible(true)}>
              补录信息
            </Button>
            {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'settled' && (
              <Popconfirm
                title="确定关闭订单？"
                onConfirm={() => setCloseVisible(true)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<CloseOutlined />}>
                  关闭订单
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
        loading={loading}
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="取货地址">{order.pickup_address}</Descriptions.Item>
              <Descriptions.Item label="送货地址">{order.delivery_address}</Descriptions.Item>
              <Descriptions.Item label="取货区域">{order.pickup_area || '-'}</Descriptions.Item>
              <Descriptions.Item label="送货区域">{order.delivery_area || '-'}</Descriptions.Item>
              <Descriptions.Item label="配送距离">{order.distance ? `${(order.distance / 1000).toFixed(2)} 公里` : '-'}</Descriptions.Item>
              <Descriptions.Item label="物品名称">{order.goods_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="物品重量">{order.goods_weight ? `${order.goods_weight} kg` : '-'}</Descriptions.Item>
              <Descriptions.Item label="物品价值">{order.goods_amount ? `¥${order.goods_amount}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{order.customer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户电话">{order.customer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="骑手">{order.rider_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="拒单数">{order.reject_count} 次</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(order.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">时间节点</Divider>
            <Timeline mode="left" style={{ marginTop: 16 }}>
              <Timeline.Item label={dayjs(order.created_at).format('HH:mm')}>
                订单创建
                <div style={{ color: '#999', fontSize: 12 }}>{dayjs(order.created_at).format('YYYY-MM-DD')}</div>
              </Timeline.Item>
              {order.assign_time && (
                <Timeline.Item label={dayjs(order.assign_time).format('HH:mm')}>
                  分派骑手: {order.rider_name}
                  <div style={{ color: '#999', fontSize: 12 }}>{dayjs(order.assign_time).format('YYYY-MM-DD')}</div>
                </Timeline.Item>
              )}
              {order.accept_time && (
                <Timeline.Item label={dayjs(order.accept_time).format('HH:mm')}>
                  骑手接单
                  <div style={{ color: '#999', fontSize: 12 }}>{dayjs(order.accept_time).format('YYYY-MM-DD')}</div>
                </Timeline.Item>
              )}
              {order.pickup_time && (
                <Timeline.Item label={dayjs(order.pickup_time).format('HH:mm')}>
                  已取货
                  <div style={{ color: '#999', fontSize: 12 }}>{dayjs(order.pickup_time).format('YYYY-MM-DD')}</div>
                </Timeline.Item>
              )}
              {order.delivery_time && (
                <Timeline.Item label={dayjs(order.delivery_time).format('HH:mm')}>
                  已送达
                  <div style={{ color: '#999', fontSize: 12 }}>{dayjs(order.delivery_time).format('YYYY-MM-DD')}</div>
                </Timeline.Item>
              )}
              {order.complete_time && (
                <Timeline.Item label={dayjs(order.complete_time).format('HH:mm')}>
                  订单完成
                  <div style={{ color: '#999', fontSize: 12 }}>{dayjs(order.complete_time).format('YYYY-MM-DD')}</div>
                </Timeline.Item>
              )}
            </Timeline>

            <Divider orientation="left">费用明细</Divider>
            <Descriptions column={4} bordered size="small">
              <Descriptions.Item label="基础费">¥{order.base_fee}</Descriptions.Item>
              <Descriptions.Item label="距离加价">¥{order.distance_fee}</Descriptions.Item>
              <Descriptions.Item label="重量加价">¥{order.weight_fee}</Descriptions.Item>
              <Descriptions.Item label="补贴">¥{order.subsidy_fee}</Descriptions.Item>
              <Descriptions.Item label="订单总额" style={{ fontWeight: 'bold' }}>
                ¥{order.total_fee}
              </Descriptions.Item>
              <Descriptions.Item label="骑手收入">¥{order.rider_income}</Descriptions.Item>
              <Descriptions.Item label="平台利润">¥{order.platform_profit}</Descriptions.Item>
            </Descriptions>

            {order.remark && (
              <>
                <Divider orientation="left">备注</Divider>
                <div style={{ color: '#666' }}>{order.remark}</div>
              </>
            )}
          </TabPane>

          <TabPane tab="状态流转日志" key="logs">
            <Table
              columns={statusLogColumns}
              dataSource={order.status_logs || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="拒单记录" key="rejects">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ marginBottom: 16 }}
              onClick={() => setRejectVisible(true)}
              disabled={!order.rider_id}
            >
              记录拒单
            </Button>
            <Table
              columns={rejectRecordColumns}
              dataSource={order.reject_records || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="申诉记录" key="appeals">
            <div style={{ color: '#666' }}>
              {order.appeals && order.appeals.length > 0
                ? `共 ${order.appeals.length} 条申诉记录`
                : '暂无申诉记录'}
            </div>
          </TabPane>

          <TabPane tab="结算记录" key="settlements">
            <div style={{ color: '#666' }}>
              {order.settlements && order.settlements.length > 0
                ? `共 ${order.settlements.length} 条结算记录`
                : '暂无结算记录'}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="分派骑手"
        open={assignVisible}
        onOk={handleAssign}
        onCancel={() => setAssignVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="rider_id"
            label="选择骑手"
            rules={[{ required: true, message: '请选择骑手' }]}
          >
            <Select placeholder="请选择骑手" showSearch optionFilterProp="children">
              {riders.map((rider) => (
                <Option key={rider.id} value={rider.id}>
                  {rider.name} ({rider.area}) - {rider.status === 'online' ? '在线' : '离线'}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭订单"
        open={closeVisible}
        onOk={handleClose}
        onCancel={() => setCloseVisible(false)}
        destroyOnClose
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item
            name="reason"
            label="关闭原因"
            rules={[{ required: true, message: '请输入关闭原因' }]}
          >
            <TextArea rows={4} placeholder="请输入关闭订单的原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="补录信息"
        open={supplementVisible}
        onOk={handleSupplement}
        onCancel={() => setSupplementVisible(false)}
        destroyOnClose
      >
        <Form form={supplementForm} layout="vertical">
          <Form.Item
            name="field_name"
            label="补录字段"
            rules={[{ required: true, message: '请选择补录字段' }]}
          >
            <Select placeholder="请选择要补录的字段">
              <Option value="customer_name">客户姓名</Option>
              <Option value="customer_phone">客户电话</Option>
              <Option value="goods_name">物品名称</Option>
              <Option value="goods_weight">物品重量</Option>
              <Option value="goods_amount">物品价值</Option>
              <Option value="remark">备注</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="field_value"
            label="字段值"
            rules={[{ required: true, message: '请输入字段值' }]}
          >
            <Input placeholder="请输入字段值" />
          </Form.Item>
          <Form.Item name="remark" label="补录备注">
            <TextArea rows={2} placeholder="补录原因说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="记录拒单"
        open={rejectVisible}
        onOk={handleReject}
        onCancel={() => setRejectVisible(false)}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reject_reason"
            label="拒单原因分类"
            rules={[{ required: true, message: '请选择拒单原因' }]}
          >
            <Select placeholder="请选择拒单原因分类">
              {rejectReasons.map((reason) => (
                <Option key={reason.value} value={reason.value}>
                  {reason.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reject_detail" label="拒单详情">
            <TextArea rows={4} placeholder="请输入拒单的详细说明" />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            系统将根据拒单原因自动判定责任方，并分派到对应处理组
          </div>
        </Form>
      </Modal>
    </div>
  )
}
