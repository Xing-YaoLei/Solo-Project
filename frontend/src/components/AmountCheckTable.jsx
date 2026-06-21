import React, { useState } from 'react'
import { Table, Tag, Tooltip, Button, Modal, InputNumber, Input, message, Space } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { settlementApi } from '../utils/api'

const AmountCheckTable = ({ data, loading, onSave }) => {
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(false)

  const handleEdit = (record) => {
    setEditingId(record.id)
    setEditValues({
      actual_settlement: Number(record.actual_settlement),
      check_note: record.check_note || '',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleSave = async (record) => {
    setSaving(true)
    try {
      await settlementApi.saveAmountCheck({
        check_id: record.id,
        actual_settlement: editValues.actual_settlement,
        check_note: editValues.check_note || null,
      })
      message.success(`校验记录 ${record.check_no} 保存成功`)
      setEditingId(null)
      setEditValues({})
      if (onSave) {
        onSave()
      }
    } catch (error) {
      message.error('保存失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

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
      width: 150,
      render: (value, record) => {
        if (editingId === record.id) {
          return (
            <InputNumber
              value={editValues.actual_settlement}
              onChange={(v) => setEditValues({ ...editValues, actual_settlement: v })}
              precision={2}
              style={{ width: '100%' }}
              prefix="¥"
            />
          )
        }
        return <strong>¥{Number(value).toLocaleString()}</strong>
      },
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
      width: 180,
      render: (text, record) => {
        if (editingId === record.id) {
          return (
            <Input
              value={editValues.check_note}
              onChange={(e) => setEditValues({ ...editValues, check_note: e.target.value })}
              placeholder="输入校验备注"
              size="small"
            />
          )
        }
        return text ? (
          <Tooltip title={text}>
            <span>
              <InfoCircleOutlined style={{ color: '#d97706', marginRight: 4 }} />
              {text}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        if (editingId === record.id) {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => handleSave(record)}
              >
                保存
              </Button>
              <Button size="small" onClick={handleCancel}>
                取消
              </Button>
            </Space>
          )
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            修改
          </Button>
        )
      },
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
      scroll={{ x: 1500 }}
      size="small"
    />
  )
}

export default AmountCheckTable
