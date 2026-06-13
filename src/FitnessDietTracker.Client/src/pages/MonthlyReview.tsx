import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Empty,
  message,
  Space,
  Tag,
  Table,
  Progress
} from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import { reportApi, authApi } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import type { User, MonthlyReview } from '../types';

const { MonthPicker } = DatePicker;

const MonthlyReview = () => {
  const { user, isCoach } = useAuthStore();
  const [clients, setClients] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [month, setMonth] = useState<dayjs.Dayjs>(dayjs());
  const [review, setReview] = useState<MonthlyReview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (isCoach()) {
        authApi.getClients(user.id).then((list) => {
          setClients(list);
          if (list.length > 0) setSelectedUserId(list[0].id);
        });
      } else {
        setSelectedUserId(user.id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedUserId && month) loadReview();
  }, [selectedUserId, month]);

  const loadReview = async () => {
    if (!selectedUserId || !month) return;
    setLoading(true);
    try {
      const data = await reportApi.monthlyReview(selectedUserId, month.year(), month.month() + 1);
      setReview(data);
    } catch {
      message.error('加载复盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  const chartData = review?.monthlyMeasurements
    .slice()
    .sort((a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime())
    .map((m) => ({
      date: dayjs(m.measureDate).format('MM-DD'),
      体重: m.weight,
      体脂率: m.bodyFatPercentage,
      肌肉量: m.muscleMass ?? 0
    }));

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '体重(kg)', dataIndex: 'weight', key: 'weight' },
    { title: '体脂率(%)', dataIndex: 'bodyFatPercentage', key: 'bodyFatPercentage' },
    {
      title: '肌肉量(kg)',
      dataIndex: 'muscleMass',
      key: 'muscleMass',
      render: (v: number) => v ?? '-'
    },
    { title: 'BMI', dataIndex: 'bmi', key: 'bmi', render: (v: number) => v ?? '-' },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (v: string) => v || '-' }
  ];

  const tableData = review?.monthlyMeasurements
    .slice()
    .sort((a, b) => new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime())
    .map((m) => ({
      key: m.id,
      date: dayjs(m.measureDate).format('YYYY-MM-DD'),
      weight: m.weight,
      bodyFatPercentage: m.bodyFatPercentage,
      muscleMass: m.muscleMass,
      bmi: m.bmi,
      notes: m.notes
    }));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          {isCoach() && (
            <Select
              style={{ width: 180 }}
              placeholder="选择学员"
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={clients.map((c) => ({ label: c.userName, value: c.id }))}
            />
          )}
          <MonthPicker
            value={month}
            onChange={(v) => v && setMonth(v)}
            allowClear={false}
          />
        </Space>
      </Card>

      {loading ? (
        <Card loading />
      ) : !review ? (
        <Card>
          <Empty />
        </Card>
      ) : (
        <>
          <Card title={`${month.format('YYYY年MM月')} 复盘 · ${review.userName}`} style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card className="stat-card" size="small">
                  <div
                    className={`stat-value ${
                      review.bodyFatChange.change < 0 ? 'diff-positive' : 'diff-negative'
                    }`}
                  >
                    {review.bodyFatChange.change > 0 ? '+' : ''}
                    {review.bodyFatChange.change.toFixed(1)}%
                  </div>
                  <div className="stat-label">
                    体脂变化
                    {review.bodyFatChange.change < 0 ? (
                      <ArrowDownOutlined style={{ color: '#52c41a', marginLeft: 4 }} />
                    ) : (
                      <ArrowUpOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card" size="small">
                  <div className="stat-value">
                    {review.bodyFatChange.endBodyFat.toFixed(1)}%
                  </div>
                  <div className="stat-label">当前体脂率</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card" size="small">
                  <div
                    className={`stat-value ${
                      review.bodyFatChange.weightChange < 0 ? 'diff-positive' : 'diff-negative'
                    }`}
                  >
                    {review.bodyFatChange.weightChange > 0 ? '+' : ''}
                    {review.bodyFatChange.weightChange.toFixed(1)}kg
                  </div>
                  <div className="stat-label">体重变化</div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card" size="small">
                  <div className="stat-value">
                    {review.adherenceRate.toFixed(0)}%
                  </div>
                  <div className="stat-label">打卡率</div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col sm={12}>
                <Space size={16}>
                  <Tag color="green">打卡 {review.checkInCount} 天</Tag>
                  <Tag color="red">中断 {review.missedDays} 天</Tag>
                </Space>
                <Progress
                  percent={Math.round(review.adherenceRate)}
                  showInfo={false}
                  style={{ marginTop: 12 }}
                />
              </Col>
              <Col sm={12}>
                <Space size={16}>
                  <span>
                    初始体脂: <strong>{review.bodyFatChange.startBodyFat}%</strong>
                  </span>
                  <span>
                    → 当前体脂: <strong>{review.bodyFatChange.endBodyFat}%</strong>
                  </span>
                  <span>
                    变化率:{' '}
                    <strong
                      className={
                        review.bodyFatChange.changePercentage < 0 ? 'diff-positive' : 'diff-negative'
                      }
                    >
                      {review.bodyFatChange.changePercentage > 0 ? '+' : ''}
                      {review.bodyFatChange.changePercentage.toFixed(1)}%
                    </strong>
                  </span>
                </Space>
              </Col>
            </Row>
          </Card>

          {chartData && chartData.length > 0 && (
            <Card title="体脂与体重趋势" style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="体脂率"
                    stroke="#ff4d4f"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="体重"
                    stroke="#1677ff"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  {chartData.some((d) => d.肌肉量 > 0) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="肌肉量"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card title="本月体测明细">
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default MonthlyReview;
