import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, InputNumber, Typography, Space, message } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { SettlementSheet } from '../types';
import { SettlementStatus } from '../types';
import { getSettlementSheets, createSettlementSheet, confirmSettlement, settleSettlement } from '../api/settlementSheets';
import { getCaliberDescription } from '../api/export';
import StatusBadge from '../components/StatusBadge';

const { Title } = Typography;

const SettlementSheets: React.FC = () => {
  const [data, setData] = useState<SettlementSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [caliberModalOpen, setCaliberModalOpen] = useState(false);
  const [caliberText, setCaliberText] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSettlementSheets();
      setData(res.data.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createSettlementSheet(values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      // validation error
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await confirmSettlement(id);
      message.success('确认成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleSettle = async (id: number) => {
    try {
      await settleSettlement(id);
      message.success('结算成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleViewCaliber = async (sheet: SettlementSheet) => {
    try {
      const res = await getCaliberDescription('settlement');
      setCaliberText(res.data.data || sheet.caliberDescription || '暂无口径说明');
      setCaliberModalOpen(true);
    } catch {
      setCaliberText(sheet.caliberDescription || '暂无口径说明');
      setCaliberModalOpen(true);
    }
  };

  const itemColumns = [
    { title: '商品标签', dataIndex: 'productTagName', key: 'productTagName' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '单价(¥)', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => v.toFixed(2) },
    { title: '小计(¥)', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => v.toFixed(2) },
    { title: '口径说明', dataIndex: 'caliberNote', key: 'caliberNote', ellipsis: true },
  ];

  const mainColumns = [
    { title: '结算单号', dataIndex: 'sheetNo', key: 'sheetNo' },
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
    { title: '团长等级', dataIndex: 'leaderTierName', key: 'leaderTierName' },
    {
      title: '总金额(¥)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => v.toFixed(2),
    },
    { title: '品项数', dataIndex: 'itemCount', key: 'itemCount' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SettlementStatus) => <StatusBadge status={status} type="settlement" />,
    },
    {
      title: '口径说明',
      dataIndex: 'caliberDescription',
      key: 'caliberDescription',
      ellipsis: true,
      render: (_: string, record: SettlementSheet) => (
        <Button type="link" icon={<FileTextOutlined />} onClick={() => handleViewCaliber(record)}>
          查看
        </Button>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: SettlementSheet) => (
        <Space>
          {record.status === SettlementStatus.Calculating && (
            <Button type="primary" size="small" onClick={() => handleConfirm(record.id)}>确认</Button>
          )}
          {record.status === SettlementStatus.Confirmed && (
            <Button type="primary" size="small" onClick={() => handleSettle(record.id)}>结算</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>结算单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
          创建结算单
        </Button>
      </div>

      <Table
        columns={mainColumns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record: SettlementSheet) => (
            <Table
              columns={itemColumns}
              dataSource={record.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ),
        }}
      />

      <Modal
        title="创建结算单"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="groupBatchId" label="批次ID" rules={[{ required: true, message: '请输入批次ID' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="口径说明"
        open={caliberModalOpen}
        onCancel={() => setCaliberModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{caliberText}</div>
      </Modal>
    </Space>
  );
};

export default SettlementSheets;
