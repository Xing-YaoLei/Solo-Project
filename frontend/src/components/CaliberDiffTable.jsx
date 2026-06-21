import React from 'react'
import { Table, Tag, Badge, Tooltip } from 'antd'
import { WarningOutlined, CheckCircleOutlined, DiffOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const CaliberDiffTable = ({ data, loading, pagination, onChange }) => {
  const getDiffTypeLabel = (type) => {
    const typeMap = {
      amount_mismatch: '金额不符',
      record_missing: '记录缺失',
      caliber_mismatch: '口径差异',
    }
    return typeMap[type] || type
  }

  const getDiffTypeColor = (type) => {
    const colorMap = {
      amount_mismatch: 'orange',
      record_missing: 'red',
      caliber_mismatch: 'blue',
    }
    return colorMap[type] || 'default'
  }

  const columns = [
    {
      title: '差异单号',
      dataIndex: 'diff_no',
      key: 'diff_no',
      width: 160,
      render: (text) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '关联订单',
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
      title: '客服记录金额',
      dataIndex: 'cs_amount',
      key: 'cs_amount',
      width: 130,
      render: (value) =>
        value !== null && value !== undefined ? (
          `¥${Number(value).toLocaleString()}`
        ) : (
          <Tag icon={<WarningOutlined />} color="red">
            缺失
          </Tag>
        ),
    },
    {
      title: '支付流水金额',
      dataIndex: 'payment_amount',
      key: 'payment_amount',
      width: 130,
      render: (value) =>
        value !== null && value !== undefined ? (
          `¥${Number(value).toLocaleString()}`
        ) : (
          <Tag icon={<WarningOutlined />} color="red">
            缺失
          </Tag>
        ),
    },
    {
      title: '差异金额',
      dataIndex: 'difference',
      key: 'difference',
      width: 110,
      render: (value) => (
        <span className="diff-amount">
          <DiffOutlined style={{ marginRight: 4 }} />
          ¥{Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      title: '差异类型',
      dataIndex: 'diff_type',
      key: 'diff_type',
      width: 110,
      render: (type) => <Tag color={getDiffTypeColor(type)}>{getDiffTypeLabel(type)}</Tag>,
    },
    {
      title: '处理状态',
      dataIndex: 'is_resolved',
      key: 'is_resolved',
      width: 100,
      render: (resolved) => (
        <Badge
          status={resolved ? 'success' : 'warning'}
          text={resolved ? '已解决' : '待处理'}
        />
      ),
    },
    {
      title: '解决方案',
      dataIndex: 'resolution',
      key: 'resolution',
      ellipsis: true,
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <span>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              {text}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#9ca3af' }}>待确认</span>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <div
        style={{
          padding: '12px 16px',
          background: '#fef2f2',
          borderRadius: 6,
          marginBottom: 16,
          borderLeft: '4px solid #dc2626',
        }}
      >
        <div style={{ fontWeight: 500, color: '#991b1b', marginBottom: 4 }}>
          <WarningOutlined style={{ marginRight: 6 }} />
          客服记录与支付流水口径差异说明
        </div>
        <div style={{ fontSize: 13, color: '#7f1d1d' }}>
          当客服记录与支付流水口径存在冲突时，系统保留完整差异表供人工核对，不会直接覆盖任何一方数据。
          差异处理需由财务和业务双方确认后再行调整。
        </div>
      </div>
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
          showTotal: (total) => `共 ${total} 条差异记录`,
        }}
        onChange={onChange}
        scroll={{ x: 1300 }}
        size="small"
      />
    </div>
  )
}

export default CaliberDiffTable
