import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Drawer, Timeline, App as AntdApp, Row, Col, Statistic,
  Tooltip, Badge, Descriptions, Alert, Divider, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, WarningOutlined, RollbackOutlined,
  CloseCircleOutlined, ThunderboltOutlined, ThunderboltFilled,
  SafetyCertificateOutlined, QuestionCircleOutlined,
  ExclamationCircleOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import {
  STATUS_COLORS, STATUS_LABELS, ExceptionRecord, RecordStatusEnum,
  TraceItem, EXCEPTION_LABELS, ExceptionTypeEnum,
} from '../../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const EXCEPTION_ICONS: Record<ExceptionTypeEnum, any> = {
  performance_cancel: <CloseCircleOutlined />,
  route_change: <EnvironmentOutlined />,
  equipment_failure: <ThunderboltFilled />,
  weather_issue: <QuestionCircleOutlined />,
  staff_absence: <ExclamationCircleOutlined />,
  other: <WarningOutlined />,
};

const EXCEPTION_COLORS: Record<ExceptionTypeEnum, string> = {
  performance_cancel: '#ff4d4f',
  route_change: '#1677ff',
  equipment_failure: '#722ed1',
  weather_issue: '#13c2c2',
  staff_absence: '#fa8c16',
  other: '#8c8c8c',
};

export const Route = createLazyFileRoute('/_layout/operations/exceptions')({
  component: ExceptionsPage,
});

