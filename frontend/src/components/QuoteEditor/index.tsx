import { useState } from 'react';
import { 
  Card, Table, Button, Space, InputNumber, Form, Input, 
  Divider, Tag, Modal, message 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, SaveOutlined, 
  CloseOutlined, DeleteOutlined 
} from '@ant-design/icons';
import type { Quote, QuoteItem } from '@/types';

interface QuoteEditorProps {
  quote: Quote | null;
  editable?: boolean;
  loading?: boolean;
  onSave?: (quote: Quote) => void;
}

export default function QuoteEditor({ quote, editable = true, loading, onSave }: QuoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Quote | null>(quote);
  const [form] = Form.useForm();

  const handleEdit = () => {
    setEditData(JSON.parse(JSON.stringify(quote)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(quote);
  };

  const handleSave = async () => {
    if (editData && onSave) {
      const laborCost = editData.quoteItems
        .filter(item => item.type === 'Labor')
        .reduce((sum, item) => sum + item.subtotal, 0);
      const partsCost = editData.quoteItems
        .filter(item => item.type === 'Parts')
        .reduce((sum, item) => sum + item.subtotal, 0);
      const totalAmount = laborCost + partsCost;
      
      const updatedQuote = {
        ...editData,
        laborCost,
        partsCost,
        totalAmount,
      };
      
      onSave(updatedQuote);
      setIsEditing(false);
      message.success('报价单已保存');
    }
  };

  const handleAddItem = () => {
    if (!editData) return;
    const newItem: QuoteItem = {
      id: Date.now(),
      name: '',
      type: 'Parts',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    };
    setEditData({
      ...editData,
      quoteItems: [...editData.quoteItems, newItem],
    });
  };

  const handleDeleteItem = (id: number) => {
    if (!editData) return;
    setEditData({
      ...editData,
      quoteItems: editData.quoteItems.filter(item => item.id !== id),
    });
  };

  const handleItemChange = (id: number, field: keyof QuoteItem, value: any) => {
    if (!editData) return;
    const newItems = editData.quoteItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.subtotal = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    setEditData({ ...editData, quoteItems: newItems });
  };

  const currentQuote = isEditing ? editData : quote;

  const columns: any[] = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: QuoteItem) => {
        if (isEditing) {
          return (
            <Input
              value={text}
              onChange={(e) => handleItemChange(record.id, 'name', e.target.value)}
              placeholder="请输入项目名称"
              size="small"
            />
          );
        }
        return text;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string, record: QuoteItem) => {
        if (isEditing) {
          return (
            <select
              value={type}
              onChange={(e) => handleItemChange(record.id, 'type', e.target.value)}
              style={{ width: '100%', height: 24, fontSize: 12 }}
            >
              <option value="Labor">工时</option>
              <option value="Parts">配件</option>
            </select>
          );
        }
        return type === 'Labor' 
          ? <Tag color="blue">工时</Tag> 
          : <Tag color="orange">配件</Tag>;
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty: number, record: QuoteItem) => {
        if (isEditing) {
          return (
            <InputNumber
              min={0}
              value={qty}
              onChange={(value) => handleItemChange(record.id, 'quantity', value || 0)}
              size="small"
              style={{ width: '100%' }}
            />
          );
        }
        return qty;
      },
    },
    {
      title: '单价(¥)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (price: number, record: QuoteItem) => {
        if (isEditing) {
          return (
            <InputNumber
              min={0}
              value={price}
              onChange={(value) => handleItemChange(record.id, 'unitPrice', value || 0)}
              size="small"
              style={{ width: '100%' }}
            />
          );
        }
        return `¥${price.toFixed(2)}`;
      },
    },
    {
      title: '金额(¥)',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 100,
      render: (subtotal: number) => (
        <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
          ¥{subtotal.toFixed(2)}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (remarks: string, record: QuoteItem) => {
        if (isEditing) {
          return (
            <Input
              value={remarks}
              onChange={(e) => handleItemChange(record.id, 'remarks', e.target.value)}
              placeholder="备注"
              size="small"
            />
          );
        }
        return remarks || '-';
      },
    },
  ];

  if (isEditing) {
    columns.push({
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: QuoteItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => handleDeleteItem(record.id)}
        />
      ),
    });
  }

  if (!quote && !loading) {
    return (
      <Card title="报价单" style={{ height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
          暂无报价单
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>报价单</span>
          {currentQuote && (
            <Tag color={currentQuote.status === 'Confirmed' ? 'green' : currentQuote.status === 'Draft' ? 'blue' : 'red'}>
              {currentQuote.status === 'Draft' ? '草稿' : currentQuote.status === 'Confirmed' ? '已确认' : '已拒绝'}
            </Tag>
          )}
        </Space>
      }
      extra={
        editable && (
          <Space>
            {isEditing ? (
              <>
                <Button icon={<SaveOutlined />} type="primary" size="small" onClick={handleSave}>
                  保存
                </Button>
                <Button icon={<CloseOutlined />} size="small" onClick={handleCancel}>
                  取消
                </Button>
              </>
            ) : (
              <Button icon={<EditOutlined />} size="small" onClick={handleEdit}>
                编辑
              </Button>
            )}
          </Space>
        )
      }
      loading={loading}
      style={{ height: '100%' }}
      size="small"
    >
      {currentQuote && (
        <>
          <Table
            dataSource={currentQuote.quoteItems}
            rowKey="id"
            size="small"
            columns={columns}
            pagination={false}
            scroll={{ y: 180 }}
          />
          
          {isEditing && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              size="small"
              style={{ width: '100%', marginTop: 8 }}
              onClick={handleAddItem}
            >
              添加项目
            </Button>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
            <div>
              <span style={{ color: '#666' }}>工时费：</span>
              <span style={{ fontWeight: 'bold' }}>¥{currentQuote.laborCost.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: '#666' }}>配件费：</span>
              <span style={{ fontWeight: 'bold' }}>¥{currentQuote.partsCost.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: '#666' }}>合计：</span>
              <span style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#f5222d' 
              }}>
                ¥{currentQuote.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
