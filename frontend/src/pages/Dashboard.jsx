import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd'
import {
  ShoppingOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import { ordersAPI, statsAPI } from '../api'
import dayjs from 'dayjs'

export default function Dashboard() {
  const navigate = useNavigate()
  const [statusCount, setStatusCount] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [countRes, ordersRes] = await Promise.all([
        ordersAPI.getStatusCount(),
        ordersAPI.list({ page: 1, page_size: 10 }),
      ])
      setStatusCount(countRes.data)
      setRecentOrders(ordersRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '取货地址',
      dataIndex: 'pickup_address',
      key: 'pickup_address',
      ellipsis: true,
    },
    {
      title: '送货地址',
      dataIndex: 'delivery_address',
      key: 'delivery_address',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'total_fee',
      key: 'total_fee',
      width: 100,
      render: (val) => `¥${val}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <div className="page-title">工作台</div>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待接单"
              value={statusCount.pending || 0}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="配送中"
              value={(statusCount.accepted || 0) + (statusCount.picked || 0) + (statusCount.delivering || 0)}
              prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申诉中"
              value={statusCount.appealed || 0}
              prefix={<WarningOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statusCount.completed || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="最近订单"
        extra={
          <Button type="link" onClick={() => navigate({ to: '/orders' })}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentOrders}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          onRow={(record) => ({
            onClick: () => navigate({ to: `/orders/${record.id}` }),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}
