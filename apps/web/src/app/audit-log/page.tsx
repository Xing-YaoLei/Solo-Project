'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Drawer,
  Typography,
  Empty,
  Skeleton,
  App,
  Tooltip,
  Descriptions,
  Alert,
  Input,
  Select,
  DatePicker,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  UserOutlined,
  GlobalOutlined,
  FileTextOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { auditLogApi } from '@/lib/api/audit-log';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import {
  OperationLog,
  OperationAction,
  UserRole,
} from '@/lib/api/types';
import { formatDateTime } from '@/lib/utils/format';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const ACTION_LABELS: Record<OperationAction, string> = {
  [OperationAction.CREATE]: '创建',
  [OperationAction.UPDATE]: '更新',
  [OperationAction.DELETE]: '删除',
  [OperationAction.SUBMIT]: '提交',
  [OperationAction.REVIEW]: '复核',
  [OperationAction.APPROVE]: '通过',
  [OperationAction.REJECT]: '驳回',
  [OperationAction.ASSIGN]: '分派',
  [OperationAction.UPLOAD]: '上传',
  [OperationAction.DOWNLOAD]: '下载',
  [OperationAction.EXPORT]: '导出',
  [OperationAction.BATCH_UPDATE]: '批量更新',
  [OperationAction.ARCHIVE]: '归档',
  [OperationAction.UNARCHIVE]: '取消归档',
};

const ACTION_COLORS: Record<OperationAction, string> = {
  [OperationAction.CREATE]: 'green',
  [OperationAction.UPDATE]: 'blue',
  [OperationAction.DELETE]: 'red',
  [OperationAction.SUBMIT]: 'cyan',
  [OperationAction.REVIEW]: 'purple',
  [OperationAction.APPROVE]: 'green',
  [OperationAction.REJECT]: 'red',
  [OperationAction.ASSIGN]: 'orange',
  [OperationAction.UPLOAD]: 'geekblue',
  [OperationAction.DOWNLOAD]: 'geekblue',
  [OperationAction.EXPORT]: 'magenta',
  [OperationAction.BATCH_UPDATE]: 'blue',
  [OperationAction.ARCHIVE]: 'default',
  [OperationAction.UNARCHIVE]: 'default',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  AuditTask: '审计任务',
  Evidence: '证据',
  User: '用户',
  ReviewRecord: '复核记录',
  Checklist: '检查清单',
  SamplingRecord: '抽样记录',
  Issue: '问题',
};

