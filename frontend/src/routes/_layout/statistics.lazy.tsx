import { createFileRoute } from '@tanstack/react-router';
import {
  Card, Row, Col, Statistic, DatePicker, Tabs, Table, Tag, Button,
  Space, Select, Form, Modal, Descriptions, Progress, Tooltip, App as AntdApp,
} from 'antd';
import {
  DollarOutlined, RiseOutlined, ShoppingCartOutlined,
  BarChartOutlined, PieChartOutlined, FileTextOutlined,
  TeamOutlined, DownloadOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { api } from '../../../api';
import { TicketStatistics, DailyConversion, SecondarySaleStatistics, Ticket, SecondarySale } from '../../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const Typography = require('antd').Typography;
const { Title, Text } = Typography;

export const Route = createFileRoute('/_layout/statistics')({
  component: StatisticsPage,
});

function StatisticsPage() {
  const { message } = AntdApp.useApp();
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState<any>([
    dayjs().subtract(7, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [loading, setLoading] = useState(false);

  const [ticketStats, setTicketStats] = useState<TicketStatistics[]>([]);
  const [conversion, setConversion] = useState<DailyConversion[]>([]);
  const [detailData, setDetailData] = useState<SecondarySaleStatistics[]>([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [ticketList, setTicketList] = useState<Ticket[]>([]);
  const [saleList, setSaleList] = useState<SecondarySale[]>([]);

  const [detailModal, setDetailModal] = useState<SecondarySaleStatistics | null>(null);

  const fetch = () => {
    if (!range || range.length < 2) return;
    setLoading(true);
    const [s, e] = [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')];
    Promise.all([
      api.get<TicketStatistics[]>('/statistics/tickets', { start_date: s, end_date: e }),
      api.get<DailyConversion[]>('/statistics/conversion', { start_date: s, end_date: e }),
      api.get<any>('/statistics/secondary-detail', { start_date: s, end_date: e, page, page_size: pageSize }),
      api.get<any>('/tickets', { page_size: pageSize }),
      api.get<any>('/secondary-sales', { start_date: s, end_date: e, page_size: pageSize }),
    ]).then(([ts, cv, dt, tk, sl]) => {
      setTicketStats(ts.data);
      setConversion(cv.data);
      setDetailData(dt.data.items || []);
      setDetailTotal(dt.data.total || 0);
      setTicketList(tk.data.items || []);
      setSaleList(sl.data.items || []);
    }).finally(() => setLoading(false));
  };

  useEffect(fetch, [range, page, pageSize, tab]);

  const totalTickets = ticketStats.reduce((s, t) => s + t.total_tickets, 0);
  const totalRevenue = ticketStats.reduce((s, t) => s + t.total_revenue, 0);
  const conversionDays = conversion.reduce((s, c) => s + c.ticket_count, 0);
  const conversionRevenue = conversion.reduce((s, c) => s + c.total_revenue, 0);
  const avgConversion = conversionDays > 0
    ? (conversion.reduce((s, c) => s + c.secondary_conversion_rate, 0) / conversion.length).toFixed(4)
    : '0.0000';
  const avgSecondaryPerTicket = conversionDays > 0
    ? (conversion.reduce((s, c) => s + c.secondary_per_ticket, 0) / conversion.length).toFixed(2)
    : '0.00';

  const lineChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['票量', '已核销', '营收(¥)', '二消转化率(%)'] },
    grid: { left: 60, right: 60, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: ticketStats.map((t) => t.date) },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '金额/率', axisLabel: { formatter: (v: number) => v > 1 ? `${v/100}` : `${(v*100).toFixed(0)}%` } },
    ],
    series: [
      { name: '票量', type: 'bar', data: ticketStats.map((t) => t.total_tickets), itemStyle: { color: '#1677ff' } },
      { name: '已核销', type: 'bar', data: ticketStats.map((t) => t.used_tickets), itemStyle: { color: '#52c41a' } },
      {
        name: '营收(¥)', type: 'line', yAxisIndex: 1, smooth: true,
        data: ticketStats.map((t) => t.total_revenue), itemStyle: { color: '#fa8c16' },
      },
      {
        name: '二消转化率(%)', type: 'line', yAxisIndex: 1, smooth: true,
        data: conversion.map((c) => c.secondary_conversion_rate * 100), itemStyle: { color: '#eb2f96' },
      },
    ],
  }), [ticketStats, conversion]);

  const conversionChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['门票营收', '二消营收', '单客二消(¥)', '转化率(%)'] },
    grid: { left: 60, right: 60, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: conversion.map((c) => c.date) },
    yAxis: [
      { type: 'value', name: '金额(¥)' },
      { type: 'value', name: '率(%)', axisLabel: { formatter: '{value}%' } },
    ],
    series: [
      {
        name: '门票营收', type: 'bar', stack: 'total',
        data: conversion.map((c) => c.total_revenue - (c.secondary_per_ticket * c.ticket_count)),
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '二消营收', type: 'bar', stack: 'total',
        data: conversion.map((c) => c.secondary_per_ticket * c.ticket_count),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '单客二消(¥)', type: 'line', yAxisIndex: 0, smooth: true,
        data: conversion.map((c) => c.secondary_per_ticket), itemStyle: { color: '#fa8c16' },
      },
      {
        name: '转化率(%)', type: 'line', yAxisIndex: 1, smooth: true,
        data: conversion.map((c) => (c.secondary_conversion_rate * 100).toFixed(2)),
        itemStyle: { color: '#eb2f96' }, areaStyle: { opacity: 0.1 },
      },
    ],
  }), [conversion]);

  const categoryMap = useMemo(() => {
    const m: Record<string, number> = {};
    saleList.forEach((s) => {
      const cat = s.item_category || '其他';
      m[cat] = (m[cat] || 0) + s.total_amount;
    });
    return m;
  }, [saleList]);

  const pieOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}\n{d}%' },
      data: Object.entries(categoryMap).map(([n, v]) => ({ name: n, value: v })),
    }],
  }), [categoryMap]);

  const detailColumns = [
    {
      title: '票号', dataIndex: 'ticket_no', width: 140,
      render: (v: string, r: SecondarySaleStatistics) => (
        <a onClick={() => setDetailModal(r)} style={{ fontFamily: 'monospace' }}>{v}</a>
      ),
    },
    { title: '购票人', dataIndex: 'buyer_name', width: 100, render: (v: string) => v || '-' },
    { title: '路线', dataIndex: 'route_name', width: 140, render: (v: string) => v || '-' },
    {
      title: '二消次数', dataIndex: 'secondary_count', width: 100,
      render: (v: number) => <Tag color="blue">{v} 次</Tag>,
    },
    {
      title: '二消金额', dataIndex: 'secondary_total', width: 120,
      render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{v.toFixed(2)}</span>,
    },
    {
      title: '明细查看', key: 'view', width: 100,
      render: (_: any, r: SecondarySaleStatistics) => (
        <Button type="link" size="small" onClick={() => setDetailModal(r)}>查看明细</Button>
      ),
    },
  ];

  const exportDetail = () => {
    message.info('正在导出，请稍候...');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>📊 统计分析</Title>
          <Text type="secondary">从二消转化追到具体单据，全链路数据可视化</Text>
        </div>
        <Space>
          <RangePicker
            showTime
            value={range}
            onChange={setRange}
            ranges={{
              '近7天': [dayjs().subtract(7, 'day'), dayjs()],
              '近30天': [dayjs().subtract(30, 'day'), dayjs()],
              '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
            }}
          />
          <Button icon={<SearchOutlined />} type="primary" onClick={fetch}>查询</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="出票总量"
              value={totalTickets}
              prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总营收(门票+二消)"
              value={conversionRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均二消转化率"
              value={avgConversion}
              precision={4}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={parseFloat(avgConversion) * 100}
              showInfo={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="单客二消贡献"
              value={avgSecondaryPerTicket}
              precision={2}
              prefix={<ShoppingCartOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'overview', label: <span><BarChartOutlined /> 整体趋势</span> },
          { key: 'conversion', label: <span><PieChartOutlined /> 二消转化</span> },
          { key: 'detail', label: <span><FileTextOutlined /> 转化明细(追到单据)</span> },
        ]}
      />

      {tab === 'overview' && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="📈 票务+核销+营收趋势" loading={loading}>
            <ReactECharts option={lineChartOption} style={{ height: 400 }} notMerge lazyUpdate />
          </Card>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Card title="📊 每日核销率" loading={loading}>
                <Table
                  rowKey="date"
                  size="small"
                  dataSource={ticketStats}
                  pagination={false}
                  columns={[
                    { title: '日期', dataIndex: 'date', width: 120 },
                    { title: '出票', dataIndex: 'total_tickets', width: 90 },
                    { title: '核销', dataIndex: 'used_tickets', width: 90 },
                    { title: '营收(¥)', dataIndex: 'total_revenue', width: 120, render: (v: number) => `¥${v.toFixed(2)}` },
                    {
                      title: '核销率', key: 'rate',
                      render: (_: any, r: TicketStatistics) => (
                        <Progress percent={Math.round(r.utilization_rate * 100)} size="small" />
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} md={10}>
              <Card title="🥧 二消品类分布" loading={loading}>
                <ReactECharts option={pieOption} style={{ height: 380 }} notMerge />
              </Card>
            </Col>
          </Row>
        </Space>
      )}

      {tab === 'conversion' && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="💹 二消转化趋势（门票营收 vs 二消营收）" loading={loading}>
            <ReactECharts option={conversionChartOption} style={{ height: 420 }} notMerge lazyUpdate />
          </Card>
          <Card title="📋 每日转化明细" loading={loading} extra={<Button icon={<DownloadOutlined />}>导出报表</Button>}>
            <Table
              rowKey="date"
              dataSource={conversion}
              pagination={false}
              size="middle"
              columns={[
                { title: '日期', dataIndex: 'date', width: 120 },
                { title: '购票人次', dataIndex: 'ticket_count', width: 100 },
                {
                  title: '转化率',
                  dataIndex: 'secondary_conversion_rate',
                  width: 180,
                  render: (v: number) => (
                    <Progress percent={Math.round(v * 100)} format={(p) => `${p}%`} size="small" />
                  ),
                },
                {
                  title: '单客二消', dataIndex: 'secondary_per_ticket', width: 120,
                  render: (v: number) => <span style={{ color: '#fa8c16' }}>¥{v.toFixed(2)}</span>,
                },
                {
                  title: '当日总营收', dataIndex: 'total_revenue', width: 140,
                  render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{v.toFixed(2)}</span>,
                },
              ]}
            />
          </Card>
        </Space>
      )}

      {tab === 'detail' && (
        <Card
          title="🔗 二消转化明细（每张票对应的二消记录，可点进查看具体单据）"
          loading={loading}
          extra={
            <Tooltip title="导出全部转化明细（含具体商品）">
              <Button icon={<DownloadOutlined />} onClick={exportDetail}>导出明细</Button>
            </Tooltip>
          }
        >
          <Table
            rowKey="ticket_id"
            dataSource={detailData}
            columns={detailColumns as any}
            pagination={{
              current: page, pageSize, total: detailTotal,
              showSizeChanger: true, showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条转化记录`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}

      <Modal
        title="🔍 具体单据：二消明细"
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={640}
      >
        {detailModal && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="票号">
                <span style={{ fontFamily: 'monospace' }}>{detailModal.ticket_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="购票人">{detailModal.buyer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="路线" span={2}>{detailModal.route_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="二消次数">
                <Tag color="blue">{detailModal.secondary_count} 次</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="二消金额">
                <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{detailModal.secondary_total.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>
            <Title level={5}>具体商品明细</Title>
            <Table
              rowKey="id"
              size="small"
              dataSource={detailModal.items}
              pagination={false}
              columns={[
                { title: '商品', dataIndex: 'item', width: 180 },
                { title: '品类', dataIndex: 'category', width: 100, render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
                { title: '数量', dataIndex: 'qty', width: 80 },
                { title: '单价', dataIndex: 'price', width: 100, render: (v: number) => `¥${v}` },
                { title: '小计', dataIndex: 'total', width: 110, render: (v: number) => <span style={{ color: '#fa8c16' }}>¥{v}</span> },
                { title: '日期', dataIndex: 'at', width: 110 },
              ]}
            />
          </div>
        )}
      </Modal>
    </Space>
  );
}
