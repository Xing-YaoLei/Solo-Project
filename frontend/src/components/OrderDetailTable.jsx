import React from 'react'
import { Table, Tag, Badge } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const OrderDetailTable = ({ data, loading, pagination, onChange }) => {
  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '商户',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: 150,
    },
    {
      title: '订单时间',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value) => <strong>¥{Number(value).toLocaleString()}</strong>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          completed: { color: 'success', text: '已完成' },
          refunded: { color: 'orange', text: '已退款' },
          pending: { color: 'default', text: '处理中' },
        }
        const info = statusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => {
        const methodMap = {
          wechat: '微信支付',
          alipay: '支付宝',
          cash: '现金',
        }
        return methodMap[method] || method
      },
    },
    {
      title: '系统延迟',
      dataIndex: 'has_delay',
      key: 'has_delay',
      width: 120,
      render: (hasDelay, record) => (
        <span>
          {hasDelay ? (
            <Badge
              status="warning"
              text={
                <span style={{ color: '#d97706' }}>
                  <ClockCircleOutlined /> 延迟{record.delay_hours}小时
                </span>
              }
            />
          ) : (
            <Badge status="success" text="正常" />
          )}
        </span>
      ),
    },
    {
      title: '客服记录',
      dataIndex: 'customer_service_count',
      key: 'customer_service_count',
      width: 100,
      render: (count) => (
        <span>
          {count > 0 ? (
            <Tag color={count > 2 ? 'red' : 'orange'}>{count}条</Tag>
          ) : (
            <span style={{ color: '#9ca3af' }}>-</span>
          )}
        </span>
      ),
    },
    {
      title: '支付流水',
      dataIndex: 'payment_flow_count',
      key: 'payment_flow_count',
      width: 100,
      render: (count) => <span>{count}条</span>,
    },
  ]

  return (
    <Table
      className="diff-table"
      columns={columns}
      dataSource={data?.items || []}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination?.current || 1,
        pageSize: pagination?.pageSize || 20,
        total: data?.total || 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
      onChange={onChange}
      scroll={{ x: 1000 }}
      size="small"
    />
  )
}

export default OrderDetailTable
