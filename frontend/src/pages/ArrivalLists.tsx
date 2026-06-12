import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, Typography, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ArrivalList, GroupBatch, ArrivalListItem } from '../types';
import { ArrivalStatus, PickupStatus } from '../types';
import { getArrivalLists, createArrivalList, inspectArrivalList, pickupArrivalList } from '../api/arrivalLists';
import { getGroupBatches } from '../api/groupBatches';
import StatusBadge from '../components/StatusBadge';

const { Title } = Typography;

const ArrivalLists: React.FC = () => {
  const [data, setData] = useState<ArrivalList[]>([]);
  const [batches, setBatches] = useState<GroupBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [arrivalRes, batchRes] = await Promise.all([getArrivalLists(), getGroupBatches()]);
      setData(arrivalRes.data.data || []);
      setBatches(batchRes.data.data || []);
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
      await createArrivalList(values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      // validation error
    }
  };

  const handleInspect = async (id: number) => {
    try {
      await inspectArrivalList(id);
      message.success('验收成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handlePickup = async (arrivalListId: number, itemId: number) => {
    try {
      await pickupArrivalList(arrivalListId, { itemId, pickupStatus: PickupStatus.PickedUp });
      message.success('标记自提成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const itemColumns = (arrivalListId: number) => [
    { title: '商品标签', dataIndex: 'productTagName', key: 'productTagName' },
    { title: '预期数量', dataIndex: 'expectedQuantity', key: 'expectedQuantity' },
    { title: '实际数量', dataIndex: 'actualQuantity', key: 'actualQuantity' },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (val: number) => val != null ? `${val}°C` : '-',
    },
    { title: '状况', dataIndex: 'condition', key: 'condition' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    {
      title: '自提状态',
      dataIndex: 'pickupStatus',
      key: 'pickupStatus',
      render: (status: PickupStatus) => status ? <StatusBadge status={status} type="pickup" /> : '-',
    },
    {
      title: '自提时间',
      dataIndex: 'pickupTime',
      key: 'pickupTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ArrivalListItem) => (
        <Space>
          {record.pickupStatus === PickupStatus.PendingPickup && (
            <Button
              type="primary"
              size="small"
              onClick={() => handlePickup(arrivalListId, record.id)}
            >
              标记自提
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const mainColumns = [
    { title: '清单号', dataIndex: 'listNo', key: 'listNo' },
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
    {
      title: '到货时间',
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: '接收人', dataIndex: 'receiver', key: 'receiver' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ArrivalStatus) => <StatusBadge status={status} type="arrival" />,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ArrivalList) => (
        <Space>
          {record.status === ArrivalStatus.Arrived && (
            <Button type="primary" size="small" onClick={() => handleInspect(record.id)}>验收</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>到货清单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
          创建到货清单
        </Button>
      </div>

      <Table
        columns={mainColumns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record: ArrivalList) => (
            <Table
              columns={itemColumns(record.id)}
              dataSource={record.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ),
        }}
      />

      <Modal
        title="创建到货清单"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="groupBatchId" label="关联批次" rules={[{ required: true, message: '请选择批次' }]}>
            <Select placeholder="请选择批次">
              {batches.map((b) => (
                <Select.Option key={b.id} value={b.id}>{b.batchNo} - {b.batchName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="arrivalTime" label="到货时间" rules={[{ required: true, message: '请输入到货时间' }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="receiver" label="接收人" rules={[{ required: true, message: '请输入接收人' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ArrivalLists;