export default function OperationLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<{
    action?: OperationAction;
    targetType?: string;
    operatorId?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OperationLog | null>(null);

  const [dateRange, setDateRange] = useState<any>(null);

  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ['operation-logs', page, pageSize, keyword, filters],
    queryFn: () =>
      auditLogApi.getOperationLogs({
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

  const handleViewDetail = (record: OperationLog) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const totalCount = auditStats?.operations.total || 0;
  const byAction = auditStats?.operations.byAction || [];
  const byTargetType = auditStats?.operations.byTargetType || [];

  const columns = [
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
      sorter: (a: OperationLog, b: OperationLog) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作人',
      key: 'operator',
      width: 160,
      render: (_: unknown, r: OperationLog) => (
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
              {r.operatorName?.[0] || '?'}
            </div>
            <Text strong style={{ fontSize: 13 }}>
              {r.operatorName}
            </Text>
          </Space>
          {r.operator?.department && (
            <Text type="secondary" style={{ fontSize: 11, paddingLeft: 26 }}>
              {r.operator.department}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (a: OperationAction) => (
        <Tag color={ACTION_COLORS[a]} style={{ margin: 0 }}>
          {ACTION_LABELS[a] || a}
        </Tag>
      ),
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (t: string) => (
        <Space size={4}>
          <FileTextOutlined style={{ color: '#722ed1' }} />
          <Tag style={{ margin: 0 }}>
            {TARGET_TYPE_LABELS[t] || t}
          </Tag>
        </Space>
      ),
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 180,
      render: (id: string) => (
        <Space size={4}>
          <AimOutlined style={{ color: '#fa8c16', fontSize: 12 }} />
          <Text code style={{ fontSize: 12 }}>
            {id?.length > 20 ? id.slice(0, 20) + '...' : id}
          </Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (d?: string) => (
        <Tooltip title={d}>
          <Text style={{ fontSize: 12 }}>{d || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'IP 地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
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
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: OperationLog) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const renderStatBar = () => (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={12} md={6}>
        <Card size="small" style={{ border: 'none', background: totalCount > 0 ? '#e6f7ff' : '#fafafa', height: '100%' }}>
          <Space align="center">
            <div style={{
              fontSize: 28, color: '#1890ff', width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <HistoryOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#595959' }}>操作日志总数</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff', lineHeight: 1.2 }}>
                {totalCount}
              </div>
            </div>
          </Space>
        </Card>
      </Col>
      <Col xs={12} md={6}>
        <Card size="small" style={{ border: 'none', background: '#fafafa', height: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 12 }}>按目标类型</Text>
            <Space wrap>
              {byTargetType.slice(0, 4).map((t) => (
                <Tag key={t.targetType}>
                  {TARGET_TYPE_LABELS[t.targetType] || t.targetType}: {t.count}
                </Tag>
              ))}
              {byTargetType.length === 0 && (
                <Text type="secondary" style={{ fontSize: 11 }}>暂无数据</Text>
              )}
            </Space>
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" style={{ border: 'none', background: '#fafafa', height: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 12 }}>按操作类型分布</Text>
            <Row gutter={[8, 8]}>
              {byAction.map((a) => (
                <Col xs={12} md={6} key={a.action}>
                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color={ACTION_COLORS[a.action as OperationAction]} style={{ margin: 0, fontSize: 11 }}>
                        {ACTION_LABELS[a.action as OperationAction] || a.action}
                      </Tag>
                      <Text strong style={{ fontSize: 13 }}>{a.count}</Text>
                    </div>
                  </div>
                </Col>
              ))}
              {byAction.length === 0 && (
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
            placeholder="搜索描述/目标ID"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            onPressEnter={() => { setPage(1); refetch(); }}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Select
            placeholder="操作类型"
            allowClear
            value={filters.action}
            onChange={(v) => setFilters({ ...filters, action: v })}
            style={{ width: '100%' }}
            options={Object.values(OperationAction).map((a) => ({
              label: ACTION_LABELS[a] || a, value: a,
            }))}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Select
            placeholder="目标类型"
            allowClear
            value={filters.targetType}
            onChange={(v) => setFilters({ ...filters, targetType: v })}
            style={{ width: '100%' }}
            options={Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => ({ label: v, value: k }))}
          />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <Input
            placeholder="操作人 ID"
            value={filters.operatorId}
            onChange={(e) => setFilters({ ...filters, operatorId: e.target.value })}
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
          <HistoryOutlined style={{ color: '#1890ff' }} />
          操作日志详情
          {selectedRecord && (
            <Tag color={ACTION_COLORS[selectedRecord.action as OperationAction]}>
              {ACTION_LABELS[selectedRecord.action as OperationAction] || selectedRecord.action}
            </Tag>
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
      destroyOnClose
    >
      {selectedRecord ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={
              <Space wrap>
                <UserOutlined /> <Text strong>{selectedRecord.operatorName}</Text>
                <span>执行了</span>
                <Tag color={ACTION_COLORS[selectedRecord.action as OperationAction]}>
                  {ACTION_LABELS[selectedRecord.action as OperationAction] || selectedRecord.action}
                </Tag>
                <span>操作</span>
              </Space>
            }
            description={selectedRecord.description || '无描述'}
          />

          <Card size="small" title="基本信息">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="记录ID" span={2}>
                <Text code style={{ wordBreak: 'break-all' }}>{selectedRecord.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{selectedRecord.operatorName}</Descriptions.Item>
              <Descriptions.Item label="操作人ID">
                <Text code>{selectedRecord.operatorId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag color={ACTION_COLORS[selectedRecord.action as OperationAction]}>
                  {ACTION_LABELS[selectedRecord.action as OperationAction] || selectedRecord.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标类型">
                {TARGET_TYPE_LABELS[selectedRecord.targetType] || selectedRecord.targetType}
              </Descriptions.Item>
              <Descriptions.Item label="目标ID" span={2}>
                <Text code style={{ wordBreak: 'break-all' }}>{selectedRecord.targetId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">
                {formatDateTime(selectedRecord.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                <Space>
                  <GlobalOutlined style={{ color: '#1890ff' }} />
                  <Text code>{selectedRecord.ipAddress || '-'}</Text>
                </Space>
              </Descriptions.Item>
              {selectedRecord.taskId && (
                <Descriptions.Item label="关联任务ID">
                  <Text code>{selectedRecord.taskId}</Text>
                </Descriptions.Item>
              )}
              {selectedRecord.evidenceId && (
                <Descriptions.Item label="关联证据ID">
                  <Text code>{selectedRecord.evidenceId}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="描述" span={2}>
                {selectedRecord.description || '-'}
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

          {selectedRecord.beforeData && Object.keys(selectedRecord.beforeData).length > 0 && (
            <Card size="small" title="变更前数据 (beforeData)">
              <pre style={{
                margin: 0,
                padding: 12,
                background: '#fff2e8',
                borderRadius: 6,
                fontSize: 12,
                maxHeight: 300,
                overflow: 'auto',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(selectedRecord.beforeData, null, 2)}
              </pre>
            </Card>
          )}

          {selectedRecord.afterData && Object.keys(selectedRecord.afterData).length > 0 && (
            <Card size="small" title="变更后数据 (afterData)">
              <pre style={{
                margin: 0,
                padding: 12,
                background: '#f6ffed',
                borderRadius: 6,
                fontSize: 12,
                maxHeight: 300,
                overflow: 'auto',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(selectedRecord.afterData, null, 2)}
              </pre>
            </Card>
          )}
        </Space>
      ) : (
        <Empty description="未找到记录详情" />
      )}
    </Drawer>
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
            <HistoryOutlined style={{ color: '#1890ff' }} />
            操作日志
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
              locale={{ emptyText: '暂无操作日志' }}
            />
          )}
        </Card>

        {renderDetailDrawer()}
      </div>
    </PermissionGuard>
  );
}
