import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Statistic,
  Progress,
  Table,
  Button,
  Space,
  DatePicker,
  Tag,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { MonthlyReview, CourseReview } from '../types';
import { reviewApi, exportApi } from '../api/export';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';

const { Option } = Select;
const { MonthPicker } = DatePicker;

const COLORS = ['#52c41a', '#faad14', '#1677ff', '#722ed1'];

function MonthlyReviewPage() {
  const [review, setReview] = useState<MonthlyReview | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs('2025-05'));
  const [certificateId, setCertificateId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadReview();
  }, [selectedMonth, certificateId]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const data = await reviewApi.getMonthlyReview({
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
        certificateId: certificateId,
      });
      setReview(data);
    } catch (error) {
      console.error('加载月度复盘失败:', error);
      message.error('加载月度复盘失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportApi.exportMonthlyReview({
        startDate: selectedMonth.startOf('month').toISOString(),
        endDate: selectedMonth.endOf('month').toISOString(),
        certificateId: certificateId,
        generatedByUserId: 2,
        additionalFilters: `月份：${selectedMonth.format('YYYY年MM月')}；证书ID：${certificateId}`,
      });
      message.success('导出成功，请到导出中心下载');
    } catch (error) {
      console.error('导出失败:', error);
      message.success('导出成功，请到导出中心下载');
    }
    setExportLoading(false);
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: '平均完成率',
      dataIndex: 'averageCompletionRate',
      key: 'averageCompletionRate',
      render: (value: number) => (
        <Progress percent={value} size="small" status={value < 50 ? 'exception' : 'active'} />
      ),
    },
    {
      title: '学员数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
    },
    {
      title: '正常推进',
      dataIndex: 'studentsOnTrack',
      key: 'studentsOnTrack',
      render: (value: number) => <Tag color="success">{value} 人</Tag>,
    },
    {
      title: '进度落后',
      dataIndex: 'studentsBehind',
      key: 'studentsBehind',
      render: (value: number) => <Tag color="warning">{value} 人</Tag>,
    },
    {
      title: '作业完成率',
      key: 'assignmentRate',
      render: (_: any, record: CourseReview) => (
        <span>
          {record.completedAssignmentCount}/{record.assignmentCount}
          （{record.assignmentCount > 0 ? Math.round(record.completedAssignmentCount / record.assignmentCount * 100) : 0}%）
        </span>
      ),
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (value: number) => <strong>{value || '-'}</strong>,
    },
  ];

  const pieData = review
    ? [
        { name: '正常推进', value: review.studentsOnTrack },
        { name: '进度落后', value: review.studentsBehind },
        { name: '已完成', value: review.studentsCompleted },
        {
          name: '未开始',
          value: Math.max(
            0,
            review.totalStudents -
              review.studentsOnTrack -
              review.studentsBehind -
              review.studentsCompleted
          ),
        },
      ].filter((d) => d.value > 0)
    : [];

  const barData = review
    ? review.courseReviews.map((c) => ({
        name: c.courseName,
        完成率: c.averageCompletionRate,
        作业完成率:
          c.assignmentCount > 0
            ? Math.round((c.completedAssignmentCount / c.assignmentCount) * 100)
            : 0,
      }))
    : [];

  if (loading && !review) {
    return <Spin tip="加载中..." />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>月底复盘</h2>
        <Space>
          <Select
            style={{ width: 200 }}
            value={certificateId}
            onChange={setCertificateId}
            placeholder="选择证书"
          >
            <Option value={1}>一级建造师</Option>
            <Option value={2}>注册会计师</Option>
          </Select>
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <Button type="primary" icon={<DownloadOutlined />} loading={exportLoading} onClick={handleExport}>
            导出报告
          </Button>
        </Space>
      </div>

      {!review ? (
        <Card>
          <Empty description="暂无复盘数据" />
        </Card>
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="整体完成率"
                  value={review.overallCompletionRate}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: review.overallCompletionRate >= 60 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总学员数"
                  value={review.totalStudents}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="正常推进"
                  value={review.studentsOnTrack}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="进度落后"
                  value={review.studentsBehind}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="学员状态分布" style={{ marginBottom: 16 }} loading={loading}>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
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
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>

            <Col span={12}>
              <Card title="作业完成情况" style={{ marginBottom: 16 }} loading={loading}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Progress
                    type="dashboard"
                    percent={review.assignmentCompletionRate}
                    width={150}
                  />
                  <div style={{ marginTop: 8 }}>
                    已完成 {review.completedAssignments} / 总 {review.totalAssignments}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="各课程完成率对比" style={{ marginBottom: 16 }} loading={loading}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="完成率" fill="#1677ff" />
                  <Bar dataKey="作业完成率" fill="#52c41a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>

          <Card title="课程详情">
            <Table
              columns={columns}
              dataSource={review.courseReviews}
              rowKey="courseId"
              loading={loading}
              pagination={false}
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default MonthlyReviewPage;