function ExceptionsPage() {
  const { message, modal } = AntdApp.useApp();
  const [data, setData] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{
    exception_type?: ExceptionTypeEnum; related_type?: string; status?: RecordStatusEnum;
  }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [current, setCurrent] = useState<ExceptionRecord | null>(null);
  const [form] = Form.useForm();

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);

  const [originalOpen, setOriginalOpen] = useState(false);
  const [original, setOriginal] = useState<any>(null);

  const fetch = () => {
    setLoading(true);
    api.get<any>('/operations/exceptions', { page, page_size: pageSize, ...filters }).then((r) => {
      setData(r.data.items || []);
      setTotal(r.data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetch, [page, pageSize, filters]);

  const openModal = (mode: 'create' | 'update' | 'view', record?: ExceptionRecord) => {
    setModalMode(mode);
    setCurrent(record || null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = { ...v };
      if (modalMode === 'create') {
        await api.post('/operations/exceptions', payload);
        message.success('已创建异常记录');
      } else if (modalMode === 'update' && current) {
        await api.put(`/operations/exceptions/${current.id}`, payload);
        message.success('更新成功');
      }
      setModalOpen(false);
      fetch();
    } catch {}
  };

  const resolve = (r: ExceptionRecord) => {
    modal.confirm({
      title: '处理完成？',
      icon: <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
      content: (
        <Form layout="vertical" id="resolve-form">
          <Form.Item label="根因分析" name="root_cause">
            <TextArea id="resolve-cause" rows={3} placeholder="分析根本原因" />
          </Form.Item>
          <Form.Item label="处理方案与结果" name="resolution">
            <TextArea id="resolve-resolution" rows={4} placeholder="详细说明如何处理、涉及哪些人员和补偿措施等" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const cause = (document.getElementById('resolve-cause') as HTMLTextAreaElement)?.value;
        const resolution = (document.getElementById('resolve-resolution') as HTMLTextAreaElement)?.value;
        await api.put(`/operations/exceptions/${r.id}`, {
          status: 'completed',
          root_cause: cause || undefined,
          resolution: resolution || undefined,
        });
        message.success('处理完成');
        fetch();
      },
    });
  };

  const showTrace = (id: number) => {
    api.get('/audit-logs/trace', { record_type: 'exception_record', record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceOpen(true);
    });
  };

  const showOriginal = async (r: ExceptionRecord) => {
    if (!r.original_record_type || !r.original_record_id) {
      message.warning('该异常未关联原始记录');
      return;
    }
    try {
      const res = await api.get(`/operations/exceptions/${r.id}/original`);
      setOriginal(res.data);
      setOriginalOpen(true);
    } catch {
      message.error('获取原始记录失败');
    }
  };

  const columns = [
    {
      title: '类型', dataIndex: 'exception_type', width: 120,
      render: (v: ExceptionTypeEnum) => (
        <Tag color={EXCEPTION_COLORS[v]} icon={EXCEPTION_ICONS[v]}>
          {EXCEPTION_LABELS[v]}
        </Tag>
      ),
    },
    {
      title: '标题', dataIndex: 'title', width: 260,
      render: (v: string, r: ExceptionRecord) => (
        <Space>
          <a onClick={() => openModal('view', r)}>{v}</a>
          {r.original_record_type && (
            <Tooltip title={`关联${r.original_record_type}#${r.original_record_id}，点击查看原始数据`}>
              <Button
                type="link"
                size="small"
                icon={<RollbackOutlined />}
                onClick={(e) => { e.stopPropagation(); showOriginal(r); }}
              >
                溯源
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '关联对象', width: 140,
      render: (_: any, r: ExceptionRecord) => (
        r.related_type ? <Tag>{r.related_type} #{r.related_id}</Tag> : '-'
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: RecordStatusEnum) => (
        <Space>
          <Badge
            status={
              v === 'completed' ? 'success' : v === 'cancelled' ? 'default' : v === 'rejected' ? 'error' : 'warning'
            }
            text={<Tag color={STATUS_COLORS[v]} style={{ margin: 0 }}>{STATUS_LABELS[v]}</Tag>}
          />
        </Space>
      ),
    },
    {
      title: '发生时间', dataIndex: 'occurred_at', width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '处理时间', dataIndex: 'resolved_at', width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : <Tag color="warning">处理中</Tag>,
    },
    {
      title: '创建', dataIndex: 'created_at', width: 140,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作', key: 'actions', width: 260, fixed: 'right' as const,
      render: (_: any, r: ExceptionRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace(r.id)}>痕迹</Button>
          <Button type="link" size="small" onClick={() => openModal('view', r)}>详情</Button>
          {r.status !== 'completed' && r.status !== 'cancelled' && (
            <>
              <Button type="link" size="small" onClick={() => openModal('update', r)}>更新</Button>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => resolve(r)}>
                处理完成
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 统计
  const pendingCount = data.filter((x) => x.status === 'pending').length;
  const perfCancelCount = data.filter((x) => x.exception_type === 'performance_cancel').length;
  const todayCount = data.filter((x) => dayjs(x.created_at).isSame(dayjs(), 'day')).length;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="异常处理说明"
        description={(
          <Space direction="vertical" size={4}>
            <Text>1. 演出取消等特殊情况会自动创建异常记录并标记关联，可一键"溯源"查看原始数据</Text>
            <Text>2. 处理完成前请补充根因分析和解决方案，所有修改都会记录操作痕迹</Text>
          </Space>
        )}
        type="warning"
        showIcon
        closable
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="异常总数"
              value={total}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="待处理"
              value={pendingCount}
              prefix={<Badge status="warning" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="演出取消"
              value={perfCancelCount}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={todayCount}
              prefix={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              placeholder="异常类型"
              allowClear
              style={{ width: 160 }}
              onChange={(v) => { setFilters({ ...filters, exception_type: v }); setPage(1); }}
            >
              {(Object.keys(EXCEPTION_LABELS) as ExceptionTypeEnum[]).map((t) => (
                <Option key={t} value={t}>{EXCEPTION_LABELS[t]}</Option>
              ))}
            </Select>
            <Select
              placeholder="关联类型"
              allowClear
              style={{ width: 150 }}
              onChange={(v) => { setFilters({ ...filters, related_type: v }); setPage(1); }}
            >
              <Option value="performance_session">演出场次</Option>
              <Option value="guide_route">导览路线</Option>
              <Option value="heat_point">热力点位</Option>
              <Option value="ticket">票务</Option>
            </Select>
            <Select
              placeholder="处理状态"
              allowClear
              style={{ width: 140 }}
              onChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}
            >
              {(['pending', 'approved', 'completed', 'cancelled', 'rejected'] as RecordStatusEnum[]).map((s) => (
                <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')}>
            新增异常记录
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns as any}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={
          modalMode === 'create'
            ? '📝 新增异常记录'
            : modalMode === 'update'
            ? '✏️ 更新异常记录'
            : '🔍 异常详情'
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={modalMode === 'view' ? undefined : handleSubmit}
        okButtonProps={modalMode === 'view' ? { style: { display: 'none' } } : undefined}
        cancelText={modalMode === 'view' ? '关闭' : '取消'}
        width={720}
        destroyOnClose
      >
        {modalMode === 'view' && current ? (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={EXCEPTION_COLORS[current.exception_type]} icon={EXCEPTION_ICONS[current.exception_type]}>
                {EXCEPTION_LABELS[current.exception_type]}
              </Tag>
              <Badge
                status={
                  current.status === 'completed' ? 'success' :
                  current.status === 'pending' ? 'warning' :
                  current.status === 'cancelled' ? 'default' : 'error'
                }
                text={
                  <Tag color={STATUS_COLORS[current.status]} style={{ margin: 0 }}>
                    {STATUS_LABELS[current.status]}
                  </Tag>
                }
              />
              {current.original_record_type && (
                <Button size="small" icon={<RollbackOutlined />} onClick={() => showOriginal(current)}>
                  查看原始记录 ({current.original_record_type}#{current.original_record_id})
                </Button>
              )}
            </Space>
            <Title level={4} style={{ margin: 0 }}>{current.title}</Title>

            <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="关联对象">
                {current.related_type ? `${current.related_type} #${current.related_id}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">
                {current.occurred_at ? dayjs(current.occurred_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {current.handled_by ? `用户#${current.handled_by}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="解决时间">
                {current.resolved_at ? dayjs(current.resolved_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{current.created_by ? `用户#${current.created_by}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(current.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">描述</Divider>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {current.description || <Text type="secondary">无</Text>}
            </Paragraph>

            {current.root_cause && (
              <>
                <Divider orientation="left">根因分析</Divider>
                <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#fffbe6', padding: 12, borderRadius: 4 }}>
                  {current.root_cause}
                </Paragraph>
              </>
            )}

            {current.resolution && (
              <>
                <Divider orientation="left">处理方案与结果</Divider>
                <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#f6ffed', padding: 12, borderRadius: 4 }}>
                  {current.resolution}
                </Paragraph>
              </>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="异常类型" name="exception_type" rules={[{ required: true }]}>
              <Select>
                {(Object.keys(EXCEPTION_LABELS) as ExceptionTypeEnum[]).map((t) => (
                  <Option key={t} value={t}>{EXCEPTION_LABELS[t]}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="标题" name="title" rules={[{ required: true }]}>
              <Input placeholder="简明描述问题，如：10:00场次临时取消" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="关联类型" name="related_type">
                  <Select allowClear placeholder="如演出场次/导览路线等">
                    <Option value="performance_session">演出场次</Option>
                    <Option value="guide_route">导览路线</Option>
                    <Option value="heat_point">热力点位</Option>
                    <Option value="ticket">票务</Option>
                    <Option value="guide_content">导览内容</Option>
                    <Option value="seat">座位</Option>
                    <Option value="merchant_contract">商户合同</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="关联ID" name="related_id">
                  <Input type="number" placeholder="输入对应记录ID" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="原始记录类型" name="original_record_type">
                  <Select allowClear placeholder="用于溯源">
                    <Option value="performance_session">演出场次</Option>
                    <Option value="guide_route">导览路线</Option>
                    <Option value="ticket">票务</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="原始记录ID" name="original_record_id">
                  <Input type="number" />
                </Form.Item>
              </Col>
            </Row>
            {modalMode === 'update' && (
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="状态" name="status" initialValue="pending">
                    <Select>
                      {(['pending', 'approved', 'completed', 'rejected', 'cancelled'] as RecordStatusEnum[]).map((s) => (
                        <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Form.Item label="问题描述" name="description">
              <TextArea rows={4} placeholder="详细描述发生了什么，影响哪些用户等" />
            </Form.Item>
            {modalMode === 'update' && (
              <>
                <Form.Item label="根因分析" name="root_cause">
                  <TextArea rows={3} />
                </Form.Item>
                <Form.Item label="处理方案" name="resolution">
                  <TextArea rows={4} />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>

      <Drawer title="🔍 溯源：查看原始记录" open={originalOpen} onClose={() => setOriginalOpen(false)} width={640}>
        {original && original.has_original ? (
          <div>
            <Alert
              message={`记录类型: ${original.record_type} #${original.record_id}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={1}>
              {original.data ? Object.entries(original.data).map(([k, v]: any) => (
                <Descriptions.Item key={k} label={k}>{String(v || '-')}</Descriptions.Item>
              )) : null}
            </Descriptions>
          </div>
        ) : (
          <Alert message="未关联原始记录" type="info" showIcon />
        )}
      </Drawer>

      <Drawer title="处理痕迹" open={traceOpen} onClose={() => setTraceOpen(false)} width={600}>
        <Timeline
          items={trace.map((t) => ({
            color: t.action === 'create' ? 'orange' : t.action === 'approve' ? 'green' : t.action === 'cancel' ? 'red' : 'blue',
            children: (
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <Tag>{t.action}</Tag>
                  <b>{t.user_name || '系统'}</b>
                  <span style={{ color: '#999' }}>{dayjs(t.at).format('MM-DD HH:mm')}</span>
                </Space>
                {t.field && (
                  <div style={{ marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    <div>字段：{t.field}</div>
                    {t.old && <div style={{ color: '#f00' }}>原: {t.old}</div>}
                    {t.new && <div style={{ color: '#0a0' }}>新: {t.new}</div>}
                  </div>
                )}
                {t.remarks && <div style={{ marginTop: 4 }}>{t.remarks}</div>}
              </div>
            ),
          }))}
        />
      </Drawer>
    </Space>
  );
}
