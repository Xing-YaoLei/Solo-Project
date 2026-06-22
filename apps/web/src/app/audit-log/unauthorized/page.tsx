'use client';

import React, { useState } from 'react';
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
  Descriptions,
  Alert,
} from 'antd';
import {
  SafetyOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  HistoryOutlined,
  UserOutlined,
  GlobalOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { auditLogApi } from '@/lib/api/audit-log';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import {
  UnauthorizedAccess,
  UnauthorizedSeverity,
  UnauthorizedStatus,
  UserRole,
  Permission,
} from '@/lib/api/types';
import { formatDateTime } from '@/lib/utils/format';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const SEVERITY_COLORS: Record<UnauthorizedSeverity, string> = {
  [UnauthorizedSeverity.LOW]: 'green',
  [UnauthorizedSeverity.MEDIUM]: 'blue',
  [UnauthorizedSeverity.HIGH]: 'orange',
  [UnauthorizedSeverity.CRITICAL]: 'red',
};

const STATUS_COLORS: Record<UnauthorizedStatus, string> = {
  [UnauthorizedStatus.PENDING]: 'gold',
  [UnauthorizedStatus.INVESTIGATING]: 'blue',
  [UnauthorizedStatus.RESOLVED]: 'green',
  [UnauthorizedStatus.DISMISSED]: 'default',
};

const SEVERITY_LABELS: Record<UnauthorizedSeverity, string> = {
  [UnauthorizedSeverity.LOW]: '低',
  [UnauthorizedSeverity.MEDIUM]: '中',
  [UnauthorizedSeverity.HIGH]: '高',
  [UnauthorizedSeverity.CRITICAL]: '严重',
};

const STATUS_LABELS: Record<UnauthorizedStatus, string> = {
  [UnauthorizedStatus.PENDING]: '待处理',
  [UnauthorizedStatus.INVESTIGATING]: '调查中',
  [UnauthorizedStatus.RESOLVED]: '已解决',
  [UnauthorizedStatus.DISMISSED]: '已忽略',
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.AUDITOR]: '审计员',
  [UserRole.BUSINESS_OWNER]: '业务负责人',
  [UserRole.COMPLIANCE_OFFICER]: '合规官',
  [UserRole.MANAGEMENT]: '管理层',
  [UserRole.ADMIN]: '管理员',
};

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.AUDITOR]: 'blue',
  [UserRole.BUSINESS_OWNER]: 'green',
  [UserRole.COMPLIANCE_OFFICER]: 'purple',
  [UserRole.MANAGEMENT]: 'orange',
  [UserRole.ADMIN]: 'red',
};

const SEVERITY_BG: Record<UnauthorizedSeverity, string> = {
  [UnauthorizedSeverity.LOW]: '#52c41a',
  [UnauthorizedSeverity.MEDIUM]: '#1890ff',
  [UnauthorizedSeverity.HIGH]: '#fa8c16',
  [UnauthorizedSeverity.CRITICAL]: '#f5222d',
};

