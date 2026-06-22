'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Table,
  Drawer,
  Button,
  Tabs,
  Space,
  Tooltip,
  Typography,
  Divider,
  Empty,
  Skeleton,
} from 'antd';
import {
  FileSearchOutlined,
  FileProtectOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  RightOutlined,
  AuditOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { statisticsApi } from '@/lib/api/statistics';
import {
  TaskStatus,
  TaskPriority,
  AuditType,
  EvidenceStatus,
  EvidenceCategory,
  IssueSeverity,
  IssueStatus,
  ReviewResult,
  ReviewTargetType,
  UserRole,
  DashboardStats,
  TaskStats,
  EvidenceStats,
  IssueStats,
  ReviewStats,
  UserStats,
  RecurrenceTrendItem,
  DrillDownResult,
  AuditTask,
  Issue,
  Evidence,
} from '@/lib/api/types';
import { formatDate, formatDateTime, formatNumber, formatPercent } from '@/lib/utils/format';

const { Title, Text } = Typography;

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.DRAFT]: '#999',
  [TaskStatus.PENDING]: '#faad14',
  [TaskStatus.ASSIGNED]: '#1890ff',
  [TaskStatus.IN_PROGRESS]: '#13c2c2',
  [TaskStatus.SUBMITTED]: '#2f54eb',
  [TaskStatus.REVIEWING]: '#722ed1',
  [TaskStatus.APPROVED]: '#52c41a',
  [TaskStatus.REJECTED]: '#f5222d',
  [TaskStatus.ARCHIVED]: '#8c8c8c',
};

const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '#52c41a',
  [TaskPriority.MEDIUM]: '#1890ff',
  [TaskPriority.HIGH]: '#fa8c16',
  [TaskPriority.URGENT]: '#f5222d',
};

const AUDIT_TYPE_COLORS: Record<AuditType, string> = {
  [AuditType.ROUTINE]: '#1890ff',
  [AuditType.SPECIAL]: '#722ed1',
  [AuditType.COMPLIANCE]: '#52c41a',
  [AuditType.INVESTIGATION]: '#f5222d',
};

const EVIDENCE_STATUS_COLORS: Record<EvidenceStatus, string> = {
  [EvidenceStatus.DRAFT]: '#999',
  [EvidenceStatus.SUBMITTED]: '#1890ff',
  [EvidenceStatus.REVIEWING]: '#722ed1',
  [EvidenceStatus.APPROVED]: '#52c41a',
  [EvidenceStatus.REJECTED]: '#f5222d',
  [EvidenceStatus.NEED_SUPPLEMENT]: '#faad14',
  [EvidenceStatus.ARCHIVED]: '#8c8c8c',
};

const EVIDENCE_CATEGORY_COLORS: Record<EvidenceCategory, string> = {
  [EvidenceCategory.DOCUMENT]: '#1890ff',
  [EvidenceCategory.FINANCIAL]: '#52c41a',
  [EvidenceCategory.CONTRACT]: '#722ed1',
  [EvidenceCategory.REPORT]: '#fa8c16',
  [EvidenceCategory.RECORD]: '#13c2c2',
  [EvidenceCategory.MEETING_MINUTE]: '#eb2f96',
  [EvidenceCategory.OTHER]: '#8c8c8c',
};

const ISSUE_SEVERITY_COLORS: Record<IssueSeverity, string> = {
  [IssueSeverity.MINOR]: '#52c41a',
  [IssueSeverity.MODERATE]: '#1890ff',
  [IssueSeverity.MAJOR]: '#fa8c16',
  [IssueSeverity.CRITICAL]: '#f5222d',
};

const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  [IssueStatus.IDENTIFIED]: '#faad14',
  [IssueStatus.MITIGATING]: '#1890ff',
  [IssueStatus.RESOLVED]: '#52c41a',
  [IssueStatus.RECURRED]: '#f5222d',
  [IssueStatus.CLOSED]: '#8c8c8c',
};

const REVIEW_RESULT_COLORS: Record<ReviewResult, string> = {
  [ReviewResult.APPROVED]: '#52c41a',
  [ReviewResult.REJECTED]: '#f5222d',
  [ReviewResult.NEED_REVISION]: '#faad14',
};

