import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Table,
  Tag,
  List,
  Avatar,
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { reportApi } from '../services';
import type { ReAppointmentTrend, AppointmentRate, NoShowAppointment } from '../types';
import {
  formatDate,
  getRiskLevelText,
  getRiskBadgeClass,
  formatTime,
} from '../utils/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [trendData, setTrendData] = useState<ReAppointmentTrend[]>([]);
  const [rateData, setRateData] = useState<AppointmentRate[]>([]);
  const [highRiskNoShows, setHighRiskNoShows] = useState<NoShowAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    loadReportData();
  }, [months]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [trendRes, noShowsRes] = await Promise.all([
        reportApi.getReAppointmentTrend(months),
        reportApi.getHighRiskNoShows(10),
      ]);
      setTrendData(trendRes.data);
      setHighRiskNoShows(noShowsRes.data);

      if (trendRes.data.length > 0) {
        const startDate = trendRes.data[0].startDate;
        const endDate = trendRes.data[trendRes.data.length - 1].endDate;
        const ratesRes = await reportApi.getAppointmentRates(startDate, endDate);
        setRateData(ratesRes.data);
      }
    } catch (error) {
      console.error('加载报表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPatients = trendData.reduce((sum, item) => sum + item.totalPatients, 0);
  const totalReAppointment = trendData.reduce((sum, item) => sum + item.reAppointmentPatients, 0);
  const avgReAppointmentRate = trendData.length > 0
    ? (trendData.reduce((sum, item) => sum + item.reAppointmentRate, 0) / trendData.length) * 100
    : 0;

  const pieData = [
    { name: '复诊患者', value: totalReAppointment },
    { name: '初诊患者', value: totalPatients - totalReAppointment },
  ];

  const COLORS = ['#1890ff', '#52c41a'];

  const trendColumns = [
    {
      title: '月份',
      dataIndex: 'period',
      key: 'period',
      width: 120,
    },
    {
      title: '总就诊人数',
      dataIndex: 'totalPatients',
      key: 'totalPatients',
    },
    {
      title: '复诊人数',
      dataIndex: 'reAppointmentPatients',
      key: 'reAppointmentPatients',
      render: (val: number) => <span style={{ color: '#52c41a' }}>{val}</span>,
    },
    {
      title: '初诊人数',
      dataIndex: 'newPatients',
      key: 'newPatients',
      render: (val: number) => <span style={{ color: '#1890ff' }}>{val}</span>,
    },
    {
      title: '复诊率',
      dataIndex: 'reAppointmentRate',
      key: 'reAppointmentRate',
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate >= 0.5 ? '#52c41a' : '#faad14' }}>
          {(rate * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      title: '总预约次数',
      dataIndex: 'totalAppointments',
      key: 'totalAppointments',
    },
  ];

  return (
    <div>
      <h2 className="page-title">复诊率趋势</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均复诊率"
              value={avgReAppointmentRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总就诊人数"
              value={totalPatients}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="复诊患者数"
              value={totalReAppointment}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ marginBottom: 8, color: '#666' }}>统计周期</div>
            <Select
              value={months}
              onChange={setMonths}
              style={{ width: '100%' }}
            >
              <Option value={3}>近3个月</Option>
              <Option value={6}>近6个月</Option>
              <Option value={12}>近12个月</Option>
            </Select>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="复诊率趋势图" loading={loading}>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      const labels: Record<string, string> = {
                        totalPatients: '总就诊人数',
                        reAppointmentPatients: '复诊人数',
                        newPatients: '初诊人数',
                        reAppointmentRate: '复诊率',
                      };
                      if (name === 'reAppointmentRate') {
                        return [`${(value * 100).toFixed(1)}%`, labels[name]];
                      }
                      return [value, labels[name]];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalPatients"
                    stroke="#1890ff"
                    name="总就诊人数"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="reAppointmentPatients"
                    stroke="#52c41a"
                    name="复诊人数"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="reAppointmentRate"
                    stroke="#faad14"
                    name="复诊率"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="患者构成分析" loading={loading}>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="月度复诊率明细" loading={loading}>
            <Table
              columns={trendColumns}
              dataSource={trendData}
              rowKey="period"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="高风险爽约患者 TOP10" loading={loading}>
            <List
              dataSource={highRiskNoShows}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small" icon={<UserOutlined />} />}
                    title={
                      <span>
                        {item.patientName}
                        <span
                          className={getRiskBadgeClass(item.riskLevel)}
                          style={{ marginLeft: 8, fontSize: 11 }}
                        >
                          {getRiskLevelText(item.riskLevel)}
                        </span>
                      </span>
                    }
                    description={
                      <div style={{ fontSize: 12 }}>
                        <div>{item.patientPhone}</div>
                        <div style={{ color: '#f5222d' }}>
                          爽约 {item.patientNoShowCount} 次
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