const PERMISSION_LABELS: Partial<Record<Permission, string>> = {
  [Permission.TASK_CREATE]: '创建任务',
  [Permission.TASK_ASSIGN]: '分配任务',
  [Permission.TASK_VIEW]: '查看任务',
  [Permission.TASK_EDIT]: '编辑任务',
  [Permission.TASK_BATCH_UPDATE]: '批量更新任务',
  [Permission.TASK_DELETE]: '删除任务',
  [Permission.EVIDENCE_CREATE]: '创建证据',
  [Permission.EVIDENCE_UPLOAD]: '上传证据',
  [Permission.EVIDENCE_VIEW]: '查看证据',
  [Permission.EVIDENCE_EDIT]: '编辑证据',
  [Permission.EVIDENCE_SUBMIT]: '提交证据',
  [Permission.EVIDENCE_DELETE]: '删除证据',
  [Permission.REVIEW_CONDUCT]: '执行复核',
  [Permission.REVIEW_APPROVE]: '复核通过',
  [Permission.REVIEW_REJECT]: '复核拒绝',
  [Permission.REVIEW_VIEW]: '查看复核',
  [Permission.CHECKLIST_CREATE]: '创建清单',
  [Permission.CHECKLIST_VIEW]: '查看清单',
  [Permission.CHECKLIST_EDIT]: '编辑清单',
  [Permission.CHECKLIST_EXECUTE]: '执行清单',
  [Permission.SAMPLING_CREATE]: '创建抽样',
  [Permission.SAMPLING_VIEW]: '查看抽样',
  [Permission.SAMPLING_EDIT]: '编辑抽样',
  [Permission.SAMPLING_APPROVE]: '审批抽样',
  [Permission.TEMPLATE_CREATE]: '创建模板',
  [Permission.TEMPLATE_VIEW]: '查看模板',
  [Permission.TEMPLATE_EDIT]: '编辑模板',
  [Permission.TEMPLATE_USE]: '使用模板',
  [Permission.STATISTICS_VIEW]: '查看统计',
  [Permission.STATISTICS_EXPORT]: '导出统计',
  [Permission.USER_MANAGE]: '用户管理',
  [Permission.ROLE_MANAGE]: '角色管理',
  [Permission.AUDIT_LOG_VIEW]: '查看审计日志',
  [Permission.UNAUTHORIZED_VIEW]: '查看越权记录',
};

