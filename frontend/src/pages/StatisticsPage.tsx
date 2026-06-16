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
  const [, setLoading] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

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
        <Progress percent={Number(val.toFixed(1))} size="small" status={val >= 75 ? 'normal' : val >= 60 ? 'active' : 'exception'} />
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
                      <Progress percent={Number(item.rate.toFixed(1))} status="active" />
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
