import { useState } from 'react'
import { Table, Button, InputNumber, Input, Popconfirm, Card, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuoteStore } from '../../store/useQuoteStore'
import { QuoteItem, CreateQuoteItemDto } from '../../types'
import { quoteApi } from '../../api/quotes'
import { message } from 'antd'

interface QuoteItemsPanelProps {
  mode?: 'edit' | 'view'
}

function QuoteItemsPanel({ mode = 'edit' }: QuoteItemsPanelProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const updateQuoteItems = useQuoteStore((s) => s.updateQuoteItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const isEditable = mode === 'edit'

  if (!currentQuote) {
    return (
      <Card title="报价明细">
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          请先选择报价单
        </div>
      </Card>
    )
  }

  const itemsTotal = currentQuote.items.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0
  )
  const amountMismatch = Math.abs(itemsTotal - (currentQuote.amount || 0)) > 0.01

  const handleAdd = async () => {
    if (!isEditable) return
    const newItemDto: CreateQuoteItemDto = {
      itemName: '',
      unitPrice: 0,
      quantity: 1,
    }
    try {
      const newItem = await quoteApi.addQuoteItem(currentQuote.id, newItemDto)
      const newItems = [...currentQuote.items, newItem]
      updateQuoteItems(newItems)
      setEditingId(newItem.id)
    } catch {
      message.error('添加项目失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isEditable) return
    try {
      await quoteApi.deleteQuoteItem(currentQuote.id, id)
      const newItems = currentQuote.items.filter((item) => item.id !== id)
      updateQuoteItems(newItems)
    } catch {
      message.error('删除项目失败')
    }
  }

  const handleUpdate = async (id: string, field: keyof QuoteItem, value: any) => {
    if (!isEditable) return
    const item = currentQuote.items.find((i) => i.id === id)
    if (!item) return

    const updatedItem = { ...item, [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItem.subtotal =
        (Number(updatedItem.quantity) || 0) * (Number(updatedItem.unitPrice) || 0)
    }

    try {
      const updateDto: CreateQuoteItemDto = {
        itemName: updatedItem.itemName,
        description: updatedItem.description,
        unitPrice: updatedItem.unitPrice,
        quantity: updatedItem.quantity,
      }
      await quoteApi.updateQuoteItem(currentQuote.id, id, updateDto)
      const newItems = currentQuote.items.map((i) =>
        i.id === id ? updatedItem : i
      )
      updateQuoteItems(newItems)
    } catch {
      message.error('更新项目失败')
    }
  }

  const columns: ColumnsType<QuoteItem> = [
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (value, record) =>
        isEditable && editingId === record.id ? (
          <Input
            value={value}
            onChange={(e) => handleUpdate(record.id, 'itemName', e.target.value)}
            onBlur={() => setEditingId(null)}
            autoFocus
            placeholder="请输入项目名称"
          />
        ) : (
          <span
            onClick={() => isEditable && setEditingId(record.id)}
            style={{ cursor: isEditable ? 'pointer' : 'default' }}
          >
            {value || (isEditable ? '点击编辑' : '-')}
          </span>
        ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (value, record) =>
        isEditable ? (
          <Input
            value={value}
            onChange={(e) => handleUpdate(record.id, 'description', e.target.value)}
            placeholder="描述"
          />
        ) : (
          value || '-'
        ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (value, record) =>
        isEditable ? (
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            value={value}
            formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(v) => Number(v?.replace(/[^\d.]/g, ''))}
            onChange={(v) => handleUpdate(record.id, 'unitPrice', Number(v) || 0)}
          />
        ) : (
          `¥${(value || 0).toLocaleString()}`
        ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value, record) =>
        isEditable ? (
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            value={value}
            onChange={(v) => handleUpdate(record.id, 'quantity', Number(v) || 0)}
          />
        ) : (
          value
        ),
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 150,
      render: (value: number) => `¥${(value || 0).toLocaleString()}`,
    },
    ...(isEditable
      ? [
          {
            title: '操作',
            key: 'action',
            width: 80,
            render: (_: any, record: QuoteItem) => (
              <Popconfirm
                title="确定删除此项目？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ]

  return (
    <Card title="报价明细">
      {amountMismatch && isEditable && (
        <Alert
          message="金额校验提示"
          description={`明细合计 ¥${itemsTotal.toLocaleString()} 与报价单金额 ¥${currentQuote.amount.toLocaleString()} 不一致，请检查`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEditable && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加项目
          </Button>
        )}
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>
          合计：<span style={{ color: amountMismatch ? '#cf1322' : '#3f8600' }}>
            ¥{itemsTotal.toLocaleString()}
          </span>
        </div>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={currentQuote.items}
        pagination={false}
      />
    </Card>
  )
}

export default QuoteItemsPanel
