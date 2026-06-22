'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Drawer,
  Typography,
  Empty,
  Skeleton,
  App,
  Tooltip,
  Divider,
  Descriptions,
  Alert,
} from 'antd';
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  RetweetOutlined,
  WarningOutlined,
  FileSearchOutlined,
  FileProtectOutlined,
  RightOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { issuesApi } from '@/lib/api/issues';
import { statisticsApi } from '@/lib/api/statistics';
import {
  Issue,
  IssueSeverity,
  IssueStatus,
  User,
  AuditTask,
  Evidence,
} from '@/lib/api/types';
import { formatDate, formatDateTime } from '@/lib/utils/format';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ISSUE_SEVERITY_COLORS: Record<IssueSeverity, string> = {
  [IssueSeverity.MINOR]: 'green',
  [IssueSeverity.MODERATE]: 'blue',
  [IssueSeverity.MAJOR]: 'orange',
  [IssueSeverity.CRITICAL]: 'red',
};

const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  [IssueStatus.IDENTIFIED]: 'gold',
  [IssueStatus.MITIGATING]: 'blue',
  [IssueStatus.RESOLVED]: 'green',
  [IssueStatus.RECURRED]: 'red',
  [IssueStatus.CLOSED]: 'default',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  [IssueSeverity.MINOR]: '轻微',
  [IssueSeverity.MODERATE]: '中等',
  [IssueSeverity.MAJOR]: '严重',
  [IssueSeverity.CRITICAL]: '重大',
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.IDENTIFIED]: '已识别',
  [IssueStatus.MITIGATING]: '整改中',
  [IssueStatus.RESOLVED]: '已解决',
  [IssueStatus.RECURRED]: '已复发',
  [IssueStatus.CLOSED]: '已关闭',
};