const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.AUDITOR]: '#1890ff',
  [UserRole.BUSINESS_OWNER]: '#52c41a',
  [UserRole.COMPLIANCE_OFFICER]: '#722ed1',
  [UserRole.MANAGEMENT]: '#fa8c16',
  [UserRole.ADMIN]: '#f5222d',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.DRAFT]: '草稿',
  [TaskStatus.PENDING]: '待分配',
  [TaskStatus.ASSIGNED]: '已分配',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.SUBMITTED]: '已提交',
  [TaskStatus.REVIEWING]: '审核中',
  [TaskStatus.APPROVED]: '已通过',
  [TaskStatus.REJECTED]: '已拒绝',
  [TaskStatus.ARCHIVED]: '已归档',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '低',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.HIGH]: '高',
  [TaskPriority.URGENT]: '紧急',
};

const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  [AuditType.ROUTINE]: '常规审计',
  [AuditType.SPECIAL]: '专项审计',
  [AuditType.COMPLIANCE]: '合规审计',
  [AuditType.INVESTIGATION]: '调查审计',
};

const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  [EvidenceStatus.DRAFT]: '草稿',
  [EvidenceStatus.SUBMITTED]: '已提交',
  [EvidenceStatus.REVIEWING]: '审核中',
  [EvidenceStatus.APPROVED]: '已通过',
  [EvidenceStatus.REJECTED]: '已拒绝',
  [EvidenceStatus.NEED_SUPPLEMENT]: '需补充',
  [EvidenceStatus.ARCHIVED]: '已归档',
};

const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  [EvidenceCategory.DOCUMENT]: '文档',
  [EvidenceCategory.FINANCIAL]: '财务',
  [EvidenceCategory.CONTRACT]: '合同',
  [EvidenceCategory.REPORT]: '报告',
  [EvidenceCategory.RECORD]: '记录',
  [EvidenceCategory.MEETING_MINUTE]: '会议纪要',
  [EvidenceCategory.OTHER]: '其他',
};

const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  [IssueSeverity.MINOR]: '轻微',
  [IssueSeverity.MODERATE]: '中等',
  [IssueSeverity.MAJOR]: '严重',
  [IssueSeverity.CRITICAL]: '重大',
};

const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.IDENTIFIED]: '已识别',
  [IssueStatus.MITIGATING]: '整改中',
  [IssueStatus.RESOLVED]: '已解决',
  [IssueStatus.RECURRED]: '已复发',
  [IssueStatus.CLOSED]: '已关闭',
};

const REVIEW_RESULT_LABELS: Record<ReviewResult, string> = {
  [ReviewResult.APPROVED]: '通过',
  [ReviewResult.REJECTED]: '拒绝',
  [ReviewResult.NEED_REVISION]: '需修改',
};

const REVIEW_TARGET_TYPE_LABELS: Record<ReviewTargetType, string> = {
  [ReviewTargetType.EVIDENCE]: '证据',
  [ReviewTargetType.TASK]: '任务',
  [ReviewTargetType.CHECKLIST]: '检查清单',
  [ReviewTargetType.SAMPLING]: '抽样',
};

const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.AUDITOR]: '审计员',
  [UserRole.BUSINESS_OWNER]: '业务负责人',
  [UserRole.COMPLIANCE_OFFICER]: '合规官',
  [UserRole.MANAGEMENT]: '管理层',
  [UserRole.ADMIN]: '管理员',
};

interface DrillDownState {
  visible: boolean;
  dimension: string;
  value: string;
  title: string;
}

