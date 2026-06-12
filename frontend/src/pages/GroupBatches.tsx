import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, Drawer, Typography, Space, message } from 'antd';
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { GroupBatch, StatusChangeLog, LeaderTier } from '../types';
import { BatchStatus } from '../types';
import { getGroupBatches, createGroupBatch, openBatch, closeBatch, deliverBatch, getBatchStatusHistory } from '../api/groupBatches';
import { getLeaderTiers } from '../api/leaderTiers';
import StatusBadge from '../components/StatusBadge';

const { Title } = Typography;

const GroupBatches: React.FC = () => {
  const [data, setData] = useState<GroupBatch[]>([]);
  const [leaderTiers, setLeaderTiers] = useState<LeaderTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyData, setHistoryData] = useState<StatusChangeLog[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchRes, tierRes] = await Promise.all([getGroupBatches(), getLeaderTiers()]);
      setData(batchRes.data.data || []);
      setLeaderTiers(tierRes.data.data || []);
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
      await createGroupBatch(values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      // validation error
    }
  };

  const handleOpen = async (id: number) => {
    try {
      await openBatch(id);
      message.success('开团成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleClose = async (id: number) => {
    try {
      await closeBatch(id);
      message.success('截单成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleDeliver = async (id: number) => {
    try {
      await deliverBatch(id);
      message.success('配送状态更新成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleViewHistory = async (id: number) => {
    try {
      const res = await getBatchStatusHistory(id);
      setHistoryData(res.data.data || []);
      setDrawerOpen(true);
    } catch {
      // handled
    }
  };

  const columns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
    { title: '批次名称', dataIndex: 'batchName', key: 'batchName' },
    { title: '团长', dataIndex: 'leaderName', key: 'leaderName' },
    { title: '团长等级', dataIndex: 'leaderTierName', key: 'leaderTierName' },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '配送时间',
      dataIndex: 'deliveryTime',
      key: 'deliveryTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: BatchStatus) => <StatusBadge status={status} type="batch" />,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: GroupBatch) => (
        <Space>
          {record.status === BatchStatus.Draft && (
            <Button type="primary" size="small" onClick={() => handleOpen(record.id)}>开团</Button>
          )}
          {record.status === BatchStatus.Open && (
            <Button type="primary" size="small" onClick={() => handleClose(record.id)}>截单</Button>
          )}
          {record.status === BatchStatus.Closed && (
            <Button type="primary" size="small" onClick={() => handleDeliver(record.id)}>配送中</Button>
          )}
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record.id)}>历史</Button>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '变更时间',
      dataIndex: 'changedAt',
      key: 'changedAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '原状态', dataIndex: 'fromStatus', key: 'fromStatus' },
    { title: '新状态', dataIndex: 'toStatus', key: 'toStatus' },
    { title: '操作人', dataIndex: 'changedBy', key: 'changedBy' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>团购批次管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
          创建批次
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="创建批次"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="batchName" label="批次名称" rules={[{ required: true, message: '请输入批次名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="leaderName" label="团长" rules={[{ required: true, message: '请输入团长名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="leaderPhone" label="团长电话">
            <Input />
          </Form.Item>
          <Form.Item name="leaderTierId" label="团长等级" rules={[{ required: true, message: '请选择团长等级' }]}>
            <Select>
              {leaderTiers.map((t) => (
                <Select.Option key={t.id} value={t.id}>{t.tierName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="startTime" label="开始时间" rules={[{ required: true, message: '请输入开始时间' }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="endTime" label="结束时间" rules={[{ required: true, message: '请输入结束时间' }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="deliveryTime" label="配送时间">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="状态变更历史"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={700}
      >
        <Table
          columns={historyColumns}
          dataSource={historyData}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Drawer>
    </Space>
  );
};

export default GroupBatches;