export default function IssuesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<{
    status?: IssueStatus;
    severity?: IssueSeverity;
    category?: string;
    department?: string;
    isRecurred?: boolean;
  }>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const [recurOpen, setRecurOpen] = useState(false);
  const [recurTargetIssue, setRecurTargetIssue] = useState<Issue | null>(null);
  const [recurForm] = Form.useForm();

  const [detailLoading, setDetailLoading] = useState(false);

  const { data: issuesData, isLoading, refetch } = useQuery({
    queryKey: ['issues', page, pageSize, keyword, filters],
    queryFn: () =>
      issuesApi.getIssues({
        page,
        pageSize,
        keyword,
        ...filters,
      }),
  });

  const { data: issueStats } = useQuery({
    queryKey: ['issues', 'stats'],
    queryFn: () => statisticsApi.getIssueStats(),
  });

  const allIssues = useQuery({
    queryKey: ['issues', 'all'],
    queryFn: () => issuesApi.getIssues({ page: 1, pageSize: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: issuesApi.createIssue,
    onSuccess: () => {
      message.success('问题创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || '创建失败');
    },
  });

  const markRecurredMutation = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string }) =>
      issuesApi.markRecurred(id, parentId),
    onSuccess: () => {
      message.success('标记复发成功');
      setRecurOpen(false);
      recurForm.resetFields();
      setRecurTargetIssue(null);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || '标记失败');
    },
  });

  const handleViewDetail = async (issue: Issue) => {
    setSelectedIssue(issue);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await issuesApi.getIssue(issue.id);
      setSelectedIssue(detail);
    } catch (e) {
      // 保持现有数据
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMarkRecurred = (issue: Issue) => {
    setRecurTargetIssue(issue);
    recurForm.setFieldsValue({ parentIssueId: undefined });
    setRecurOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };
      createMutation.mutate(payload);
    } catch (e) {
      // 校验失败
    }
  };

  const handleSubmitRecur = async () => {
    try {
      const values = await recurForm.validateFields();
      if (!recurTargetIssue) return;
      markRecurredMutation.mutate({
        id: recurTargetIssue.id,
        parentId: values.parentIssueId,
      });
    } catch (e) {
      // 校验失败
    }
  };

  const statSummary = useMemo(() => {
    if (!issueStats) return null;
    return [
      {
        label: '问题总数',
        value: issueStats?.total,
        color: '#1890ff',
        icon: <ExclamationCircleOutlined />,
      },
      {
        label: '已复发',
        value: issueStats?.recurred,
        color: '#f5222d',
        icon: <RetweetOutlined />,
      },
      {
        label: '复发率',
        value: `${issueStats?.recurrenceRate}%`,
        color: '#fa8c16',
        icon: <WarningOutlined />,
      },
      {
        label: '平均复发次数',
        value: issueStats?.recurrenceDetails?.averageRecurrence?.toFixed(1) || '0',
        color: '#722ed1',
        icon: <WarningOutlined />,
      },
    ];
  }, [issueStats]);

  const columns = [
    {
      title: '问题编号',
      dataIndex: 'issueNo',
      key: 'issueNo',
      width: 120,
      fixed: 'left' as const,
      render: (no: string, record: Issue) => (
        <a onClick={() => handleViewDetail(record)} style={{ fontWeight: 500 }}>
          {no}
        </a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      minWidth: 200,
      ellipsis: true,
      render: (t: string, record: Issue) => (
        <Tooltip title={t}>
          <Space direction="vertical" size={0}>
            <span>{t}</span>
            {record.isRecurred && (
              <Tag color="red" style={{ margin: 0, padding: '0 4px', fontSize: 10, lineHeight: '16px' }}>
                已复发
              </Tag>
            )}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (s: IssueSeverity) => (
        <Tag color={ISSUE_SEVERITY_COLORS[s]} style={{ fontWeight: 600 }}>
          {SEVERITY_LABELS[s]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: IssueStatus) => <Tag color={ISSUE_STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    {
      title: '复发次数',
      dataIndex: 'recurrenceCount',
      key: 'recurrenceCount',
      width: 90,
      align: 'center' as const,
      sorter: (a: Issue, b: Issue) => a.recurrenceCount - b.recurrenceCount,
      render: (n: number) => (
        <Text type={n > 0 ? 'danger' : undefined} strong={n > 0} style={{ fontSize: n > 0 ? 15 : undefined }}>
          {n}
        </Text>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (c: string) => c || <Text type="secondary">-</Text>,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (d: string) => d || <Text type="secondary">-</Text>,
    },
    {
      title: '关联单据',
      key: 'refs',
      width: 160,
      render: (_: unknown, record: Issue) => (
        <Space size="small" direction="vertical">
          {record.task?.taskNo && (
            <Tag icon={<FileSearchOutlined />} color="blue" style={{ margin: 0 }}>
              T:{record.task.taskNo}
            </Tag>
          )}
          {record.evidence?.evidenceNo && (
            <Tag icon={<FileProtectOutlined />} color="green" style={{ margin: 0 }}>
              E:{record.evidence?.evidenceNo}
            </Tag>
          )}
          {!record.task?.taskNo && !record.evidence?.evidenceNo && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              无
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (d: string, record: Issue) => {
        const isOverdue = d && new Date(d) < new Date() && record.status !== IssueStatus.RESOLVED && record.status !== IssueStatus.CLOSED;
        return (
          <Text type={isOverdue ? 'danger' : undefined} delete={isOverdue ? false : false}>
            {formatDate(d)}
            {isOverdue && <span style={{ marginLeft: 4 }}>⚠️</span>}
          </Text>
        );
      },
    },
    {
      title: '负责人',
      dataIndex: ['owner', 'fullName'],
      key: 'owner',
      width: 100,
      render: (n: string, record: Issue) => n || record.owner?.username || <Text type="secondary">-</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Issue) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<RetweetOutlined />}
            danger
            onClick={() => handleMarkRecurred(record)}
            disabled={record.status === IssueStatus.RECURRED}
          >
            标记复发
          </Button>
        </Space>
      ),
    },
  ];

  const renderFilterBar = () => (
    <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: 12 } }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={8} lg={5}>
          <Input
            placeholder="搜索问题编号/标题/描述"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            onPressEnter={() => {
              setPage(1);
              refetch();
            }}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Select
            placeholder="状态"
            allowClear
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            style={{ width: '100%' }}
            options={Object.values(IssueStatus).map((s) => ({
              label: STATUS_LABELS[s],
              value: s,
            }))}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Select
            placeholder="严重度"
            allowClear
            value={filters.severity}
            onChange={(v) => setFilters({ ...filters, severity: v })}
            style={{ width: '100%' }}
            options={Object.values(IssueSeverity).map((s) => ({
              label: SEVERITY_LABELS[s],
              value: s,
            }))}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Select
            placeholder="是否复发"
            allowClear
            value={filters.isRecurred === undefined ? undefined : String(filters.isRecurred)}
            onChange={(v) =>
              setFilters({
                ...filters,
                isRecurred: v === undefined ? undefined : v === 'true',
              })
            }
            style={{ width: '100%' }}
            options={[
              { label: '已复发', value: 'true' },
              { label: '未复发', value: 'false' },
            ]}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Input
            placeholder="类别"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Input
            placeholder="部门"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} md={8} lg={4} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setPage(1);
                refetch();
              }}
            >
              筛选
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({});
                setKeyword('');
                setPage(1);
              }}
            >
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建问题
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderStatBar = () =>
    statSummary ? (
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statSummary.map((s, idx) => (
          <Col xs={12} md={6} key={idx}>
            <Card size="small" style={{ border: 'none', background: `${s.color}12` }}>
              <Space>
                <div
                  style={{
                    fontSize: 24,
                    color: s.color,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {s.label}
                  </Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
                    {s.value}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    ) : null;

  const renderDetailDrawer = () => (
    <Drawer
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
          问题详情
          {selectedIssue?.issueNo && <Tag color="blue">{selectedIssue.issueNo}</Tag>}
        </Space>
      }
      placement="right"
      width={720}
      open={detailOpen}
      onClose={() => {
        setDetailOpen(false);
        setSelectedIssue(null);
      }}
      loading={detailLoading}
      destroyOnClose
      extra={
        <Space>
          <Button
            icon={<RetweetOutlined />}
            danger
            onClick={() => selectedIssue && handleMarkRecurred(selectedIssue)}
            disabled={selectedIssue?.status === IssueStatus.RECURRED}
          >
            标记复发
          </Button>
        </Space>
      }
    >
      {selectedIssue ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={
              selectedIssue.severity === IssueSeverity.CRITICAL || selectedIssue.severity === IssueSeverity.MAJOR
                ? 'error'
                : selectedIssue.severity === IssueSeverity.MODERATE
                ? 'warning'
                : 'info'
            }
            showIcon
            message={
              <Space>
                <span>严重度：</span>
                <Tag color={ISSUE_SEVERITY_COLORS[selectedIssue.severity]} style={{ fontWeight: 600 }}>
                  {SEVERITY_LABELS[selectedIssue.severity]}
                </Tag>
                <span style={{ marginLeft: 16 }}>状态：</span>
                <Tag color={ISSUE_STATUS_COLORS[selectedIssue.status]}>{STATUS_LABELS[selectedIssue.status]}</Tag>
                {selectedIssue.isRecurred && (
                  <Tag icon={<RetweetOutlined />} color="red" style={{ fontWeight: 600 }}>
                    复发 {selectedIssue.recurrenceCount} 次
                  </Tag>
                )}
              </Space>
            }
          />

          <Card size="small" title="基本信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="问题编号">{selectedIssue.issueNo}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selectedIssue.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {selectedIssue.title}
              </Descriptions.Item>
              <Descriptions.Item label="发现时间">{formatDate(selectedIssue.identifiedAt)}</Descriptions.Item>
              <Descriptions.Item label="截止日期">
                <Text
                  type={
                    selectedIssue.dueDate &&
                    new Date(selectedIssue.dueDate) < new Date() &&
                    selectedIssue.status !== IssueStatus.RESOLVED &&
                    selectedIssue.status !== IssueStatus.CLOSED
                      ? 'danger'
                      : undefined
                  }
                >
                  {formatDate(selectedIssue.dueDate)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="类别">{selectedIssue.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="子类别">{selectedIssue.subCategory || '-'}</Descriptions.Item>
              <Descriptions.Item label="部门">{selectedIssue.department || '-'}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{formatDate(selectedIssue.resolvedAt)}</Descriptions.Item>
              <Descriptions.Item label="创建人">
                {selectedIssue.createdBy?.fullName || selectedIssue.createdBy?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="负责人">
                {selectedIssue.owner?.fullName || selectedIssue.owner?.username || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {selectedIssue.description && (
            <Card size="small" title="问题描述">
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedIssue.description}</Paragraph>
            </Card>
          )}

          <Card size="small" title="关联单据">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <FileSearchOutlined style={{ color: '#1890ff' }} />
                  <Text strong>关联任务：</Text>
                  {selectedIssue.task ? (
                    <Tag color="blue" style={{ margin: 0 }}>
                      {selectedIssue.task.taskNo} - {selectedIssue.task.title}
                    </Tag>
                  ) : (
                    <Text type="secondary">无</Text>
                  )}
                </Space>
                {selectedIssue.task && (
                  <Button type="link" size="small">
                    查看任务 <RightOutlined />
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <FileProtectOutlined style={{ color: '#52c41a' }} />
                  <Text strong>关联证据：</Text>
                  {selectedIssue.evidence ? (
                    <Tag color="green" style={{ margin: 0 }}>
                      {selectedIssue.evidence.evidenceNo} - {selectedIssue.evidence.title}
                    </Tag>
                  ) : (
                    <Text type="secondary">无</Text>
                  )}
                </Space>
                {selectedIssue.evidence && (
                  <Button type="link" size="small">
                    查看证据 <RightOutlined />
                  </Button>
                )}
              </div>
            </Space>
          </Card>

          {(selectedIssue.parentIssueId || selectedIssue.childIssues?.length) && (
            <Card size="small" title="复发关联">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {selectedIssue.parentIssue && (
                  <div style={{ padding: 8, background: '#fff2f0', borderRadius: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      父问题（复发源）：
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="red" style={{ margin: 0 }}>
                        {selectedIssue.parentIssue.issueNo}
                      </Tag>
                      <span style={{ marginLeft: 8 }}>{selectedIssue.parentIssue.title}</span>
                    </div>
                  </div>
                )}
                {selectedIssue.childIssues?.length ? (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      子问题（由此复发）共 {selectedIssue.childIssues.length} 项：
                    </Text>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedIssue.childIssues.map((c) => (
                        <Tag key={c.id} color="orange">
                          {c.issueNo}: {c.title?.slice(0, 20)}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Space>
            </Card>
          )}
        </Space>
      ) : (
        <Empty description="未找到问题详情" />
      )}
    </Drawer>
  );

  const renderCreateModal = () => (
    <Modal
      title={
        <Space>
          <PlusOutlined style={{ color: '#1890ff' }} />
          新建问题
        </Space>
      }
      open={createOpen}
      onCancel={() => {
        setCreateOpen(false);
        createForm.resetFields();
      }}
      onOk={handleSubmitCreate}
      confirmLoading={createMutation.isPending}
      width={640}
      okText="提交"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={createForm}
        layout="vertical"
        preserve={false}
        initialValues={{
          severity: IssueSeverity.MODERATE,
          status: IssueStatus.IDENTIFIED,
        }}
      >
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              label="问题标题"
              name="title"
              rules={[{ required: true, message: '请输入问题标题' }]}
            >
              <Input placeholder="请输入问题标题" maxLength={200} showCount />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="问题描述" name="description">
              <TextArea rows={3} placeholder="请详细描述问题内容" maxLength={2000} showCount />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item
              label="严重度"
              name="severity"
              rules={[{ required: true, message: '请选择严重度' }]}
            >
              <Select
                options={Object.values(IssueSeverity).map((s) => ({
                  label: (
                    <Space>
                      <Tag color={ISSUE_SEVERITY_COLORS[s]} style={{ margin: 0 }}>
                        {SEVERITY_LABELS[s]}
                      </Tag>
                    </Space>
                  ),
                  value: s,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="初始状态" name="status">
              <Select
                options={[IssueStatus.IDENTIFIED, IssueStatus.MITIGATING].map((s) => ({
                  label: STATUS_LABELS[s],
                  value: s,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="关联任务" name="taskId">
              <Select
                showSearch
                placeholder="选择关联任务"
                filterOption={(input, option: any) =>
                  (option?.label || '').toLowerCase().includes(input.toLowerCase())
                }
                options={
                  allIssues.data?.items
                    ?.flatMap((i) => (i.task ? [{ label: `${i.task!.taskNo} - ${i.task!.title}`, value: i.task!.id }] : []))
                    .filter(
                      (v, i, arr) => arr.findIndex((t) => t.value === v.value) === i
                    ) || []
                }
              />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="关联证据" name="evidenceId">
              <Select
                showSearch
                placeholder="选择关联证据"
                filterOption={(input, option: any) =>
                  (option?.label || '').toLowerCase().includes(input.toLowerCase())
                }
                options={
                  allIssues.data?.items
                    ?.flatMap((i) =>
                      i.evidence ? [{ label: `${i.evidence!.evidenceNo} - ${i.evidence!.title}`, value: i.evidence!.id }] : []
                    )
                    .filter(
                      (v, i, arr) => arr.findIndex((t) => t.value === v.value) === i
                    ) || []
                }
              />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="类别" name="category">
              <Input placeholder="如：流程/制度/系统" />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="部门" name="department">
              <Input placeholder="负责部门" />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="负责人" name="ownerId">
              <Select
                showSearch
                placeholder="选择负责人"
                filterOption={(input, option: any) =>
                  (option?.label || '').toLowerCase().includes(input.toLowerCase())
                }
                options={
                  Array.from(
                    new Map(
                      allIssues.data?.items
                        ?.filter((i) => i.owner)
                        .map((i) => [
                          i.owner!.id,
                          {
                            label: `${i.owner!.fullName || i.owner!.username}${i.owner!.department ? `(${i.owner!.department})` : ''}`,
                            value: i.owner!.id,
                          },
                        ]) || []
                    ).values()
                  ) as any[]
                }
              />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="截止日期" name="dueDate">
              <DatePicker style={{ width: '100%' }} placeholder="选择整改截止日期" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  const renderRecurModal = () => (
    <Modal
      title={
        <Space>
          <RetweetOutlined style={{ color: '#f5222d' }} />
          标记问题复发
          {recurTargetIssue?.issueNo && <Tag color="red">{recurTargetIssue.issueNo}</Tag>}
        </Space>
      }
      open={recurOpen}
      onCancel={() => {
        setRecurOpen(false);
        setRecurTargetIssue(null);
        recurForm.resetFields();
      }}
      onOk={handleSubmitRecur}
      confirmLoading={markRecurredMutation.isPending}
      okText="确认标记复发"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <Alert
        type="warning"
        showIcon
        message="请选择父问题（原始问题）"
        description="本次问题将被视为所选父问题的复发，父问题的复发次数将自动增加。"
        style={{ marginBottom: 16 }}
      />
      <Form form={recurForm} layout="vertical" preserve={false}>
        <Form.Item
          label="选择父问题（原始问题来源）"
          name="parentIssueId"
          rules={[{ required: true, message: '请选择父问题' }]}
          extra="排除当前问题，只可选择其它问题作为父问题"
        >
          <Select
            showSearch
            placeholder="搜索并选择父问题"
            filterOption={(input, option: any) =>
              (option?.label || '').toLowerCase().includes(input.toLowerCase())
            }
            optionFilterProp="label"
            options={(allIssues.data?.items || [])
              .filter((i) => i.id !== recurTargetIssue?.id)
              .map((i) => ({
                label: `${i.issueNo} - ${i.title}${i.recurrenceCount > 0 ? ` [已复发${i.recurrenceCount}次]` : ''}`,
                value: i.id,
              }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        <Space>
          <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
          问题追踪
        </Space>
      </Title>

      {renderStatBar()}
      {renderFilterBar()}

      <Card
        size="small"
        styles={{ body: { padding: 0 } }}
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            共 {issuesData?.total || 0} 条记录
          </Text>
        }
      >
        {isLoading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={issuesData?.items || []}
            rowKey="id"
            size="small"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total: issuesData?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${t} 条`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            locale={{ emptyText: '暂无问题数据' }}
          />
        )}
      </Card>

      {renderDetailDrawer()}
      {renderCreateModal()}
      {renderRecurModal()}
    </div>
  );
}