export default function StatisticsPage() {
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    visible: false,
    dimension: '',
    value: '',
    title: '',
  });

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => statisticsApi.getDashboard(),
  });

  const { data: taskStats, isLoading: taskLoading } = useQuery({
    queryKey: ['statistics', 'tasks'],
    queryFn: () => statisticsApi.getTaskStats(),
  });

  const { data: evidenceStats, isLoading: evidenceLoading } = useQuery({
    queryKey: ['statistics', 'evidences'],
    queryFn: () => statisticsApi.getEvidenceStats(),
  });

  const { data: issueStats, isLoading: issueLoading } = useQuery({
    queryKey: ['statistics', 'issues'],
    queryFn: () => statisticsApi.getIssueStats(),
  });

  const { data: reviewStats, isLoading: reviewLoading } = useQuery({
    queryKey: ['statistics', 'reviews'],
    queryFn: () => statisticsApi.getReviewStats(),
  });

  const { data: userStats, isLoading: userLoading } = useQuery({
    queryKey: ['statistics', 'users'],
    queryFn: () => statisticsApi.getUserStats(),
  });

  const { data: recurrenceTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['statistics', 'recurrenceTrend', 6],
    queryFn: () => statisticsApi.getRecurrenceTrend(6),
  });

  const { data: drillDownResult, isFetching: drillDownLoading } = useQuery({
    queryKey: ['statistics', 'drillDown', drillDown.dimension, drillDown.value],
    queryFn: () => statisticsApi.drillDown(drillDown.dimension, drillDown.value),
    enabled: drillDown.visible && !!drillDown.dimension,
  });

  const summaryCards = useMemo(() => {
    if (!dashboard) return [];
    return [
      {
        title: '任务总数',
        value: dashboard.summary.totalTasks,
        icon: <FileSearchOutlined style={{ fontSize: 32 }} />,
        color: '#1890ff',
        bg: '#e6f7ff',
        yoy: 0,
        mom: 0,
      },
      {
        title: '证据总数',
        value: dashboard.summary.totalEvidences,
        icon: <FileProtectOutlined style={{ fontSize: 32 }} />,
        color: '#52c41a',
        bg: '#f6ffed',
        yoy: 0,
        mom: 0,
      },
      {
        title: '问题总数',
        value: dashboard.summary.totalIssues,
        icon: <ExclamationCircleOutlined style={{ fontSize: 32 }} />,
        color: '#fa8c16',
        bg: '#fff7e6',
        yoy: 0,
        mom: 0,
      },
      {
        title: '用户总数',
        value: dashboard.summary.totalUsers,
        icon: <TeamOutlined style={{ fontSize: 32 }} />,
        color: '#722ed1',
        bg: '#f9f0ff',
        yoy: 0,
        mom: 0,
      },
      {
        title: '任务完成率',
        value: dashboard.summary.taskCompletionRate,
        icon: <CheckCircleOutlined style={{ fontSize: 32 }} />,
        color: '#13c2c2',
        bg: '#e6fffb',
        yoy: 0,
        mom: 0,
        suffix: '%',
      },
      {
        title: '证据通过率',
        value: dashboard.summary.evidenceApprovalRate,
        icon: <RiseOutlined style={{ fontSize: 32 }} />,
        color: '#eb2f96',
        bg: '#fff0f6',
        yoy: 0,
        mom: 0,
        suffix: '%',
      },
    ];
  }, [dashboard]);

  const maxDept = taskStats?.byDepartment.reduce((max, d) => Math.max(max, d.count), 0) || 1;

  const maxTrendTotal = recurrenceTrend?.reduce((max, t) => Math.max(max, t.total), 0) || 1;
  const maxTrendRecurred = recurrenceTrend?.reduce((max, t) => Math.max(max, t.recurred), 0) || 1;

  const handleDrillDown = (dimension: string, value: string, title: string) => {
    setDrillDown({ visible: true, dimension, value, title });
  };

  const taskColumns = [
    { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: TaskStatus) => (
        <Tag color={TASK_STATUS_COLORS[s]}>{STATUS_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: TaskPriority) => (
        <Tag color={TASK_PRIORITY_COLORS[p]}>{PRIORITY_LABELS[p] || p}</Tag>
      ),
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => formatDate(d) },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AuditTask) => (
        <Button type="link" size="small">
          查看详情
        </Button>
      ),
    },
  ];

  const issueColumns = [
    { title: '问题编号', dataIndex: 'issueNo', key: 'issueNo' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: IssueSeverity) => (
        <Tag color={ISSUE_SEVERITY_COLORS[s]}>{ISSUE_SEVERITY_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: IssueStatus) => (
        <Tag color={ISSUE_STATUS_COLORS[s]}>{ISSUE_STATUS_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: '复发次数',
      dataIndex: 'recurrenceCount',
      key: 'recurrenceCount',
      render: (n: number) => (
        <Text type={n > 0 ? 'danger' : undefined} strong={n > 0}>
          {n}
        </Text>
      ),
    },
    { title: '负责人', dataIndex: ['owner', 'fullName'], key: 'owner' },
    { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => formatDate(d) },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Issue) => (
        <Button type="link" size="small" onClick={() => setSelectedIssueId(record.id)}>
          查看详情
        </Button>
      ),
    },
  ];

  const evidenceColumns = [
    { title: '证据编号', dataIndex: 'evidenceNo', key: 'evidenceNo' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: EvidenceStatus) => (
        <Tag color={EVIDENCE_STATUS_COLORS[s]}>{EVIDENCE_STATUS_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (c: EvidenceCategory) => (
        <Tag color={EVIDENCE_CATEGORY_COLORS[c]}>{EVIDENCE_CATEGORY_LABELS[c] || c}</Tag>
      ),
    },
    { title: '关联任务', dataIndex: ['task', 'taskNo'], key: 'task' },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', render: (d: string) => formatDateTime(d) },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Evidence) => (
        <Button type="link" size="small">
          查看详情
        </Button>
      ),
    },
  ];

  const topRecurredColumns = [
    { title: '问题编号', dataIndex: 'issueNo', key: 'issueNo' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: IssueSeverity) => (
        <Tag color={ISSUE_SEVERITY_COLORS[s]}>{ISSUE_SEVERITY_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: '复发次数',
      dataIndex: 'recurrenceCount',
      key: 'recurrenceCount',
      render: (n: number) => (
        <Text type="danger" strong>
          {n}
        </Text>
      ),
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '负责人', dataIndex: ['owner', 'fullName'], key: 'owner' },
    {
      title: '关联单据',
      key: 'refs',
      render: (_: unknown, record: Issue) => (
        <Space size="small">
          {record.task?.taskNo && <Tag color="blue">T:{record.task.taskNo}</Tag>}
          {record.evidence?.evidenceNo && <Tag color="green">E:{record.evidence?.evidenceNo}</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Issue) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleDrillDown('issue_recurred', record.id || '', `问题 ${record.issueNo} 详情`)}
          >
            穿透
          </Button>
          <Button type="link" size="small" onClick={() => setSelectedIssueId(record.id)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const renderSummaryCards = () => (
    <Row gutter={[16, 16]}>
      {summaryCards.map((card, idx) => (
        <Col xs={24} sm={12} md={8} lg={4} key={idx}>
          <Card
            styles={{ body: { padding: 16 } }}
            style={{ backgroundColor: card.bg, border: 'none' }}
            hoverable
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {card.title}
                </Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
                    {formatNumber(Number(card.value), card.suffix ? 2 : 0)}
                    {card.suffix && <span style={{ fontSize: 16 }}>{card.suffix}</span>}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Tooltip title="同比">
                    <span style={{ marginRight: 12 }}>
                      <ArrowUpOutlined style={{ color: '#f5222d' }} /> {card.yoy}%
                    </span>
                  </Tooltip>
                  <Tooltip title="环比">
                    <span>
                      <ArrowDownOutlined style={{ color: '#52c41a' }} /> {card.mom}%
                    </span>
                  </Tooltip>
                </div>
              </div>
              <div style={{ color: card.color, opacity: 0.8 }}>{card.icon}</div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderDistributionBar = (
    items: { label: string; value: number; color: string; dimension: string }[],
    total: number
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div
            key={item.label}
            onClick={() => handleDrillDown(item.dimension, item.label, `${item.label} 明细`)}
            style={{
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 6,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Space>
                <Tag color={item.color} style={{ margin: 0 }}>
                  {item.label}
                </Tag>
              </Space>
              <Text strong>
                {item.value} ({formatPercent(percent, 1)})
              </Text>
            </div>
            <div
              style={{
                height: 8,
                background: '#f0f0f0',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: item.color,
                  width: `${percent}%`,
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTaskStats = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <FileSearchOutlined /> 按状态分布
            </Space>
          }
          size="small"
        >
          {taskStats?.byStatus?.length ? (
            renderDistributionBar(
              taskStats?.byStatus?.map((s) => ({
                label: STATUS_LABELS[s.status] || s.status,
                value: s.count,
                color: TASK_STATUS_COLORS[s.status],
                dimension: 'task_status',
              })),
              taskStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <ThunderboltOutlined /> 按优先级分布
            </Space>
          }
          size="small"
        >
          {taskStats?.byPriority?.length ? (
            renderDistributionBar(
              taskStats?.byPriority?.map((s) => ({
                label: PRIORITY_LABELS[s.priority] || s.priority,
                value: s.count,
                color: TASK_PRIORITY_COLORS[s.priority],
                dimension: 'task_priority',
              })),
              taskStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <AuditOutlined /> 按审计类型分布
            </Space>
          }
          size="small"
        >
          {taskStats?.byAuditType?.length ? (
            renderDistributionBar(
              taskStats?.byAuditType?.map((s) => ({
                label: AUDIT_TYPE_LABELS[s.auditType] || s.auditType,
                value: s.count,
                color: AUDIT_TYPE_COLORS[s.auditType],
                dimension: 'task_audit_type',
              })),
              taskStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <CheckCircleOutlined /> 完成情况
            </Space>
          }
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col xs={12}>
              <div
                style={{
                  textAlign: 'center',
                  padding: 16,
                  background: '#f6ffed',
                  borderRadius: 8,
                }}
              >
                <Progress
                  type="dashboard"
                  percent={taskStats?.completionRate || 0}
                  strokeColor="#52c41a"
                  size={120}
                />
                <Title level={5} style={{ marginTop: 8, color: '#52c41a' }}>
                  完成率
                </Title>
              </div>
            </Col>
            <Col xs={12}>
              <div
                style={{
                  textAlign: 'center',
                  padding: 16,
                  background: taskStats?.overdue && taskStats.overdue > 0 ? '#fff2f0' : '#f5f5f5',
                  borderRadius: 8,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">超期任务数</Text>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: taskStats?.overdue && taskStats.overdue > 0 ? '#f5222d' : '#8c8c8c',
                    marginTop: 8,
                  }}
                >
                  {taskStats?.overdue || 0}
                </div>
                <Text type="secondary">总任务 {taskStats?.total || 0}</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <TeamOutlined /> 部门分布
            </Space>
          }
          size="small"
          styles={{ body: { padding: 16 } }}
        >
          {taskStats?.byDepartment?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {taskStats?.byDepartment?.map((d) => {
                const percent = (d.count / maxDept) * 100;
                return (
                  <div
                    key={d.department}
                    onClick={() => handleDrillDown('task_department', d.department, `${d.department} 任务明细`)}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong>{d.department || '未分配'}</Text>
                      <Text strong style={{ color: '#1890ff' }}>
                        {d.count}
                      </Text>
                    </div>
                    <div style={{ height: 14, background: '#f0f0f0', borderRadius: 7, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #1890ff, #36cfc9)',
                          width: `${percent}%`,
                          borderRadius: 7,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderEvidenceStats = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <CheckCircleOutlined /> 通过率概览
            </Space>
          }
          size="small"
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Progress
              type="dashboard"
              percent={evidenceStats?.approvalRate || 0}
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              size={140}
            />
            <Title level={5} style={{ marginTop: 12 }}>
              证据通过率
            </Title>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">总数</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>
                  {evidenceStats?.total || 0}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">需补附件</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
                  {evidenceStats?.withSupplement || 0}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <FileProtectOutlined /> 按状态分布
            </Space>
          }
          size="small"
        >
          {evidenceStats?.byStatus?.length ? (
            renderDistributionBar(
              evidenceStats?.byStatus?.map((s) => ({
                label: EVIDENCE_STATUS_LABELS[s.status] || s.status,
                value: s.count,
                color: EVIDENCE_STATUS_COLORS[s.status],
                dimension: 'evidence_status',
              })),
              evidenceStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <BarChartOutlined /> 按类别分布
            </Space>
          }
          size="small"
        >
          {evidenceStats?.byCategory?.length ? (
            renderDistributionBar(
              evidenceStats?.byCategory?.map((s) => ({
                label: EVIDENCE_CATEGORY_LABELS[s.category] || s.category,
                value: s.count,
                color: EVIDENCE_CATEGORY_COLORS[s.category],
                dimension: 'evidence_category',
              })),
              evidenceStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderIssueStats = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <WarningOutlined /> 复发追踪
            </Space>
          }
          size="small"
        >
          <div style={{ padding: '12px 0' }}>
            <Row gutter={[12, 12]}>
              <Col xs={8}>
                <div style={{ textAlign: 'center', padding: 12, background: '#fff7e6', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    复发率
                  </Text>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#fa8c16', marginTop: 4 }}>
                    {issueStats?.recurrenceRate || '0'}%
                  </div>
                </div>
              </Col>
              <Col xs={8}>
                <div style={{ textAlign: 'center', padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    复发总数
                  </Text>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#f5222d', marginTop: 4 }}>
                    {issueStats?.recurrenceDetails?.totalRecurrenceCount || 0}
                  </div>
                </div>
              </Col>
              <Col xs={8}>
                <div style={{ textAlign: 'center', padding: 12, background: '#f9f0ff', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    平均复发
                  </Text>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#722ed1', marginTop: 4 }}>
                    {formatNumber(issueStats?.recurrenceDetails?.averageRecurrence, 1)}
                  </div>
                </div>
              </Col>
            </Row>
            <Divider orientation="left" style={{ margin: '16px 0 12px' }}>
              按严重度分布
            </Divider>
            {issueStats?.bySeverity?.length ? (
              renderDistributionBar(
                issueStats?.bySeverity?.map((s) => ({
                  label: ISSUE_SEVERITY_LABELS[s.severity] || s.severity,
                  value: s.count,
                  color: ISSUE_SEVERITY_COLORS[s.severity],
                  dimension: 'issue_severity',
                })),
                issueStats?.total || 0
              )
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description />
            )}
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={16}>
        <Card
          title={
            <Space>
              <ClockCircleOutlined /> 6个月复发趋势
            </Space>
          }
          size="small"
        >
          {trendLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : recurrenceTrend?.length ? (
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'flex-end' }}>
                <Space size="small">
                  <div style={{ width: 12, height: 12, background: '#1890ff', borderRadius: 2 }} />
                  <Text type="secondary">问题总数</Text>
                </Space>
                <Space size="small">
                  <div style={{ width: 12, height: 12, background: '#f5222d', borderRadius: 2 }} />
                  <Text type="secondary">复发数</Text>
                </Space>
              </div>
              <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '0 8px' }}>
                {recurrenceTrend.map((item) => {
                  const totalHeight = (item.total / maxTrendTotal) * 180;
                  const recurredHeight = (item.recurred / (maxTrendRecurred || 1)) * 180;
                  return (
                    <div
                      key={item.month}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        cursor: 'pointer',
                        padding: '4px 2px',
                        borderRadius: 6,
                      }}
                      onClick={() => handleDrillDown('issue_month', item.month, `${item.month} 问题明细`)}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Text type="secondary" style={{ fontSize: 11, marginBottom: 8 }}>
                        {item.recurred > 0 && (
                          <Tag color="#f5222d" style={{ margin: 0, fontSize: 10 }}>
                            {item.recurred}
                          </Tag>
                        )}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1, width: '100%' }}>
                        <div
                          style={{
                            flex: 1,
                            background: '#1890ff',
                            opacity: 0.85,
                            borderRadius: '4px 4px 0 0',
                            height: `${Math.max(totalHeight, 2)}px`,
                            minHeight: 2,
                            transition: 'height 0.3s',
                            position: 'relative',
                          }}
                        >
                          <Tooltip title={`总数: ${item.total}`}>
                            <div style={{ width: '100%', height: '100%' }} />
                          </Tooltip>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            background: '#f5222d',
                            borderRadius: '4px 4px 0 0',
                            height: `${Math.max(recurredHeight, item.recurred > 0 ? 2 : 0)}px`,
                            transition: 'height 0.3s',
                            position: 'relative',
                          }}
                        >
                          <Tooltip title={`复发: ${item.recurred}`}>
                            <div style={{ width: '100%', height: '100%' }} />
                          </Tooltip>
                        </div>
                      </div>
                      <Text strong style={{ marginTop: 8, fontSize: 12 }}>
                        {item.month}
                      </Text>
                    </div>
                  );
                })}
              </div>
              <Divider style={{ margin: '16px 0 8px' }} />
              <Row gutter={[12, 12]}>
                {recurrenceTrend.map((item) => (
                  <Col xs={12} md={8} lg={4} key={item.month}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.month} 复发率
                      </Text>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f5222d' }}>{item.rate}%</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>

      <Col xs={24}>
        <Card
          title={
            <Space>
              <CrownOutlined style={{ color: '#faad14' }} /> Top复发问题
            </Space>
          }
          size="small"
          extra={
            <Button type="link" size="small" onClick={() => handleDrillDown('issue_recurred', '', '全部复发问题明细')}>
              查看全部 <RightOutlined />
            </Button>
          }
        >
          {issueLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : (
            <Table
              columns={topRecurredColumns}
              dataSource={issueStats?.recurrenceDetails?.topRecurred?.slice(0, 10) || []}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无复发问题' }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderReviewStats = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <CheckCircleOutlined /> 复核概览
            </Space>
          }
          size="small"
        >
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Row gutter={[12, 12]}>
              <Col xs={12}>
                <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    复核总数
                  </Text>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                    {reviewStats?.total || 0}
                  </div>
                </div>
              </Col>
              <Col xs={12}>
                <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    平均轮次
                  </Text>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#1890ff', marginTop: 4 }}>
                    {reviewStats?.avgRounds || '0'}
                  </div>
                </div>
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0 12px' }} />
            {reviewStats?.byResult?.length ? (
              <Row gutter={[8, 8]}>
                {reviewStats?.byResult?.map((r) => (
                  <Col xs={24} key={r.result}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: `${REVIEW_RESULT_COLORS[r.result]}15`,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleDrillDown('review_result', r.result, `复核结果: ${REVIEW_RESULT_LABELS[r.result]}`)}
                    >
                      <Tag color={REVIEW_RESULT_COLORS[r.result]} style={{ margin: 0 }}>
                        {REVIEW_RESULT_LABELS[r.result]}
                      </Tag>
                      <Text strong>{r.count}</Text>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description />
            )}
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <AuditOutlined /> 按目标类型
            </Space>
          }
          size="small"
        >
          {reviewStats?.byTargetType?.length ? (
            renderDistributionBar(
              reviewStats?.byTargetType?.map((t) => ({
                label: REVIEW_TARGET_TYPE_LABELS[t.targetType] || t.targetType,
                value: t.count,
                color: '#1890ff',
                dimension: 'review_target_type',
              })),
              reviewStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <CrownOutlined style={{ color: '#faad14' }} /> 复核人排行
            </Space>
          }
          size="small"
        >
          {reviewStats?.topReviewers?.length ? (
            <Table
              size="small"
              pagination={false}
              rowKey="reviewer.id"
              dataSource={reviewStats?.topReviewers}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 48,
                  render: (_: unknown, __: unknown, idx: number) => {
                    const colors = ['#faad14', '#8c8c8c', '#d48806'];
                    return (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: idx < 3 ? colors[idx] : '#f0f0f0',
                          color: idx < 3 ? '#fff' : '#595959',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {idx + 1}
                      </div>
                    );
                  },
                },
                {
                  title: '复核人',
                  key: 'reviewer',
                  render: (_: unknown, record: ReviewStats['topReviewers'][0]) => (
                    <Space>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#1890ff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        {record.reviewer.fullName?.[0] || record.reviewer.username?.[0] || '?'}
                      </div>
                      <span>{record.reviewer.fullName || record.reviewer.username}</span>
                    </Space>
                  ),
                },
                { title: '总数', dataIndex: 'total', key: 'total', width: 60, align: 'right' },
                {
                  title: '通过数',
                  dataIndex: 'approved',
                  key: 'approved',
                  width: 72,
                  align: 'right',
                  render: (n: number) => <Tag color="#52c41a">{n}</Tag>,
                },
              ]}
              locale={{ emptyText: '暂无数据' }}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderUserStats = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        <Card
          title={
            <Space>
              <TeamOutlined /> 角色分布
            </Space>
          }
          size="small"
        >
          {userStats?.byRole?.length ? (
            renderDistributionBar(
              userStats?.byRole?.map((r) => ({
                label: USER_ROLE_LABELS[r.role] || r.role,
                value: r.count,
                color: USER_ROLE_COLORS[r.role],
                dimension: 'user_role',
              })),
              userStats?.total || 0
            )
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card
          title={
            <Space>
              <CrownOutlined style={{ color: '#faad14' }} /> 任务负载 Top10
            </Space>
          }
          size="small"
        >
          {userStats?.topTaskAssignees?.length ? (
            <Table
              size="small"
              pagination={false}
              rowKey="user.id"
              dataSource={userStats?.topTaskAssignees}
              columns={[
                {
                  title: '排名',
                  key: 'rank',
                  width: 48,
                  render: (_: unknown, __: unknown, idx: number) => {
                    const colors = ['#faad14', '#8c8c8c', '#d48806'];
                    return (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: idx < 3 ? colors[idx] : '#f0f0f0',
                          color: idx < 3 ? '#fff' : '#595959',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {idx + 1}
                      </div>
                    );
                  },
                },
                {
                  title: '用户',
                  key: 'user',
                  render: (_: unknown, record: UserStats['topTaskAssignees'][0]) => (
                    <Space>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: USER_ROLE_COLORS[record.user.role] || '#1890ff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        {record.user.fullName?.[0] || record.user.username?.[0] || '?'}
                      </div>
                      <span>{record.user.fullName || record.user.username}</span>
                      <Tag style={{ margin: 0 }}>{USER_ROLE_LABELS[record.user.role] || record.user.role}</Tag>
                    </Space>
                  ),
                },
                { title: '部门', dataIndex: ['user', 'department'], key: 'department' },
                {
                  title: '任务数',
                  dataIndex: 'taskCount',
                  key: 'taskCount',
                  align: 'right',
                  render: (n: number) => (
                    <Tag color="#1890ff" style={{ margin: 0 }}>
                      {n}
                    </Tag>
                  ),
                },
              ]}
              locale={{ emptyText: '暂无数据' }}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
    </Row>
  );

  const renderDrillDownDrawer = () => (
    <Drawer
      title={drillDown.title || '明细数据'}
      placement="right"
      width={960}
      open={drillDown.visible}
      onClose={() => setDrillDown({ ...drillDown, visible: false })}
      loading={drillDownLoading}
      destroyOnClose
    >
      {drillDownLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : drillDownResult ? (
        <Tabs
          items={[
            drillDownResult.tasks?.length
              ? {
                  key: 'tasks',
                  label: `任务 (${drillDownResult.tasks.length})`,
                  children: (
                    <Table
                      size="small"
                      columns={taskColumns}
                      dataSource={drillDownResult.tasks}
                      rowKey="id"
                      scroll={{ x: true }}
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: '暂无数据' }}
                    />
                  ),
                }
              : null,
            drillDownResult.issues?.length
              ? {
                  key: 'issues',
                  label: `问题 (${drillDownResult.issues.length})`,
                  children: (
                    <Table
                      size="small"
                      columns={issueColumns}
                      dataSource={drillDownResult.issues}
                      rowKey="id"
                      scroll={{ x: true }}
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: '暂无数据' }}
                    />
                  ),
                }
              : null,
            drillDownResult.evidences?.length
              ? {
                  key: 'evidences',
                  label: `证据 (${drillDownResult.evidences.length})`,
                  children: (
                    <Table
                      size="small"
                      columns={evidenceColumns}
                      dataSource={drillDownResult.evidences}
                      rowKey="id"
                      scroll={{ x: true }}
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: '暂无数据' }}
                    />
                  ),
                }
              : null,
          ].filter(Boolean) as any}
          size="small"
        />
      ) : (
        <Empty description="暂无钻取数据" />
      )}
    </Drawer>
  );

  const renderIssueDetailDrawer = () => (
    <Drawer
      title="问题详情"
      placement="right"
      width={640}
      open={!!selectedIssueId}
      onClose={() => setSelectedIssueId(null)}
      destroyOnClose
    >
      <Text type="secondary">问题 ID: {selectedIssueId}</Text>
      <Divider />
      <Empty description="点击跳转问题详情页查看完整信息" />
    </Drawer>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        <Space>
          <BarChartOutlined /> 统计分析
        </Space>
      </Title>

      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Card size="small" title={<Space><FileSearchOutlined /> A. 概览统计</Space>} styles={{ body: { padding: 16 } }}>
          {dashboardLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : renderSummaryCards()}
        </Card>

        <Card size="small" title={<Space><AuditOutlined /> B. 任务统计</Space>} styles={{ body: { padding: 16 } }}>
          {taskLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : renderTaskStats()}
        </Card>

        <Card size="small" title={<Space><FileProtectOutlined /> C. 证据统计</Space>} styles={{ body: { padding: 16 } }}>
          {evidenceLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : renderEvidenceStats()}
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <WarningOutlined style={{ color: '#f5222d' }} /> D. 问题复发追踪
            </Space>
          }
          styles={{ body: { padding: 16 } }}
          style={{ border: '2px solid #ffccc7' }}
        >
          {issueLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : renderIssueStats()}
        </Card>

        <Card size="small" title={<Space><CheckCircleOutlined /> F. 复核统计</Space>} styles={{ body: { padding: 16 } }}>
          {reviewLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : renderReviewStats()}
        </Card>

        <Card size="small" title={<Space><UserOutlined /> G. 用户统计</Space>} styles={{ body: { padding: 16 } }}>
          {userLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : renderUserStats()}
        </Card>
      </Space>

      {renderDrillDownDrawer()}
      {renderIssueDetailDrawer()}
    </div>
  );
}
