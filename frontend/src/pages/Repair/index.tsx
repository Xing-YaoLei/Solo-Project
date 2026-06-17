import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Space, Select, Table, Statistic, Spin, Alert, Tag } from 'antd';
import { ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStore, isAdmin } from '../../store';
import { repairAPI } from '../../services/api';
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
  const [groupBy, setGroupBy] = useState<'date' | 'worker' | 'type'>('date');
  const [caliberVersion, setCaliberVersion] = useState<string | null>(null);
  const [caliberVersions, setCaliberVersions] = useState<CaliberVersion[]>([]);
  const [durationData, setDurationData] = useState<RepairDurationData[]>([]);
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const mockCaliberVersions: CaliberVersion[] = [
    {
      id: '1',
      version: 'v3.0',
      name: '维修时长统计口径 v3.0',
      description: '优化维修时长计算逻辑，排除节假日',
      effectiveDate: '2024-06-01',
      createTime: '2024-05-28 10:00:00',
      creator: 'admin',
      changes: ['排除周末和节假日计算', '优化夜间维修时长统计', '新增维修类型分类'],
    },
    {
      id: '2',
      version: 'v2.1',
      name: '维修时长统计口径 v2.1',
      description: '修复重复工单计算问题',
      effectiveDate: '2024-03-15',
      createTime: '2024-03-10 14:30:00',
      creator: 'admin',
      changes: ['修复重复工单统计bug', '增加工单去重逻辑'],
    },
    {
      id: '3',
      version: 'v2.0',
      name: '维修时长统计口径 v2.0',
      description: '重大更新，支持多维度统计',
      effectiveDate: '2024-01-01',
      createTime: '2023-12-20 09:00:00',
      creator: 'admin',
      changes: ['支持按区域、工人、类型统计', '新增平均时长指标', '优化数据展示'],
    },
  ];

  const mockDurationData: RepairDurationData[] = Array.from({ length: 60 }, (_, i) => ({
    date: `2024-0${Math.floor(i / 15) + 1}-${(i % 28) + 1}`,
    workerName: ['张工', '李工', '王工', '赵工'][i % 4],
    duration: Math.floor(Math.random() * 72) + 2,
    type: ['水电维修', '家电维修', '门窗维修', '墙面维修', '管道疏通'][i % 5],
    status: 'completed',
  }));

  const mockOrders: RepairOrder[] = Array.from({ length: 50 }, (_, i) => ({
    id: `REP${String(i + 1).padStart(6, '0')}`,
    title: ['水管漏水维修', '空调不制冷', '门锁更换', '墙面修补', '马桶疏通'][i % 5],
    type: ['水电维修', '家电维修', '门窗维修', '墙面维修', '管道疏通'][i % 5],
    status: (['pending', 'processing', 'completed', 'cancelled'] as const)[i % 4],
    workerName: ['张工', '李工', '王工', '赵工'][i % 4],
    createTime: `2024-0${Math.floor(i / 10) + 1}-${(i % 28) + 1} 09:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
    completeTime: i % 4 === 2 ? `2024-0${Math.floor(i / 10) + 1}-${(i % 28) + 2} 14:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : undefined,
    duration: i % 4 === 2 ? Math.floor(Math.random() * 48) + 2 : undefined,
    area: ['A区', 'B区', 'C区', 'D区'][i % 4],
    description: '业主报修需要维修处理，请尽快安排。',
  }));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const versions = await repairAPI.getCaliberVersions().catch(() => mockCaliberVersions);
        setCaliberVersions(versions as CaliberVersion[]);

        const params = {
          startDate: dateRange?.[0].format('YYYY-MM-DD'),
          endDate: dateRange?.[1].format('YYYY-MM-DD'),
          caliberVersion: caliberVersion || undefined,
          workerId: isAdmin() ? undefined : user?.id,
          page,
          pageSize,
        };

        const [duration, orderData] = await Promise.all([
          Promise.resolve(mockDurationData),
          Promise.resolve({ 
            list: mockOrders
              .filter(o => isAdmin() || o.workerName === user?.name)
              .slice((page - 1) * pageSize, page * pageSize), 
            total: mockOrders.filter(o => isAdmin() || o.workerName === user?.name).length 
          }),
        ]);

        setDurationData(duration as RepairDurationData[]);
        setOrders(orderData.list);
        setTotal(orderData.total);
      } catch (error) {
        console.error('Failed to fetch repair data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, caliberVersion, page, pageSize, user]);

  const avgDuration = durationData.length > 0
    ? durationData.reduce((sum, item) => sum + item.duration, 0) / durationData.length
    : 0;

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;

  const columns = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 80,
    },
    {
      title: '维修人员',
      dataIndex: 'workerName',
      key: 'workerName',
      width: 100,
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
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '完成时间',
      dataIndex: 'completeTime',
      key: 'completeTime',
      width: 160,
      render: (value: string) => value ? formatDateTime(value) : '-',
    },
    {
      title: '维修时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (value: number) => value ? formatDuration(value) : '-',
      sorter: (a: RepairOrder, b: RepairOrder) => (a.duration || 0) - (b.duration || 0),
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
            { value: 'date', label: '按日期' },
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
            options={caliberVersions.map(v => ({ value: v.version, label: `${v.version} - ${v.name}` }))}
          />
        )}
      </Space>

      {!isAdmin() && (
        <Alert
          message="数据说明"
          description="您当前以工作人员身份登录，仅显示您负责的维修工单。"
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
        title="维修时长趋势"
        bordered={false}
        style={{ marginBottom: 24 }}
        extra={
          <Select
            style={{ width: 120 }}
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { value: 'date', label: '按日期' },
              { value: 'worker', label: '按人员' },
              { value: 'type', label: '按类型' },
            ]}
          />
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <RepairDurationChart
            data={durationData}
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
