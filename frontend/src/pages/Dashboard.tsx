import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, List, Avatar } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { reportApi } from '../services';
import type { DashboardStats, NoShowAppointment } from '../types';
import { getRiskLevelText, getRiskBadgeClass, formatDate, formatCurrency, formatTime } from '../utils/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const noShowColumns = [
    {
      title: '患者姓名',
      dataIndex: 'patientName',
      key: 'patientName',
    },
    {
      title: '联系电话',
      dataIndex: 'patientPhone',
      key: 'patientPhone',
    },
    {
      title: '预约日期',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (date: string, record: NoShowAppointment) =>
        `${formatDate(date)} ${formatTime(record.startTime)}`,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level: number) => (
        <span className={getRiskBadgeClass(level)}>{getRiskLevelText(level)}</span>
      ),
    },
    {
      title: '爽约次数',
      dataIndex: 'patientNoShowCount',
      key: 'patientNoShowCount',
    },
  ];

  return (
    <div>
      <h2 className="page-title">工作台</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日预约"
              value={stats?.todayAppointments || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日已完成"
              value={stats?.todayCompleted || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日爽约"
              value={stats?.todayNoShow || 0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待随访"
              value={stats?.pendingFollowUps || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<PhoneOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="患者总数"
              value={stats?.totalPatients || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="活跃治疗计划"
              value={stats?.activeTreatmentPlans || 0}
              prefix={<FileTextOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日营收"
              value={stats?.todayRevenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="本月复诊率"
              value={stats?.monthlyReAppointmentRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="本周预约趋势" loading={loading}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.weeklyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => formatDate(v).substring(5)} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      const labels: Record<string, string> = {
                        totalAppointments: '总预约',
                        completedAppointments: '已完成',
                        noShowAppointments: '爽约',
                      };
                      return [value, labels[name] || name];
                    }}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAppointments"
                    stroke="#1890ff"
                    name="总预约"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedAppointments"
                    stroke="#52c41a"
                    name="已完成"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="noShowAppointments"
                    stroke="#f5222d"
                    name="爽约"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="高风险爽约患者" loading={loading}>
            <List
              dataSource={stats?.highRiskNoShows?.slice(0, 6) || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <span>
                        {item.patientName}
                        <span
                          className={getRiskBadgeClass(item.riskLevel)}
                          style={{ marginLeft: 8 }}
                        >
                          {getRiskLevelText(item.riskLevel)}
                        </span>
                      </span>
                    }
                    description={
                      <div>
                        <div>{item.patientPhone}</div>
                        <div style={{ marginTop: 4 }}>
                          爽约 {item.patientNoShowCount} 次 · {formatDate(item.appointmentDate)}
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

export default Dashboard;
