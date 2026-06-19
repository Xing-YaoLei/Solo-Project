import { createFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Descriptions, Drawer, Timeline, Popconfirm, App as AntdApp, Tooltip, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, FileTextOutlined, EnvironmentOutlined, EnvironmentFilled,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, GuideRoute, RecordStatusEnum, TraceItem } from '../../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;
const { Typography } = require('antd');

export const Route = createFileRoute('/_layout/guide/routes')({
  component: GuideRoutesPage,
});

function GuideRoutesPage() {
  const { message, modal } = AntdApp.useApp();
  const [data, setData] = useState<GuideRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{ status?: RecordStatusEnum; keyword?: string }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [current, setCurrent] = useState<GuideRoute | null>(null);
  const [form] = Form.useForm();

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [traceTarget, setTraceTarget] = useState<{ type: string; id: number } | null>(null);

  const fetch = () => {
    setLoading(true);
    api.get<any>('/guide/routes', { page, page_size: pageSize, ...filters }).then((r) => {
      setData(r.data.items || []);
      setTotal(r.data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetch, [page, pageSize, filters]);

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (modalMode === 'create') {
        await api.post('/guide/routes', v);
        message.success('创建成功');
      } else if (modalMode === 'update' && current) {
        await api.put(`/guide/routes/${current.id}`, v);
        message.success('更新成功');
      }
      setModalOpen(false);
      fetch();
    } catch {}
  };

  const openModal = (mode: 'create' | 'update' | 'view', record?: GuideRoute) => {
    setModalMode(mode);
    setCurrent(record || null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setModalOpen(true);
  };

  const showTrace = (type: string, id: number) => {
    api.get('/audit-logs/trace', { record_type: type, record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceTarget({ type, id });
      setTraceOpen(true);
    });
  };

  const approve = (id: number) => {
    modal.confirm({
      title: '确认审核通过？',
      onOk: async () => {
        await api.post(`/guide/routes/${id}/approve`);
        message.success('审核通过');
        fetch();
      },
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '路线名称', dataIndex: 'name', width: 200,
      render: (v: string, r: GuideRoute) => <a onClick={() => openModal('view', r)}>{v}</a>,
    },
    { title: '编码', dataIndex: 'code', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: RecordStatusEnum) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</Tag>,
    },
    { title: '时长(分)', dataIndex: 'duration_minutes', width: 90 },
    { title: '距离(米)', dataIndex: 'distance_meters', width: 100 },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    {
      title: '创建时间', dataIndex: 'created_at', width: 160,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作', key: 'actions', width: 260, fixed: 'right' as const,
      render: (_: any, r: GuideRoute) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace('guide_route', r.id)}>痕迹</Button>
          <Button type="link" size="small" onClick={() => openModal('view', r)}>查看</Button>
          <Button type="link" size="small" onClick={() => openModal('update', r)}>编辑</Button>
          {r.status === 'pending' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => approve(r.id)}>通过</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="路线总数" value={total} prefix={<EnvironmentOutlined style={{ color: '#1677ff' }} />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="草稿" value={data.filter((x) => x.status === 'draft').length} prefix={<FileTextOutlined style={{ color: '#8c8c8c' }} />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="待审核" value={data.filter((x) => x.status === 'pending').length} prefix={<EnvironmentFilled style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已发布" value={data.filter((x) => x.status === 'approved').length} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
              onChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}
            >
              {(['draft', 'pending', 'approved', 'rejected'] as RecordStatusEnum[]).map((s) => (
                <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
              ))}
            </Select>
            <Input
              prefix={<SearchOutlined />}
              placeholder="名称/编码"
              allowClear
              style={{ width: 200 }}
              onPressEnter={(e: any) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
          </Space>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')}>新建路线</Button>
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
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={modalMode === 'create' ? '新建导览路线' : modalMode === 'update' ? '编辑导览路线' : '路线详情'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={modalMode === 'view' ? undefined : handleSubmit}
        okButtonProps={modalMode === 'view' ? { style: { display: 'none' } } : undefined}
        cancelText={modalMode === 'view' ? '关闭' : '取消'}
        width={640}
        destroyOnClose
      >
        {modalMode === 'view' && current ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="名称">{current.name}</Descriptions.Item>
            <Descriptions.Item label="编码">{current.code}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_COLORS[current.status]}>{STATUS_LABELS[current.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="时长">{current.duration_minutes} 分钟</Descriptions.Item>
            <Descriptions.Item label="距离">{current.distance_meters} 米</Descriptions.Item>
            <Descriptions.Item label="排序">{current.sort_order}</Descriptions.Item>
            <Descriptions.Item label="描述">{current.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建">{dayjs(current.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="路线名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="例如：经典一日游" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="路线编码" name="code" rules={[{ required: true }]}>
                  <Input placeholder="ROUTE-001" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="时长(分)" name="duration_minutes" initialValue={60}>
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="距离(米)" name="distance_meters" initialValue={0}>
                  <Input type="number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="状态" name="status" initialValue="draft">
                  <Select>
                    {(['draft', 'pending', 'approved'] as RecordStatusEnum[]).map((s) => (
                      <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="排序权重" name="sort_order" initialValue={0}>
                  <Input type="number" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="封面图 URL" name="cover_image">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item label="路线描述" name="description">
              <TextArea rows={4} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Drawer title="处理痕迹" open={traceOpen} onClose={() => setTraceOpen(false)} width={600}>
        <Tooltip title={`类型: ${traceTarget?.type} #${traceTarget?.id}`}>
          <Tag color="blue">{traceTarget?.type} #{traceTarget?.id}</Tag>
        </Tooltip>
        <div style={{ marginTop: 16 }}>
          <Timeline
            locale={{ empty: '暂无操作记录' }}
            items={trace.map((t) => ({
              color: t.action === 'create' ? 'green' : t.action === 'delete' ? 'red' : 'blue',
              children: (
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag color="processing">{t.action}</Tag>
                    <b>{t.user_name || `用户#${t.user_id}`}</b>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(t.at).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </Space>
                  {t.field && (
                    <div style={{ marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <div><b>字段：</b>{t.field}</div>
                      {t.old && <div><b>原值：</b><span style={{ color: '#ff4d4f' }}>{t.old}</span></div>}
                      {t.new && <div><b>新值：</b><span style={{ color: '#52c41a' }}>{t.new}</span></div>}
                    </div>
                  )}
                  {t.remarks && <div style={{ color: '#666', marginTop: 4 }}>{t.remarks}</div>}
                </div>
              ),
            }))}
          />
        </div>
      </Drawer>
    </Space>
  );
}
