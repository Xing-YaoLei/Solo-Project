import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Button, Typography, Space } from 'antd';
import {
  ShoppingOutlined,
  CarOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { GroupBatch, ExceptionOrder } from '../types';
import { BatchStatus, ArrivalStatus, SettlementStatus, ExceptionResolution } from '../types';
import { getGroupBatches } from '../api/groupBatches';
import { getExceptionOrders } from '../api/exceptionOrders';
import { getSettlementSheets } from '../api/settlementSheets';
import { getArrivalLists } from '../api/arrivalLists';
import StatusBadge from '../components/StatusBadge';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<GroupBatch[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionOrder[]>([]);
  const [stats, setStats] = useState({
    activeBatchCount: 0,
    pendingInspectionCount: 0,
    pendingSettlementCount: 0,
    pendingExceptionCount: 0,
  });

  const fetchData = async () => {
    try {
      const [batchRes, exceptionRes, settlementRes, arrivalRes] = await Promise.all([
        getGroupBatches(),
        getExceptionOrders(),
        getSettlementSheets(),
        getArrivalLists(),
      ]);

      const batchData = batchRes.data.data || [];
      const exceptionData = exceptionRes.data.data || [];
      const settlementData = settlementRes.data.data || [];
      const arrivalData = arrivalRes.data.data || [];

      setBatches(batchData);
      setExceptions(exceptionData);

      setStats({
        activeBatchCount: batchData.filter((b) => b.status === BatchStatus.Open || b.status === BatchStatus.Delivering).length,
        pendingInspectionCount: arrivalData.filter((a) => a.status === ArrivalStatus.Pending || a.status === ArrivalStatus.Arrived).length,
        pendingSettlementCount: settlementData.filter((s) => s.status === SettlementStatus.Pending || s.status === SettlementStatus.Calculating).length,
        pendingExceptionCount: exceptionData.filter((e) => e.resolution === ExceptionResolution.Pending).length,
      });
    } catch {
      // error handled by interceptor
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const batchColumns = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
    { title: '批次名称', dataIndex: 'batchName', key: 'batchName' },
    { title: '团长', dataIndex: 'leaderName', key: 'leaderName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: BatchStatus) => <StatusBadge status={status} type="batch" />,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, __: GroupBatch) => (
        <Button type="link" onClick={() => navigate('/group-batches')}>查看</Button>
      ),
    },
  ];

  const exceptionColumns = [
    { title: '异常单号', dataIndex: 'exceptionNo', key: 'exceptionNo' },
    { title: '类型', dataIndex: 'exceptionType', key: 'exceptionType' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (val: ExceptionOrder['severity']) => <StatusBadge status={val} type="severity" />,
    },
    { title: '影响范围', dataIndex: 'impactDescription', key: 'impactDescription', ellipsis: true },
    { title: '责任归属', dataIndex: 'responsibility', key: 'responsibility' },
    {
      title: '处理结果',
      dataIndex: 'resolution',
      key: 'resolution',
      render: (val: ExceptionOrder['resolution']) => <StatusBadge status={val} type="resolution" />,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" onClick={() => navigate('/exception-orders')}>查看</Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>排程看板</Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/group-batches')}>
            <Statistic title="今日批次" value={stats.activeBatchCount} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/arrival-lists')}>
            <Statistic title="待验收" value={stats.pendingInspectionCount} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/settlement-sheets')}>
            <Statistic title="待结算" value={stats.pendingSettlementCount} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/exception-orders')}>
            <Statistic title="异常单" value={stats.pendingExceptionCount} prefix={<WarningOutlined />} valueStyle={{ color: stats.pendingExceptionCount > 0 ? '#cf1322' : undefined }} />
          </Card>
        </Col>
      </Row>

      <Card title="近期批次">
        <Table
          columns={batchColumns}
          dataSource={batches}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>

      <Card title="待处理异常单">
        <Table
          columns={exceptionColumns}
          dataSource={exceptions.filter((e) => e.resolution === ExceptionResolution.Pending)}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>
    </Space>
  );
};

export default Dashboard;
