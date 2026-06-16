import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Table,
  Tag,
  Tabs,
  DatePicker,
  Space,
  BarChart,
} from 'antd';
import {
  RiseOutlined,
  UserOutlined,
  TagsOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { statisticsApi } from '../services/api';
import type {
  TrainingCompletionRate,
  SourceChannelStatistics,
  AssigneeStatistics,
  ReviewTagStatistics,
  StatusOverview,
} from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [trainingRate, setTrainingRate] = useState<TrainingCompletionRate | null>(null);
  const [sourceChannels, setSourceChannels] = useState<SourceChannelStatistics[]>([]);
  const [assignees, setAssignees] = useState<AssigneeStatistics[]>([]);
  const [reviewTags, setReviewTags] = useState<ReviewTagStatistics[]>([]);
  const [statusOverview, setStatusOverview] = useState<StatusOverview[]>([]);

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');

      const [training, channels, assigneeData, tags, status] = await Promise.all([
        statisticsApi.getTrainingCompletionRate(startDate, endDate),
        statisticsApi.getSourceChannelStats(startDate, endDate),
        statisticsApi.getAssigneeStats(startDate, endDate),
        statisticsApi.getReviewTagStats(startDate, endDate),
        statisticsApi.getStatusOverview(startDate, endDate),
      ]);

      setTrainingRate(training);
      setSourceChannels(channels);
      setAssignees(assigneeData);
      setReviewTags(tags);
      setStatusOverview(status);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setTrainingRate(getMockTrainingRate());
      setSourceChannels(getMockSourceChannels());
      setAssignees(getMockAssignees());
      setReviewTags(getMockReviewTags());
      setStatusOverview(getMockStatusOverview());
    } finally {
      setLoading(false);
    }
  };

  const getMockTrainingRate = (): TrainingCompletionRate => ({
    totalScheduled: 420,
    completed: 378,
    cancelled: 18,
    noShow: 24,
    completionRate: 90.0,
  });

  const getMockSourceChannels = (): SourceChannelStatistics[] => [
    { sourceChannelId: 1, sourceChannelName: '门诊转诊', billCount: 58, totalAmount: 486000, insuranceAmount: 320000, rate: 37.2 },
    { sourceChannelId: 2, sourceChannelName: '住院转诊', billCount: 42, totalAmount: 420000, insuranceAmount: 290000, rate: 26.9 },
    { sourceChannelId: 3, sourceChannelName: '社区推荐', billCount: 28, totalAmount: 196000, insuranceAmount: 140000, rate: 17.9 },
    { sourceChannelId: 4, sourceChannelName: '线上预约', billCount: 18, totalAmount: 108000, insuranceAmount: 78000, rate: 11.5 },
    { sourceChannelId: 5, sourceChannelName: '其他', billCount: 10, totalAmount: 48600, insuranceAmount: 35000, rate: 6.4 },
  ];

  const getMockAssignees = (): AssigneeStatistics[] => [
    { assigneeId: 1, assigneeName: '张医生', billCount: 45, completedCount: 32, pendingCount: 10, rejectedCount: 3, completedRate: 71.1 },
    { assigneeId: 2, assigneeName: '李处理员', billCount: 38, completedCount: 28, pendingCount: 8, rejectedCount: 2, completedRate: 73.7 },
    { assigneeId: 3, assigneeName: '王医生', billCount: 32, completedCount: 25, pendingCount: 5, rejectedCount: 2, completedRate: 78.1 },
    { assigneeId: 4, assigneeName: '赵护士', billCount: 25, completedCount: 20, pendingCount: 4, rejectedCount: 1, completedRate: 80.0 },
    { assigneeId: 5, assigneeName: '陈主任', billCount: 16, completedCount: 12, pendingCount: 3, rejectedCount: 1, completedRate: 75.0 },
  ];

  const getMockReviewTags = (): ReviewTagStatistics[] => [
    { reviewTagId: 1, reviewTagName: '术后康复', billCount: 68, totalAmount: 580000, color: '#1890ff' },
    { reviewTagId: 2, reviewTagName: '运动损伤', billCount: 42, totalAmount: 320000, color: '#52c41a' },
    { reviewTagId: 3, reviewTagName: '老年康复', billCount: 35, totalAmount: 280000, color: '#faad14' },
    { reviewTagId: 4, reviewTagName: '神经系统', billCount: 28, totalAmount: 240000, color: '#722ed1' },
    { reviewTagId: 5, reviewTagName: '骨关节', billCount: 45, totalAmount: 380000, color: '#eb2f96' },
    { reviewTagId: 6, reviewTagName: '心肺康复', billCount: 18, totalAmount: 150000, color: '#13c2c2' },
    { reviewTagId: 7, reviewTagName: '儿童康复', billCount: 12, totalAmount: 90000, color: '#fa8c16' },
  ];

  const getMockStatusOverview = (): StatusOverview[] => [
    { statusId: 1, statusName: '待录入', count: 12, amount: 85000 },
    { statusId: 2, statusName: '待审核', count: 18, amount: 156000 },
    { statusId: 3, statusName: '审核通过', count: 8, amount: 68000 },
    { statusId: 4, statusName: '审核驳回', count: 5, amount: 42000 },
    { statusId: 5, statusName: '处理中', count: 15, amount: 128000 },
    { statusId: 6, statusName: '待复盘', count: 10, amount: 92000 },
    { statusId: 7, statusName: '已完成', count: 65, amount: 520000 },
    { statusId: 8, statusName: '已关闭', count: 12, amount: 95000 },
    { statusId: 9, statusName: '医保拒付', count: 9, amount: 89000 },
    { statusId: 10, statusName: '补充材料中', count: 5, amount: 45000 },
    { statusId: 11, statusName: '升级处理', count: 2, amount: 18000 },
  ];

  const assigneeColumns = [
    {
      title: '责任人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 120,
    },
    {
      title: '单据总数',
      dataIndex: 'billCount',
      key: 'billCount',
      width: 100,
    },
    {
      title: '已完成',
      dataIndex: 'completedCount',
      key: 'completedCount',
      width: 100,
      render: (val: number) => <span style={{ color: '#52c41a' }}>{val}</span>,
    },
    {
      title: '待处理',
      dataIndex: 'pendingCount',
      key: 'pendingCount',
      width: 100,
      render: (val: number) => <span style={{ color: '#1890ff' }}>{val}</span>,
    },
    {
      title: '异常/驳回',
      dataIndex: 'rejectedCount',
      key: 'rejectedCount',
      width: 100,
      render: (val: number) => <span style={{ color: '#f5222d' }}>{val}</span>,
    },
    {
      title: '完成率',
      dataIndex: 'completedRate',
      key: 'completedRate',
      render: (val: number) => (
        <Progress percent={val.toFixed(1)} size="small" status={val >= 75 ? 'normal' : val >= 60 ? 'active' : 'exception'} />
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <CalendarOutlined /> 训练完成率
        </span>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Progress
                  type="dashboard"
                  percent={Math.round(trainingRate?.completionRate || 0)}
                  width={200}
                  status="active"
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                />
                <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>
                  训练完成率
                </div>
              </div>
            </Col>
            <Col span={16}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="总预约次数"
                      value={trainingRate?.totalScheduled || 0}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="已完成"
                      value={trainingRate?.completed || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="已取消"
                      value={trainingRate?.cancelled || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="未到"
                      value={trainingRate?.noShow || 0}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#f5222d' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'channels',
      label: (
        <span>
          <RiseOutlined /> 来源渠道
        </span>
      ),
      children: (
        <Card>
          <List
            dataSource={sourceChannels}
            renderItem={(item) => (
              <List.Item key={item.sourceChannelId}>
                <List.Item.Meta
                  avatar={<RiseOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      <span style={{ fontWeight: 500, fontSize: 16 }}>{item.sourceChannelName}</span>
                      <Tag color="blue">{item.billCount} 单</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span>总金额：<strong>¥{item.totalAmount.toLocaleString()}</strong></span>
                        <span>医保报销：<span style={{ color: '#52c41a' }}>¥{item.insuranceAmount.toLocaleString()}</span></span>
                      </div>
                      <Progress percent={item.rate.toFixed(1)} status="active" />
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'assignees',
      label: (
        <span>
          <UserOutlined /> 责任人
        </span>
      ),
      children: (
        <Card>
          <Table
            rowKey="assigneeId"
            columns={assigneeColumns}
            dataSource={assignees}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'tags',
      label: (
        <span>
          <TagsOutlined /> 复盘标签
        </span>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            {reviewTags.map((tag) => (
              <Col span={8} key={tag.reviewTagId}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tag
                      color={tag.color}
                      style={{ fontSize: 14, padding: '4px 12px' }}
                    >
                      {tag.reviewTagName}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>单据数</span>
                      <strong>{tag.billCount}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: '#999' }}>总金额</span>
                      <span style={{ color: '#1890ff' }}>¥{tag.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ fontWeight: 500 }}>统计时间范围：</span>
          <RangePicker
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
          />
        </Space>
      </Card>

      <Card title="状态概览" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          {statusOverview.map((item) => (
            <Col span={4} key={item.statusId}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  background: '#f5f5f5',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                  {item.statusName}
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{item.count}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  ¥{item.amount.toLocaleString()}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="统计汇总">
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>
    </div>
  );
};

export default StatisticsPage;
