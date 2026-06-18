import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Card, Row, Col, Statistic, Table, Tag, Select, DatePicker, Space,
} from 'antd';
import {
  OrderedListOutlined, CheckCircleOutlined, WarningOutlined,
  ClockCircleOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { statisticsApi } from '../lib/api';
import type { OrderStatusDistribution, TechnicianPerformance } from '../lib/types';

const { RangePicker } = DatePicker;

const statusLabels: Record<string, string> = {
  pending: '待分配',
  confirmed: '已确认',
  in_progress: '进行中',
  waiting_parts: '待料',
  in_inspection: '质检中',
  completed: '已完成',
  closed: '已关闭',
  rework: '返工',
};

export default function StatisticsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<string>('month');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data: overview } = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => statisticsApi.getOverview().then((r) => r.data),
  });

  const { data: reworkRate } = useQuery({
    queryKey: ['statistics', 'rework-rate', period, dateRange],
    queryFn: () =>
      statisticsApi
        .getReworkRate({
          period,
          start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
          end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        })
        .then((r) => r.data),
  });

  const { data: orderDistribution } = useQuery({
    queryKey: ['statistics', 'order-distribution'],
    queryFn: () => statisticsApi.getStatusDistribution().then((r) => r.data),
  });

  const { data: technicianPerformance } = useQuery({
    queryKey: ['statistics', 'technician-performance'],
    queryFn: () => statisticsApi.getTechnicianPerformance().then((r) => r.data),
  });

  const { data: partsUsage } = useQuery({
    queryKey: ['statistics', 'parts-usage', dateRange],
    queryFn: () =>
      statisticsApi
        .getPartsUsage({
          start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
          end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        })
        .then((r) => r.data),
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 120 }}
          options={[
            { value: 'week', label: '按周' },
            { value: 'month', label: '按月' },
            { value: 'quarter', label: '按季' },
          ]}
        />
        <RangePicker value={dateRange} onChange={setDateRange} />
      </Space>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总工单"
              value={overview?.total_orders ?? 0}
              prefix={<OrderedListOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="本月完成"
              value={overview?.completed_this_month ?? 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理缺件"
              value={overview?.pending_shortages ?? 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="返工率"
              value={overview?.rework_rate ?? 0}
              suffix="%"
              prefix={<WarningOutlined />}
              valueStyle={{ color: (overview?.rework_rate ?? 0) > 5 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均完成(小时)"
              value={overview?.avg_completion_hours ?? 0}
              suffix="h"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中"
              value={overview?.active_orders ?? 0}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="返工率趋势" bordered={false} extra={<Tag color="blue">可点击行查看工单</Tag>}>
            <Table
              rowKey="period"
              size="small"
              dataSource={reworkRate ?? []}
              pagination={false}
              onRow={(record) => ({
                onClick: () => {
                  if (record.rework_orders > 0) {
                    navigate({
                      to: '/work-orders',
                      search: { status: 'rework' },
                    });
                  }
                },
                style: { cursor: record.rework_orders > 0 ? 'pointer' : 'default' },
              })}
              columns={[
                { title: '周期', dataIndex: 'period', key: 'period' },
                { title: '总工单', dataIndex: 'total_orders', key: 'total_orders' },
                { title: '返工数', dataIndex: 'rework_orders', key: 'rework_orders' },
                {
                  title: '返工率',
                  dataIndex: 'rework_rate',
                  key: 'rework_rate',
                  render: (v: number) => (
                    <Space>
                      <span style={{ color: v > 5 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
                        {v.toFixed(1)}%
                      </span>
                      {v > 0 && <ArrowRightOutlined style={{ fontSize: 12, color: '#1890ff' }} />}
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="工单状态分布" bordered={false}>
            <Table
              rowKey="status"
              size="small"
              dataSource={orderDistribution ?? []}
              pagination={false}
              columns={[
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (v: string) => statusLabels[v] ?? v,
                },
                { title: '数量', dataIndex: 'count', key: 'count' },
                {
                  title: '占比',
                  key: 'ratio',
                  render: (_: unknown, record: OrderStatusDistribution) => {
                    const total = (orderDistribution ?? []).reduce((s: number, d: OrderStatusDistribution) => s + d.count, 0);
                    const pct = total > 0 ? ((record.count / total) * 100).toFixed(1) : '0';
                    return `${pct}%`;
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="技师绩效" bordered={false}>
            <Table
              rowKey="technician_id"
              size="small"
              dataSource={technicianPerformance ?? []}
              pagination={false}
              columns={[
                { title: '技师', dataIndex: 'technician_name', key: 'technician_name' },
                { title: '完成数', dataIndex: 'completed_orders', key: 'completed_orders' },
                { title: '返工数', dataIndex: 'rework_count', key: 'rework_count' },
                {
                  title: '返工率',
                  key: 'rework_rate',
                  render: (_: unknown, record: TechnicianPerformance) => {
                    const rate = record.completed_orders > 0
                      ? (record.rework_count / record.completed_orders) * 100
                      : 0;
                    return (
                      <span style={{ color: rate > 5 ? '#ff4d4f' : '#52c41a' }}>{rate.toFixed(1)}%</span>
                    );
                  },
                },
                {
                  title: '平均完成(小时)',
                  dataIndex: 'avg_completion_hours',
                  key: 'avg_completion_hours',
                  render: (v: number) => `${(v ?? 0).toFixed(1)}h`,
                },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="配件使用统计" bordered={false}>
            <Table
              rowKey="part_id"
              size="small"
              dataSource={partsUsage ?? []}
              pagination={false}
              columns={[
                { title: '配件编号', dataIndex: 'part_no', key: 'part_no' },
                { title: '名称', dataIndex: 'part_name', key: 'part_name' },
                { title: '使用量', dataIndex: 'total_used', key: 'total_used' },
                {
                  title: '总金额',
                  dataIndex: 'total_amount',
                  key: 'total_amount',
                  render: (v: number) => `¥${(v ?? 0).toFixed(2)}`,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
