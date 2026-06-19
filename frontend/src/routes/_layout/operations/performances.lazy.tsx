import { createFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Drawer, Timeline, App as AntdApp, Row, Col, Statistic,
  DatePicker, InputNumber, Tooltip, Tabs,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, UserOutlined, CalendarOutlined,
  SafetyCertificateOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../../api';
import {
  STATUS_COLORS, STATUS_LABELS, Performance, PerformanceSession,
  RecordStatusEnum, TraceItem, EXCEPTION_LABELS, ExceptionTypeEnum,
} from '../../../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

export const Route = createFileRoute('/_layout/operations/performances')({
  component: PerformancesPage,
});

function PerformancesPage() {
  const { message, modal } = AntdApp.useApp();
  const [tab, setTab] = useState('performances');
  const [perfData, setPerfData] = useState<Performance[]>([]);
  const [sessData, setSessData] = useState<PerformanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [perfTotal, setPerfTotal] = useState(0);
  const [sessTotal, setSessTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'perf' | 'sess'>('perf');
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [current, setCurrent] = useState<any>(null);
  const [form] = Form.useForm();

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);

  const fetchPerf = () => {
    setLoading(true);
    api.get<any>('/operations/performances', { page, page_size: pageSize }).then((r) => {
      setPerfData(r.data.items || []);
      setPerfTotal(r.data.total || 0);
      setLoading(false);
    });
  };

  const fetchSess = () => {
    setLoading(true);
    api.get<any>('/operations/sessions', { page, page_size: pageSize }).then((r) => {
      setSessData(r.data.items || []);
      setSessTotal(r.data.total || 0);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (tab === 'performances') fetchPerf();
    else fetchSess();
  }, [tab, page, pageSize]);

  const perfMap = Object.fromEntries(perfData.map((p) => [p.id, p.name]) as any);

  const openModal = (type: 'perf' | 'sess', mode: 'create' | 'update', record?: any) => {
    setModalType(type);
    setModalMode(mode);
    setCurrent(record || null);
    form.resetFields();
    if (record) {
      const data = { ...record };
      if (type === 'sess') {
        data.start_time = record.start_time ? dayjs(record.start_time) : null;
        data.end_time = record.end_time ? dayjs(record.end_time) : null;
      }
      form.setFieldsValue(data);
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = { ...v };
      if (modalType === 'sess') {
        payload.start_time = v.start_time?.toISOString?.() || v.start_time;
        payload.end_time = v.end_time?.toISOString?.() || v.end_time;
      }
      if (modalMode === 'create') {
        await api.post(modalType === 'perf' ? '/operations/performances' : '/operations/sessions', payload);
        message.success('创建成功');
      } else if (modalMode === 'update' && current) {
        const url = modalType === 'perf'
          ? `/operations/performances/${current.id}`
          : `/operations/sessions/${current.id}`;
        await api.put(url, payload);
        message.success('更新成功');
      }
      setModalOpen(false);
      if (modalType === 'perf') fetchPerf();
      else fetchSess();
    } catch {}
  };

  const cancelSession = (s: PerformanceSession) => {
    modal.confirm({
      title: '取消演出场次？',
      content: '这将生成异常记录，并标记为"演出取消"',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api.post('/operations/exceptions', {
          exception_type: ExceptionTypeEnum.PERFORMANCE_CANCEL,
          related_type: 'performance_session',
          related_id: s.id,
          title: `演出取消：${perfMap[s.performance_id] || s.performance_id} ${dayjs(s.start_time).format('MM-DD HH:mm')}`,
          description: `原定于 ${dayjs(s.start_time).format('YYYY-MM-DD HH:mm')} 的演出场次被取消`,
          status: 'pending',
        });
        message.success('已创建异常记录，场次状态已变更');
        fetchSess();
      },
    });
  };

  const showTrace = (type: string, id: number) => {
    api.get('/audit-logs/trace', { record_type: type, record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceOpen(true);
    });
  };

  const perfColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '演出名称', dataIndex: 'name', width: 200, render: (v: string, r: Performance) => <a onClick={() => openModal('perf', 'update', r)}>{v}</a> },
    { title: '编码', dataIndex: 'code', width: 140, render: (v: string) => <Tag>{v}</Tag> },
    { title: '场地', dataIndex: 'venue', width: 140, render: (v: string) => v || '-' },
    { title: '时长(分)', dataIndex: 'duration_minutes', width: 90 },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'actions', width: 220, fixed: 'right' as const,
      render: (_: any, r: Performance) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace('performance', r.id)}>痕迹</Button>
          <Button type="link" size="small" onClick={() => { setTab('sessions'); }}>场次</Button>
          <Button type="link" size="small" onClick={() => openModal('perf', 'update', r)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const sessColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '演出', dataIndex: 'performance_id', width: 180, render: (v: number) => perfMap[v] || `演出#${v}` },
    { title: '开始时间', dataIndex: 'start_time', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'end_time', width: 160, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '总座位', dataIndex: 'total_seats', width: 90 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: RecordStatusEnum) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</Tag>,
    },
    { title: '创建', dataIndex: 'created_at', width: 140, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'actions', width: 280, fixed: 'right' as const,
      render: (_: any, s: PerformanceSession) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace('performance_session', s.id)}>痕迹</Button>
          <Button type="link" size="small" onClick={() => window.location.href = '/operations/seats?sid=' + s.id}>座位</Button>
          <Button type="link" size="small" onClick={() => openModal('sess', 'update', s)}>编辑</Button>
          {s.status !== 'cancelled' && (
            <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => cancelSession(s)}>取消</Button>
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
            <Statistic title="演出项目" value={perfTotal} prefix={<UserOutlined style={{ color: '#13c2c2' }} />} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="场次总数" value={sessTotal} prefix={<CalendarOutlined style={{ color: '#1677ff' }} />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="待演出" value={sessData.filter((x) => x.status === 'pending' || x.status === 'approved').length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已取消" value={sessData.filter((x) => x.status === 'cancelled').length} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={tab}
          onChange={(k) => { setTab(k); setPage(1); }}
          style={{ padding: '0 24px' }}
          items={[
            { key: 'performances', label: '🎭 演出项目' },
            { key: 'sessions', label: '📅 演出场次' },
          ]}
        />
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input prefix={<SearchOutlined />} placeholder="搜索名称/编码" allowClear style={{ width: 180 }} />
            <Button icon={<ReloadOutlined />} onClick={() => tab === 'performances' ? fetchPerf() : fetchSess()}>刷新</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(tab === 'performances' ? 'perf' : 'sess', 'create')}>
            新建{tab === 'performances' ? '演出' : '场次'}
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={tab === 'performances' ? perfData : sessData}
          columns={(tab === 'performances' ? perfColumns : sessColumns) as any}
          pagination={{
            current: page, pageSize, total: tab === 'performances' ? perfTotal : sessTotal,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          (modalType === 'perf' ? '演出项目' : '演出场次')
          + (modalMode === 'create' ? ' · 新建' : ' · 编辑')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {modalType === 'perf' ? (
            <>
              <Form.Item label="演出名称" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="编码" name="code" rules={[{ required: true }]}>
                    <Input placeholder="PERF-001" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="时长(分)" name="duration_minutes" initialValue={60}>
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="场地" name="venue">
                <Input />
              </Form.Item>
              <Form.Item label="演出说明" name="description">
                <TextArea rows={3} />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="所属演出" name="performance_id" rules={[{ required: true }]}>
                <Select placeholder="选择演出项目">
                  {perfData.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="开始时间" name="start_time" rules={[{ required: true }]}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="结束时间" name="end_time">
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="总座位数" name="total_seats" initialValue={0}>
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="状态" name="status" initialValue="pending">
                    <Select>
                      {(['pending', 'approved', 'cancelled', 'completed'] as RecordStatusEnum[]).map((s) => (
                        <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal>

      <Drawer title="处理痕迹" open={traceOpen} onClose={() => setTraceOpen(false)} width={600}>
        <Timeline
          locale={{ empty: '暂无记录' }}
          items={trace.map((t) => ({
            color: t.action === 'create' ? 'green' : t.action === 'cancel' ? 'red' : 'blue',
            children: (
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <Tag>{t.action}</Tag>
                  <b>{t.user_name || '系统'}</b>
                  <span style={{ color: '#999' }}>{dayjs(t.at).format('MM-DD HH:mm')}</span>
                </Space>
                {t.field && (
                  <div style={{ marginTop: 6 }}>
                    <div>字段：{t.field}</div>
                    {t.old && <div style={{ color: '#f00' }}>原: {t.old}</div>}
                    {t.new && <div style={{ color: '#0a0' }}>新: {t.new}</div>}
                  </div>
                )}
                {t.remarks && <div>{t.remarks}</div>}
              </div>
            ),
          }))}
        />
      </Drawer>
    </Space>
  );
}