export default function UnauthorizedPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<{
    severity?: UnauthorizedSeverity;
    status?: UnauthorizedStatus;
    resourceType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UnauthorizedAccess | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [handleOpen, setHandleOpen] = useState(false);
  const [handleTarget, setHandleTarget] = useState<UnauthorizedAccess | null>(null);
  const [handleForm] = Form.useForm();

  const [dateRange, setDateRange] = useState<any>(null);

  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ['unauthorized', page, pageSize, keyword, filters],
    queryFn: () =>
      auditLogApi.getUnauthorizedAccess({
        page,
        pageSize,
        keyword,
        ...filters,
      }),
  });

  const { data: auditStats, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: auditLogApi.getAuditStats,
  });

  const handleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => auditLogApi.handleUnauthorized(id, data),
    onSuccess: () => {
      message.success('处理成功');
      setHandleOpen(false);
      handleForm.resetFields();
      setHandleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['unauthorized'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
      if (detailOpen && selectedRecord) {
        loadDetail(selectedRecord.id);
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || '处理失败');
    },
  });

  const userHistoryQuery = useQuery({
    queryKey: ['unauthorized', 'history', selectedRecord?.userId],
    queryFn: () =>
      auditLogApi.getUnauthorizedAccess({
        page: 1,
        pageSize: 20,
        userId: selectedRecord?.userId,
      }),
    enabled: !!selectedRecord?.userId,
  });

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await auditLogApi.getUnauthorizedDetail(id);
      setSelectedRecord(d);
    } catch (e) {
      // keep existing data
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = async (record: UnauthorizedAccess) => {
    setSelectedRecord(record);
    setDetailOpen(true);
    await loadDetail(record.id);
  };

  const handleOpenModal = (record: UnauthorizedAccess) => {
    setHandleTarget(record);
    handleForm.setFieldsValue({
      status: record.status === UnauthorizedStatus.RESOLVED || record.status === UnauthorizedStatus.DISMISSED
        ? UnauthorizedStatus.RESOLVED
        : record.status,
      severity: record.severity,
      handlingNote: '',
    });
    setHandleOpen(true);
  };

  const handleSubmitHandle = async () => {
    try {
      const values = await handleForm.validateFields();
      if (!handleTarget) return;
      handleMutation.mutate({ id: handleTarget.id, data: values });
    } catch (e) {
      // validation error
    }
  };

  const applyDateRange = () => {
    if (dateRange && dateRange.length === 2) {
      setFilters((f) => ({
        ...f,
        startDate: dateRange[0].startOf('day').toISOString(),
        endDate: dateRange[1].endOf('day').toISOString(),
      }));
    } else {
      setFilters((f) => ({
        ...f,
        startDate: undefined,
        endDate: undefined,
      }));
    }
  };

  const totalCount = auditStats?.unauthorized.total || 0;
  const pendingCount = auditStats?.unauthorized.pending || 0;
  const bySeverity = auditStats?.unauthorized.bySeverity || [];
  const severityTotal = bySeverity.reduce((s, a) => s + a.count, 0) || 1;

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 180,
      fixed: 'left' as const,
      render: (_: unknown, r: UnauthorizedAccess) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#1890ff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {r.userName?.[0] || '?'}
            </div>
            <Text strong style={{ fontSize: 13 }}>
              {r.userName}
            </Text>
          </Space>
          <Space size={4} style={{ paddingLeft: 26 }}>
            <Tag color={r.userRole ? ROLE_COLORS[r.userRole] : 'default'} style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
              {r.userRole ? ROLE_LABELS[r.userRole] : r.userRole}
            </Tag>
            {r.user?.department && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {r.user.department}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      width: 180,
      render: (_: unknown, r: UnauthorizedAccess) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <FileProtectOutlined style={{ color: '#722ed1' }} />
            <Text strong style={{ fontSize: 13 }}>
              {r.resourceType}
            </Text>
          </Space>
          {r.resourceTitle && (
            <Tooltip title={r.resourceTitle}>
              <Text type="secondary" style={{ fontSize: 11, paddingLeft: 20, maxWidth: 140, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.resourceTitle}
              </Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (a: string) => <Tag style={{ margin: 0 }}>{a}</Tag>,
    },
    {
      title: '尝试权限',
      dataIndex: 'attemptedPermission',
      key: 'attemptedPermission',
      width: 180,
      render: (p?: Permission) => (
        <Tooltip title={p}>
          <Tag color="purple" style={{ margin: 0 }}>
            {p ? PERMISSION_LABELS[p] || p : '-'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      align: 'center' as const,
      render: (s: UnauthorizedSeverity) => (
        <Tag color={SEVERITY_COLORS[s]} style={{ fontWeight: 600 }}>
          {SEVERITY_LABELS[s]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center' as const,
      render: (s: UnauthorizedStatus) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    {
      title: 'IP 地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip?: string) => (
        <Space size={4}>
          <GlobalOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {ip || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (d: string) => (
        <Tooltip title={formatDateTime(d)}>
          <Text style={{ fontSize: 12 }}>{formatDateTime(d)}</Text>
        </Tooltip>
      ),
      defaultSortOrder: 'descend' as const,
      sorter: (a: UnauthorizedAccess, b: UnauthorizedAccess) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: UnauthorizedAccess) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            处理
          </Button>
        </Space>
      ),
    },
  ];

  const renderStatBar = () => (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={12} md={6}>
        <Card size="small" style={{ border: 'none', background: totalCount > 0 ? '#fff2f0' : '#fafafa', height: '100%' }}>
          <Space align="center">
            <div style={{
              fontSize: 28, color: '#f5222d', width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <SafetyOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#595959' }}>越权总数</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f5222d', lineHeight: 1.2 }}>
                {totalCount}
              </div>
            </div>
          </Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" style={{ border: 'none', background: pendingCount > 0 ? '#fffbe6' : '#fafafa', height: '100%' }}>
          <Space align="center">
            <div style={{
              fontSize: 28, color: '#faad14', width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ClockCircleOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#595959' }}>待处理</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14', lineHeight: 1.2 }}>
                {pendingCount}
              </div>
            </div>
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" style={{ border: 'none', background: '#fafafa', height: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 12 }}>按严重度分布</Text>
            <Row gutter={[8, 8]}>
              {bySeverity.map((s) => {
                const percent = (s.count / severityTotal) * 100;
                return (
                  <Col xs={12} key={s.severity}>
                    <div
                      onClick={() => setFilters((f) => ({ ...f, severity: s.severity }))}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: 'white',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f5ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Tag color={SEVERITY_COLORS[s.severity]} style={{ margin: 0, fontSize: 11 }}>
                          {SEVERITY_LABELS[s.severity]}
                        </Tag>
                        <Text strong style={{ fontSize: 13 }}>{s.count}</Text>
                      </div>
                      <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: SEVERITY_BG[s.severity],
                          }}
                        />
                      </div>
                    </div>
                  </Col>
                );
              })}
              {bySeverity.length === 0 && (
                <Col xs={24}>
                  <Text type="secondary" style={{ fontSize: 11 }}>暂无数据</Text>
                </Col>
              )}
            </Row>
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const renderFilterBar = () => (
    <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: 12 } }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={6} lg={5}>
          <Input
            placeholder="搜索用户名/资源/IP"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            onPressEnter={() => { setPage(1); refetch(); }}
          />
        </Col>
        <Col xs={12} md={3} lg={2}>
          <Select
            placeholder="严重度"
            allowClear
            value={filters.severity}
            onChange={(v) => setFilters({ ...filters, severity: v })}
            style={{ width: '100%' }}
            options={Object.values(UnauthorizedSeverity).map((s) => ({
              label: SEVERITY_LABELS[s], value: s,
            }))}
          />
        </Col>
        <Col xs={12} md={3} lg={2}>
          <Select
            placeholder="状态"
            allowClear
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            style={{ width: '100%' }}
            options={Object.values(UnauthorizedStatus).map((s) => ({ label: STATUS_LABELS[s], value: s }))}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Input
            placeholder="资源类型"
            value={filters.resourceType}
            onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Input
            placeholder="用户 ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} md={6} lg={5}>
          <RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              if (v && v.length === 2 && v[0] && v[1]) {
                setFilters((f) => ({
                  ...f,
                  startDate: v[0]!.startOf('day').toISOString(),
                  endDate: v[1]!.endOf('day').toISOString(),
                }));
              } else {
                setFilters((f) => ({
                  ...f,
                  startDate: undefined,
                  endDate: undefined,
                }));
              }
            }}
          />
        </Col>
        <Col xs={24} md={24} lg={6} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Space wrap>
            <Button icon={<FilterOutlined />} onClick={() => { setPage(1); refetch(); }}>筛选</Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({});
                setKeyword('');
                setDateRange(null);
                setPage(1);
              }}
            >
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderDetailDrawer = () => (
    <Drawer
      title={
        <Space>
          <WarningOutlined style={{ color: '#f5222d' }} />
          越权详情
          {selectedRecord && (
            <Space>
              <Tag color={SEVERITY_COLORS[selectedRecord.severity]}>
                {SEVERITY_LABELS[selectedRecord.severity]}
              </Tag>
              <Tag color={STATUS_COLORS[selectedRecord.status]}>
                {STATUS_LABELS[selectedRecord.status]}
              </Tag>
            </Space>
          )}
        </Space>
      }
      placement="right"
      width={720}
      open={detailOpen}
      onClose={() => {
        setDetailOpen(false);
        setSelectedRecord(null);
      }}
      loading={detailLoading}
      destroyOnClose
      extra={
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => selectedRecord && handleOpenModal(selectedRecord)}
          >
            处理
          </Button>
        </Space>
      }
    >
      {selectedRecord ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={
              selectedRecord.severity === UnauthorizedSeverity.CRITICAL || selectedRecord.severity === UnauthorizedSeverity.HIGH
                ? 'error'
                : selectedRecord.severity === UnauthorizedSeverity.MEDIUM ? 'warning' : 'info'
            }
            showIcon
            message={
              <Space wrap>
                <UserOutlined /> <Text strong>{selectedRecord.userName}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({selectedRecord.userRole ? ROLE_LABELS[selectedRecord.userRole] || selectedRecord.userRole : selectedRecord.userRole})
                </Text>
                <span>尝试执行</span>
                <Tag color="purple">
                  {PERMISSION_LABELS[selectedRecord.attemptedPermission as Permission] || selectedRecord.attemptedPermission || '未知权限'}
                </Tag>
                <span>操作</span>
              </Space>
            }
            description={
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space size={4}>
                  <FileProtectOutlined />
                  <Text>资源：{selectedRecord.resourceType}</Text>
                  {selectedRecord.resourceTitle && (
                    <Text type="secondary">({selectedRecord.resourceTitle})</Text>
                  )}
                </Space>
                <Space size={4}>
                  <Text>动作：</Text>
                  <Tag>{selectedRecord.action}</Tag>
                </Space>
              </Space>
            }
          />

          <Card size="small" title="基本信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="记录ID" span={2}>
                <Text code style={{ wordBreak: 'break-all' }}>{selectedRecord.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedRecord.userName}</Descriptions.Item>
              <Descriptions.Item label="用户角色">
                <Tag color={selectedRecord.userRole ? ROLE_COLORS[selectedRecord.userRole] : 'default'}>
                  {selectedRecord.userRole ? ROLE_LABELS[selectedRecord.userRole] || selectedRecord.userRole : '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="所属部门">
                {selectedRecord.user?.department || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户邮箱">
                {selectedRecord.user?.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="资源类型">
                {selectedRecord.resourceType}
              </Descriptions.Item>
              <Descriptions.Item label="资源标题">
                {selectedRecord.resourceTitle || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="资源ID">
                <Text code>{selectedRecord.resourceId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="尝试操作">
                <Tag>{selectedRecord.action}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="尝试权限" span={2}>
                <Tag color="purple">
                  {PERMISSION_LABELS[selectedRecord.attemptedPermission as Permission] || selectedRecord.attemptedPermission}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                <Space>
                  <GlobalOutlined style={{ color: '#1890ff' }} />
                  <Text code>{selectedRecord.ipAddress || '-'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">
                {formatDateTime(selectedRecord.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {selectedRecord.userAgent && (
            <Card size="small" title="请求信息">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="User Agent">
                  <Paragraph style={{ margin: 0, fontSize: 12, wordBreak: 'break-all' }}>
                    {selectedRecord.userAgent}
                  </Paragraph>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {selectedRecord.requestParams && Object.keys(selectedRecord.requestParams).length > 0 && (
            <Card size="small" title="请求参数">
              <pre style={{
                margin: 0,
                padding: 12,
                background: '#fafafa',
                borderRadius: 6,
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(selectedRecord.requestParams, null, 2)}
              </pre>
            </Card>
          )}

          {(selectedRecord.handledBy || selectedRecord.handlingNote || selectedRecord.handledAt) && (
            <Card
              size="small"
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  处理信息
                </Space>
              }
              style={{ border: '1px solid #b7eb8f', background: '#f6ffed' }}
            >
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="处理人">
                  {selectedRecord.handledBy?.fullName || selectedRecord.handledBy?.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="处理时间">
                  {formatDateTime(selectedRecord.handledAt)}
                </Descriptions.Item>
                {selectedRecord.handlingNote && (
                  <Descriptions.Item label="处理备注" span={2}>
                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {selectedRecord.handlingNote}
                    </Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          <Card
            size="small"
            title={
              <Space>
                <HistoryOutlined />
                用户 {selectedRecord.userName} 的历史越权记录
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (共 {userHistoryQuery.data?.total || 0} 条)
                </Text>
              </Space>
            }
            loading={userHistoryQuery.isFetching}
          >
            <Table
              size="small"
              rowKey="id"
              pagination={{ pageSize: 5, size: 'small' }}
              dataSource={userHistoryQuery.data?.items || []}
              locale={{ emptyText: '无历史记录' }}
              columns={[
                {
                  title: '时间',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 150,
                  render: (d: string) => formatDateTime(d),
                  defaultSortOrder: 'descend' as const,
                },
                {
                  title: '资源',
                  key: 'resource',
                  render: (_: unknown, r: UnauthorizedAccess) => (
                    <Space size={4}>
                      <Text strong>{r.resourceType}</Text>
                      {r.resourceTitle && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({r.resourceTitle})
                        </Text>
                      )}
                    </Space>
                  ),
                },
                {
                  title: '权限',
                  dataIndex: 'attemptedPermission',
                  key: 'attemptedPermission',
                  render: (p) => (
                    <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>
                      {PERMISSION_LABELS[p as Permission] || p}
                    </Tag>
                  ),
                },
                {
                  title: '严重度',
                  dataIndex: 'severity',
                  key: 'severity',
                  align: 'center' as const,
                  width: 70,
                  render: (s: UnauthorizedSeverity) => (
                    <Tag color={SEVERITY_COLORS[s]} style={{ margin: 0 }}>
                      {SEVERITY_LABELS[s]}
                    </Tag>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  align: 'center' as const,
                  width: 80,
                  render: (s: UnauthorizedStatus) => (
                    <Tag color={STATUS_COLORS[s]} style={{ margin: 0 }}>
                      {STATUS_LABELS[s]}
                    </Tag>
                  ),
                },
                {
                  title: '操作',
                  key: 'action',
                  align: 'right' as const,
                  width: 60,
                  render: (_: unknown, r: UnauthorizedAccess) => (
                    <Button type="link" size="small" onClick={() => loadDetail(r.id)}>
                      查看
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      ) : (
        <Empty description="未找到记录详情" />
      )}
    </Drawer>
  );

  const renderHandleModal = () => (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#1890ff' }} />
          处理越权记录
          {handleTarget && (
            <Tag color={SEVERITY_COLORS[handleTarget.severity]}>
              {handleTarget.userName}
            </Tag>
          )}
        </Space>
      }
      open={handleOpen}
      onCancel={() => {
        setHandleOpen(false);
        setHandleTarget(null);
        handleForm.resetFields();
      }}
      onOk={handleSubmitHandle}
      confirmLoading={handleMutation.isPending}
      width={560}
      okText="确认处理"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={handleForm} layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col xs={12}>
            <Form.Item label="处理状态" name="status" rules={[{ required: true, message: '请选择处理状态' }]}>
              <Select
                options={[
                  {
                    label: (
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        已解决（已采取措施）
                      </Space>
                    ),
                    value: UnauthorizedStatus.RESOLVED,
                  },
                  {
                    label: (
                      <Space>
                        <CloseCircleOutlined style={{ color: '#8c8c8c' }} />
                        已忽略（误报/无需处理）
                      </Space>
                    ),
                    value: UnauthorizedStatus.DISMISSED,
                  },
                  {
                    label: (
                      <Space>
                        <ClockCircleOutlined style={{ color: '#1890ff' }} />
                        调查中（需进一步核查）
                      </Space>
                    ),
                    value: UnauthorizedStatus.INVESTIGATING,
                  },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="严重度" name="severity" rules={[{ required: true, message: '请选择严重度' }]}>
              <Select
                options={Object.values(UnauthorizedSeverity).map((s) => ({
                  label: (
                    <Space>
                      <Tag color={SEVERITY_COLORS[s]}>{SEVERITY_LABELS[s]}</Tag>
                    </Space>
                  ),
                  value: s,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              label="处理备注"
              name="handlingNote"
              rules={[{ required: true, message: '请填写处理备注' }]}
              extra="请详细描述处理措施或调查结论（必填）"
            >
              <TextArea
                rows={4}
                placeholder="如：已联系用户说明权限管理 / 调整权限 / 确认非故意操作 / 已加强安全审计 / 已限制IP访问控制 / 确认误报无需处理等"
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  return (
    <PermissionGuard
      role={[UserRole.MANAGEMENT, UserRole.ADMIN]}
      fallback={
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Alert
            type="warning"
            showIcon
            message="无权限访问"
            description="该功能仅管理层(MANAGEMENT)或管理员(ADMIN)角色可访问"
          />
        </div>
      }
    >
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
          <Space>
            <SafetyOutlined style={{ color: '#f5222d' }} />
            越权访问记录
          </Space>
        </Title>

        {statsLoading ? (
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {[1, 2, 3].map((i) => (
              <Col xs={12} md={8} key={i}>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Col>
            ))}
          </Row>
        ) : (
          renderStatBar()
        )}

        {renderFilterBar()}

        <Card
          size="small"
          styles={{ body: { padding: 0 } }}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {listData?.total || 0} 条记录
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
              dataSource={listData?.items || []}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              pagination={{
                current: page,
                pageSize,
                total: listData?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${t} 条`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{ emptyText: '暂无越权记录' }}
            />
          )}
        </Card>

        {renderDetailDrawer()}
        {renderHandleModal()}
      </div>
    </PermissionGuard>
  );
}
