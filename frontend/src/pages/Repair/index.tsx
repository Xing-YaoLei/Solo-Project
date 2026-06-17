import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Space, Select, Table, Statistic, Spin, Alert, Tag } from 'antd';
import { ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStore, isAdmin, getCurrentUserId } from '../../store';
import { repairAPI, analyticsAPI } from '../../services/api';
import DateRangePicker from '../../components/common/DateRangePicker';
import StatusBadge from '../../components/common/StatusBadge';
import RepairDurationChart from '../../components/charts/RepairDurationChart';
import { RepairDurationData, RepairOrder, CaliberVersion } from '../../types';
import { formatDuration, formatDate, formatDateTime } from '../../utils/format';
import type { Dayjs } from 'dayjs';

const Repair: React.FC = () => {
  const { user, darkMode } = useStore();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [groupBy, setGroupBy] = useState<'worker' | 'type'>('worker');
  const [caliberVersion, setCaliberVersion] = useState<string | null>(null);
  const [caliberVersions, setCaliberVersions] = useState<CaliberVersion[]>([]);
  const [durationData, setDurationData] = useState<RepairDurationData[]>([]);
  const [filteredDurationData, setFilteredDurationData] = useState<RepairDurationData[]>([]);
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filterDataByUser = (data: RepairDurationData[]): RepairDurationData[] => {
    if (isAdmin()) return data;
    const userId = getCurrentUserId();
    return data.filter(item => item.worker_id === userId);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [versions, duration, orderData] = await Promise.all([
        repairAPI.getCaliberVersions(),
        analyticsAPI.getRepairDuration(),
        repairAPI.getOrders({
          page,
          page_size: pageSize,
          worker_id: isAdmin() ? undefined : getCurrentUserId() || undefined,
        }),
      ]);

      setCaliberVersions(versions as CaliberVersion[]);
      const allDuration = duration as RepairDurationData[];
      setDurationData(allDuration);
      setFilteredDurationData(filterDataByUser(allDuration));

      const orderResult = orderData as { items: RepairOrder[]; total: number; page: number; page_size: number };
      setOrders(orderResult.items);
      setTotal(orderResult.total);
    } catch (error) {
      console.error('Failed to fetch repair data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, caliberVersion, page, pageSize, user]);

  useEffect(() => {
    setFilteredDurationData(filterDataByUser(durationData));
  }, [durationData, user]);

  const avgDuration = filteredDurationData.length > 0
    ? filteredDurationData.reduce((sum, item) => sum + item.avg_duration * item.total_orders, 0) /
      filteredDurationData.reduce((sum, item) => sum + item.total_orders, 0)
    : 0;

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const processingCount = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;

  const columns = [
    {
      title: '工单号',
      dataIndex: 'repair_no',
      key: 'repair_no',
      width: 140,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      render: (value: string, record: RepairOrder) => value || record.repair_type,
    },
    {
      title: '类型',
      dataIndex: 'repair_type',
      key: 'repair_type',
      width: 100,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '维修人员',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 100,
      render: (value: string) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      title: '创建时间',
      dataIndex: 'report_time',
      key: 'report_time',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '完成时间',
      dataIndex: 'complete_time',
      key: 'complete_time',
      width: 160,
      render: (value: string) => value ? formatDateTime(value) : '-',
    },
    {
      title: '维修时长',
      dataIndex: 'duration_hours',
      key: 'duration_hours',
      width: 120,
      render: (value: number) => value ? formatDuration(value) : '-',
      sorter: (a: RepairOrder, b: RepairOrder) => (a.duration_hours || 0) - (b.duration_hours || 0),
    },
    {
      title: '口径版本',
      dataIndex: 'caliber_version',
      key: 'caliber_version',
      width: 100,
      render: (value: string) => value ? <Tag color="purple">{value}</Tag> : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select
          style={{ width: 150 }}
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { value: 'worker', label: '按人员' },
            { value: 'type', label: '按类型' },
          ]}
        />
        {isAdmin() && (
          <Select
            style={{ width: 200 }}
            placeholder="选择口径版本"
            allowClear
            value={caliberVersion}
            onChange={setCaliberVersion}
            options={caliberVersions.map(v => ({ 
              value: v.version, 
              label: `${v.version}${v.description ? ` - ${v.description}` : ''}` 
            }))}
          />
        )}
      </Space>

      {!isAdmin() && (
        <Alert
          message="个人维修视图"
          description={`您当前以工作人员身份登录（${user?.full_name || ''}），仅显示您负责的维修工单。`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {caliberVersion && (
        <Alert
          message={`当前使用口径版本: ${caliberVersion}`}
          description={caliberVersions.find(v => v.version === caliberVersion)?.description}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#1677ff' }} />
                  平均维修时长
                </Space>
              }
              value={avgDuration}
              formatter={(value) => formatDuration(Number(value))}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已完成工单"
              value={completedCount}
              suffix="单"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="处理中工单"
              value={processingCount}
              suffix="单"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={isAdmin() ? "维修时长统计（管理层总览）" : "我的维修时长"}
        bordered={false}
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Select
              style={{ width: 120 }}
              value={groupBy}
              onChange={setGroupBy}
              options={[
                { value: 'worker', label: '按人员' },
                { value: 'type', label: '按类型' },
              ]}
            />
            <ReloadOutlined spin={loading} onClick={fetchData} style={{ cursor: 'pointer' }} />
          </Space>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <RepairDurationChart
            data={filteredDurationData}
            groupBy={groupBy}
            darkMode={darkMode}
          />
        )}
      </Card>

      <Card title="维修工单列表" bordered={false}>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 1300 }}
        />
      </Card>
    </div>
  );
};

export default Repair;
