import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Table, InputNumber, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { SettlementBill, CreateSettlementItem, CreateSettlementBill, PatientDto, SourceChannelDto, UserDto } from '../types';
import { referenceDataApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface BillFormProps {
  form: any;
  initialData?: SettlementBill | null;
  onSubmit: (values: CreateSettlementBill) => void;
  onCancel: () => void;
}

const BillForm: React.FC<BillFormProps> = ({ form, initialData, onSubmit, onCancel }) => {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [sourceChannels, setSourceChannels] = useState<SourceChannelDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<CreateSettlementItem[]>(
    initialData?.items || [
      {
        itemName: '',
        itemType: '',
        quantity: 1,
        unitPrice: 0,
        insuranceCoverage: 70,
        sortOrder: 0,
      },
    ]
  );

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [patientsData, channelsData, usersData] = await Promise.all([
        referenceDataApi.getPatients(),
        referenceDataApi.getSourceChannels(),
        referenceDataApi.getUsers(),
      ]);
      setPatients(patientsData);
      setSourceChannels(channelsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = (values: any) => {
    if (items.length === 0 || !items.some((item) => item.itemName)) {
      message.error('请至少添加一条明细项目');
      return;
    }

    const validItems = items.filter((item) => item.itemName.trim() !== '');
    const submitData: CreateSettlementBill = {
      patientId: values.patientId || 1,
      sourceChannelId: values.sourceChannelId,
      assigneeId: values.assigneeId,
      treatmentStartDate: values.treatmentDate?.[0]?.format('YYYY-MM-DD'),
      treatmentEndDate: values.treatmentDate?.[1]?.format('YYYY-MM-DD'),
      remark: values.remark,
      items: validItems.map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    };

    onSubmit(submitData);
  };

  const addItem = () => {
    const newItem: CreateSettlementItem = {
      itemName: '',
      itemType: '',
      quantity: 1,
      unitPrice: 0,
      insuranceCoverage: 70,
      sortOrder: items.length,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof CreateSettlementItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const calculateTotal = (item: CreateSettlementItem) => {
    return item.quantity * item.unitPrice;
  };

  const calculateInsurance = (item: CreateSettlementItem) => {
    const total = calculateTotal(item);
    const coverage = item.insuranceCoverage || 0;
    return total * (coverage / 100);
  };

  const calculateSelfPay = (item: CreateSettlementItem) => {
    return calculateTotal(item) - calculateInsurance(item);
  };

  const totalAmount = items.reduce((sum, item) => sum + calculateTotal(item), 0);
  const totalInsurance = items.reduce((sum, item) => sum + calculateInsurance(item), 0);
  const totalSelfPay = items.reduce((sum, item) => sum + calculateSelfPay(item), 0);

  const itemColumns = [
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (_: any, _record: any, index: number) => (
        <Input
          placeholder="请输入项目名称"
          value={items[index]?.itemName}
          onChange={(e) => updateItem(index, 'itemName', e.target.value)}
        />
      ),
    },
    {
      title: '项目类型',
      dataIndex: 'itemType',
      key: 'itemType',
      width: 120,
      render: (_: any, _record: any, index: number) => (
        <Select
          placeholder="类型"
          value={items[index]?.itemType || undefined}
          onChange={(val) => updateItem(index, 'itemType', val)}
        >
          <Option value="治疗">治疗</Option>
          <Option value="检查">检查</Option>
          <Option value="药品">药品</Option>
          <Option value="器械">器械</Option>
          <Option value="护理">护理</Option>
          <Option value="其他">其他</Option>
        </Select>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (_: any, _record: any, index: number) => (
        <InputNumber
          min={0.5}
          step={0.5}
          value={items[index]?.quantity}
          onChange={(val) => updateItem(index, 'quantity', val || 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (_: any, _record: any, index: number) => (
        <InputNumber
          min={0}
          step={10}
          value={items[index]?.unitPrice}
          onChange={(val) => updateItem(index, 'unitPrice', val || 0)}
          style={{ width: '100%' }}
          prefix="¥"
        />
      ),
    },
    {
      title: '报销比例',
      dataIndex: 'insuranceCoverage',
      key: 'insuranceCoverage',
      width: 110,
      render: (_: any, _record: any, index: number) => (
        <InputNumber
          min={0}
          max={100}
          step={5}
          value={items[index]?.insuranceCoverage}
          onChange={(val) => updateItem(index, 'insuranceCoverage', val || 0)}
          style={{ width: '100%' }}
          suffix="%"
        />
      ),
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (_: any, _record: any, index: number) => (
        <span style={{ fontWeight: 'bold' }}>¥{calculateTotal(items[index]).toFixed(2)}</span>
      ),
    },
    {
      title: '医保报销',
      dataIndex: 'insuranceAmount',
      key: 'insuranceAmount',
      width: 100,
      render: (_: any, _record: any, index: number) => (
        <span style={{ color: '#52c41a' }}>¥{calculateInsurance(items[index]).toFixed(2)}</span>
      ),
    },
    {
      title: '自付',
      dataIndex: 'selfPayAmount',
      key: 'selfPayAmount',
      width: 100,
      render: (_: any, _record: any, index: number) => (
        <span style={{ color: '#faad14' }}>¥{calculateSelfPay(items[index]).toFixed(2)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, _record: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 12 }}>基本信息</h4>
      </div>

      <Form.Item
        label="患者"
        name="patientId"
        rules={[{ required: true, message: '请选择患者' }]}
      >
        <Select placeholder="请选择患者" loading={loading} showSearch optionFilterProp="children">
          {patients.map((p) => (
            <Option key={p.id} value={p.id}>
              {p.name} ({p.patientNo})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item label="来源渠道" name="sourceChannelId" style={{ flex: 1 }}>
          <Select placeholder="请选择来源渠道" loading={loading}>
            {sourceChannels.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="负责人" name="assigneeId" style={{ flex: 1 }}>
          <Select placeholder="请选择负责人" loading={loading}>
            {users.map((u) => (
              <Option key={u.id} value={u.id}>
                {u.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item label="治疗周期" name="treatmentDate">
        <DatePicker.RangePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="备注" name="remark">
        <TextArea rows={3} placeholder="请输入备注" />
      </Form.Item>

      <div style={{ marginBottom: 12, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>费用明细</h4>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
          添加项目
        </Button>
      </div>

      <Table
        rowKey={(_record, index) => index?.toString() || '0'}
        columns={itemColumns}
        dataSource={items}
        pagination={false}
        size="small"
        bordered
      />

      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 32,
        }}
      >
        <div>
          <span style={{ color: '#999' }}>总金额：</span>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>¥{totalAmount.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: '#999' }}>医保报销：</span>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
            ¥{totalInsurance.toFixed(2)}
          </span>
        </div>
        <div>
          <span style={{ color: '#999' }}>自付金额：</span>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>
            ¥{totalSelfPay.toFixed(2)}
          </span>
        </div>
      </div>

      <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">
            {initialData ? '保存修改' : '创建单据'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default BillForm;
