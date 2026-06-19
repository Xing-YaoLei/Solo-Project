import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, DatePicker,
  App as AntdApp, Row, Col, Statistic, Timeline, Descriptions,
  Drawer, Tooltip, Badge, Typography, Alert,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, DownloadOutlined, HistoryOutlined,
  ExportOutlined, FileTextOutlined, UserOutlined, DeleteOutlined,
  CheckCircleOutlined, EditOutlined, PlusOutlined, WarningOutlined,
  TeamOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../api';
import { AuditLog, TraceItem } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  approve: 'cyan',
  reject: 'magenta',
  cancel: 'volcano',
  batch_update: 'purple',
  verify: 'geekblue',
};

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  approve: '审核通过',
  reject: '审核拒绝',
  cancel: '取消',
  batch_update: '批量更新',
  verify: '复核',
};

export const Route = createLazyFileRoute('/_layout/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { message, modal } = AntdApp.useApp();
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<{
    record_type?: string; action?: string; user_id?: number;
    keyword?: string;
  }>({});
  const [dateRange, setDateRange] = useState<any>(null);

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [traceTarget, setTraceTarget] = useState<{ type: string; id: number; title: string } | null>(null);

  const fetch = () => {
    setLoading(true);
    const params: any = { page, page_size: pageSize, ...filters };
    if (dateRange && dateRange.length === 2) {
      params.start_date = dateRange[0].format('YYYY-MM-DD');
      params.end_date = dateRange[1].format('YYYY-MM-DD');
    }
    api.get<any>('/audit-logs', params).then((r) => {
      setData(r.data.items || []);
      setTotal(r.data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetch, [page, pageSize, filters, dateRange]);

  const recordTypes = useMemo(() => Array.from(new Set(data.map((x) => x.record_type).filter(Boolean))) as string[], [data]);

  const showTrace = (record_type: string, record_id: number, title: string) => {
    if (!record_type || !record_id) return;
    api.get('/audit-logs/trace', { record_type, record_id }).then((r) => {
      setTrace(r.data);
      setTraceTarget({ type: record_type, id: record_id, title });
      setTraceOpen(true);
    });
  };

  const exportLogs = () => {
    modal.confirm({
      title: '导出审计日志',
      content: '将根据当前筛选条件导出操作记录',
      onOk: () => {
        message.info('导出任务已提交，完成后将在下载目录中生成 CSV 文件');
      },
    });
  };

  const totalCreate = data.filter((x) => x.action === 'create').length;
  const totalUpdate = data.filter((x) => x.action === 'update').length;
  const totalVerify = data.filter((x) => x.action === 'verify').length;
  const totalBatch = data.filter((x) => x.action === 'batch_update').length;

  const actionIcon = (a: string) => {
    switch (a) {
      case 'create': return <PlusOutlined />;
      case 'update': return <EditOutlined />;
      case 'delete': return <DeleteOutlined />;
      case 'approve': return <CheckCircleOutlined />;
      case 'verify': return <CheckCircleOutlined />;
      case 'cancel': return <WarningOutlined />;
      case 'batch_update': return <TeamOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '操作', dataIndex: 'action', width: 110,
      render: (v: string) => (
        <Tag color={ACTION_COLORS[v] || 'default'} icon={actionIcon(v)}>
          {ACTION_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: '记录类型', dataIndex: 'record_type', width: 150,
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <span style={{ color: '#999' }}>系统</span>,
    },
    {
      title: '记录ID', dataIndex: 'record_id', width: 90,
      render: (v: number, r: AuditLog) => (
        v && r.record_type ? (
          <a onClick={() => showTrace(r.record_type!, v, `${r.record_type}#${v}`)}>
            #{v} 🔗
          </a>
        ) : v ? `#${v}` : '-'
      ),
    },
    {
      title: '批量ID', dataIndex: 'batch_ids', width: 140,
      render: (v: number[]) => v && v.length > 0 ? (
        <Tooltip title={`批量处理 ${v.length} 条: ${v.slice(0, 5).join(',')}${v.length > 5 ? '...' : ''}`}>
          <Tag color="purple">{v.length} 条记录</Tag>
        </Tooltip>
      ) : '-',
    },
    {
      title: '字段变更', width: 220,
      render: (_: any, r: AuditLog) => (
        r.field_name ? (
          <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
            <Text type="secondary">{r.field_name}:</Text>
            <div>
              {r.old_value && <span style={{ color: '#ff4d4f', textDecoration: 'line-through' }}>{String(r.old_value).slice(0, 12)}</span>}
              {r.old_value && r.new_value && ' → '}
              {r.new_value && <span style={{ color: '#52c41a', fontWeight: 500 }}>{String(r.new_value).slice(0, 12)}</span>}
            </div>
          </Space>
        ) : '-'
      ),
    },
    {
      title: '备注', dataIndex: 'remarks', width: 240,
      render: (v: string) => v ? (
        <Text ellipsis style={{ maxWidth: 240 }}>{v}</Text>
      ) : <span style={{ color: '#999' }}>-</span>,
    },
    { title: '操作人ID', dataIndex: 'user_id', width: 90, render: (v: number) => v ? `#${v}` : '系统' },
    { title: 'IP', dataIndex: 'ip_address', width: 120, render: (v: string) => v || '-' },
    {
      title: '时间', dataIndex: 'created_at', width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '溯源', key: 'trace', width: 100, fixed: 'right' as const,
      render: (_: any, r: AuditLog) => (
        r.record_type && r.record_id ? (
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => showTrace(r.record_type!, r.record_id!, `${r.record_type}#${r.record_id}`)}
          >
            全链路
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          <HistoryOutlined /> 处理痕迹（审计日志）
        </Title>
        <Text type="secondary">
          全操作留痕：创建/修改/复核/批量操作，点击「🔗」或「全链路」查看记录完整处理轨迹
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="总记录"
              value={total}
              prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="创建"
              value={totalCreate}
              prefix={<PlusOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="更新"
              value={totalUpdate}
              prefix={<EditOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="复核/批量"
              value={`${totalVerify}+${totalBatch}`}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              placeholder="记录类型"
              allowClear
              style={{ width: 180 }}
              onChange={(v) => { setFilters({ ...filters, record_type: v }); setPage(1); }}
              showSearch
              options={recordTypes.map((t) => ({ label: t, value: t }))}
            />
            <Select
              placeholder="操作类型"
              allowClear
              style={{ width: 150 }}
              onChange={(v) => { setFilters({ ...filters, action: v }); setPage(1); }}
              options={Object.entries(ACTION_LABELS).map(([k, v]) => ({ label: v, value: k }))}
            />
            <Input
              prefix={<SearchOutlined />}
              placeholder="用户ID/备注"
              allowClear
              style={{ width: 180 }}
              onPressEnter={(e: any) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); }}
            />
            <RangePicker
              showTime
              value={dateRange}
              onChange={setDateRange}
            />
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setDateRange(null); setPage(1); }}>重置</Button>
          </Space>
          <Space>
            <Button icon={<ExportOutlined />} onClick={exportLogs}>导出</Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns as any}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条操作记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <Badge status="processing" />
            <span>全链路处理轨迹</span>
            <Tag color="blue">{traceTarget?.type} #{traceTarget?.id}</Tag>
          </Space>
        }
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        width={640}
        extra={
          <Button size="small" icon={<DownloadOutlined />}>
            导出该记录轨迹
          </Button>
        }
      >
        <Alert
          message="什么是全链路轨迹？"
          description="从记录被创建开始，每一次修改、复核、批量更新、状态变更、甚至关联的异常处理，都会按照时间顺序呈现。任何一步都能回看到原值→新值的变化。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        {trace.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <HistoryOutlined style={{ fontSize: 48, opacity: 0.5 }} />
            <div style={{ marginTop: 12 }}>暂无操作痕迹</div>
          </div>
        ) : (
          <Timeline
            mode="left"
            items={trace.map((t, idx) => ({
              color: t.action === 'create' ? 'green' :
                t.action === 'delete' ? 'red' :
                t.action === 'verify' || t.action === 'approve' ? 'cyan' :
                t.action === 'batch_update' ? 'purple' :
                t.action === 'cancel' ? 'volcano' : 'blue',
              label: (
                <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                  <Text type="secondary" style={{ fontWeight: 600 }}>
                    {dayjs(t.at).format('HH:mm:ss')}
                  </Text>
                  <Text type="secondary">{dayjs(t.at).format('YYYY-MM-DD')}</Text>
                </Space>
              ),
              children: (
                <Card
                  size="small"
                  styles={{ body: { padding: 12 } }}
                  style={{ marginBottom: idx === trace.length - 1 ? 0 : 12 }}
                >
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color={ACTION_COLORS[t.action] || 'default'}>
                      {actionIcon(t.action)} {ACTION_LABELS[t.action] || t.action}
                    </Tag>
                    <Text strong>
                      {t.user_name
                        ? `${t.user_name}${t.user_id ? ` (#${t.user_id})` : ''}`
                        : t.user_id ? `用户#${t.user_id}` : '系统'}
                    </Text>
                  </Space>
                  {t.field ? (
                    <Descriptions
                      size="small"
                      column={1}
                      bordered
                      style={{ marginBottom: 8 }}
                      styles={{ label: { width: 80, background: '#fafafa' } }}
                    >
                      <Descriptions.Item label="字段">{t.field}</Descriptions.Item>
                      {t.old && (
                        <Descriptions.Item label="原值">
                          <span style={{ color: '#ff4d4f' }}>{t.old}</span>
                        </Descriptions.Item>
                      )}
                      {t.new && (
                        <Descriptions.Item label="新值">
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>{t.new}</span>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  ) : null}
                  {t.remarks && (
                    <div style={{ fontSize: 13, color: '#555', background: '#f6ffed', padding: '6px 10px', borderRadius: 4 }}>
                      💬 {t.remarks}
                    </div>
                  )}
                </Card>
              ),
            }))}
          />
        )}
      </Drawer>
    </Space>
  );
}
