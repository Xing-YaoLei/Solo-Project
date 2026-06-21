import React from 'react'
import { Table, Tag, Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const AmountCheckTable = ({ data, loading }) => {
  const columns = [
    {
      title: '校验单号',
      dataIndex: 'check_no',
      key: 'check_no',
      width: 160,
      render: (text) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '校验日期',
      dataIndex: 'check_date',
      key: 'check_date',
      width: 120,
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '订单金额',
      dataIndex: 'order_amount',
      key: 'order_amount',
      width: 120,
      render: (value) => `¥${Number(value).toLocaleString()}`,
    },
    {
      title: '退款金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      width: 120,
      render: (value) => <span style={{ color: '#dc2626' }}>-¥{Number(value).toLocaleString()}</span>,
    },
    {
      title: '服务费',
      dataIndex: 'service_fee',
      key: 'service_fee',
      width: 100,
      render: (value) => `¥${Number(value).toLocaleString()}`,
    },
    {
      title: '预期结算',
      dataIndex: 'expected_settlement',
      key: 'expected_settlement',
      width: 120,
      render: (value) => <strong>¥{Number(value).toLocaleString()}</strong>,
    },
    {
      title: '实际结算',
      dataIndex: 'actual_settlement',
      key: 'actual_settlement',
      width: 120,
      render: (value) => <strong>¥{Number(value).toLocaleString()}</strong>,
    },
    {
      title: '差额',
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      render: (value, record) => (
        <span className={record.is_consistent ? 'check-consistent' : 'check-inconsistent'}>
          {Number(value) === 0 ? '-' : `¥${Number(value).toLocaleString()}`}
        </span>
      ),
    },
    {
      title: '一致性',
      dataIndex: 'is_consistent',
      key: 'is_consistent',
      width: 100,
      render: (isConsistent) => (
        <Tag icon={isConsistent ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={isConsistent ? 'success' : 'error'}>
          {isConsistent ? '一致' : '不一致'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'check_note',
      key: 'check_note',
      ellipsis: true,
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <span>
              <InfoCircleOutlined style={{ color: '#d97706', marginRight: 4 }} />
              {text}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
      scroll={{ x: 1200 }}
      size="small"
    />
  )
}

export default AmountCheckTable
