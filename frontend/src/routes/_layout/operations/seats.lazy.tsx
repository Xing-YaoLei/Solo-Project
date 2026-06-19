import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Drawer, Timeline, App as AntdApp, Row, Col, Statistic,
  InputNumber, Empty, Tooltip, Typography, Alert,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, CheckSquareOutlined, PaperClipOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, Seat, PerformanceSession, RecordStatusEnum, TraceItem } from '../../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

export const Route = createLazyFileRoute('/_layout/operations/seats')({
  component: SeatsPage,
});

function SeatsPage() {
  const { message, modal } = AntdApp.useApp();
  const [data, setData] = useState<Seat[]>([]);
  const [sessions, setSessions] = useState<PerformanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<{ session_id?: number; zone?: string; is_available?: boolean; is_verified?: boolean }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'batch'>('single');
  const [current, setCurrent] = useState<Seat | null>(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);

  useEffect(() => {
    api.get<any>('/operations/sessions', { page_size: 200 }).then((r) => setSessions(r.data.items || []));
  }, []);

  const fetch = () => {
    setLoading(true);
    api.get<any>('/operations/seats', { page, page_size: pageSize, ...filters }).then((r) => {
      setData(r.data.items || []);
      setTotal(r.data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetch, [page, pageSize, filters]);

  const sessMap = useMemo(
    () => Object.fromEntries(sessions.map((s) => [s.id, `演出#${s.performance_id} · ${dayjs(s.start_time).format('MM-DD HH:mm')}`])),
    [sessions]
  );

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (modalMode === 'single') {
        if (!current) {
          await api.post('/operations/seats', v);
          message.success('添加成功');
        } else {
          message.success('更新成功');
        }
      } else {
        await api.post('/operations/seats/batch-create', v);
        message.success('批量创建成功');
      }
      setModalOpen(false);
      fetch();
    } catch {}
  };

  const verify = async (id: number) => {
    await api.post(`/operations/seats/${id}/verify`);
    message.success('复核通过');
    fetch();
  };

  const showTrace = (id: number) => {
    api.get('/audit-logs/trace', { record_type: 'seat', record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceOpen(true);
    });
  };

  const batchVerify = async () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: `批量复核 ${selectedRowKeys.length} 个座位`,
      onOk: async () => {
        await api.post('/operations/seats/batch-update', {
          ids: selectedRowKeys.map(Number),
          updates: { is_verified: true },
        });
        message.success('批量任务已提交');
        setSelectedRowKeys([]);
        fetch();
      },
    });
  };

  const batchUpdate = () => {
    if (selectedRowKeys.length === 0) return;
    let updates: any = {};
    modal.confirm({
      title: `批量更新 ${selectedRowKeys.length} 个座位`,
      content: (
        <Form layout="vertical">
          <Form.Item label="区域">
            <Input placeholder="统一设置区域" allowClear id="batch-zone" />
          </Form.Item>
          <Form.Item label="价格">
            <InputNumber style={{ width: '100%' }} id="batch-price" placeholder="统一价格" />
          </Form.Item>
          <Form.Item label="可用状态">
            <Select
              allowClear
              placeholder="选择可用状态"
              id="batch-available"
              options={[{ label: '可用', value: true }, { label: '不可用', value: false }]}
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const zone = (document.getElementById('batch-zone') as HTMLInputElement)?.value;
        const priceEl = document.getElementById('batch-price') as HTMLInputElement;
        const price = priceEl ? parseFloat(priceEl.value) : NaN;
        const availableEl = document.getElementById('batch-available') as HTMLSelectElement;
        const available = availableEl?.value;
        if (zone) updates.zone = zone;
        if (!isNaN(price)) updates.price = price;
        if (available !== '' && available != null) updates.is_available = available === 'true';
        if (Object.keys(updates).length === 0) return Promise.reject();
        await api.post('/operations/seats/batch-update', {
          ids: selectedRowKeys.map(Number), updates,
        });
        message.success('批量任务已提交');
        setSelectedRowKeys([]);
        fetch();
      },
    });
  };

  const groupedByRow = useMemo(() => {
    const m = new Map<string, Seat[]>();
    data.forEach((s) => {
      if (!m.has(s.row)) m.set(s.row, []);
      m.get(s.row)!.push(s);
    });
    const sortedKeys = Array.from(m.keys()).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, '')) || 0;
      const nb = parseInt(b.replace(/\D/g, '')) || 0;
      return na - nb;
    });
    return sortedKeys.map((k) => ({ row: k, seats: m.get(k)!.sort((a, b) => parseInt(a.number) - parseInt(b.number)) }));
  }, [data]);

  const seatCardColor = (s: Seat) => {
    if (!s.is_available) return '#8c8c8c';
    if (!s.is_verified) return '#faad14';
    return '#52c41a';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '场次', dataIndex: 'session_id', width: 160, render: (v: number) => sessMap[v] || `#${v}` },
    { title: '排', dataIndex: 'row', width: 80, render: (v: string) => <Tag>{v}排</Tag> },
    { title: '号', dataIndex: 'number', width: 80, render: (v: string) => <Tag color="blue">{v}号</Tag> },
    { title: '区域', dataIndex: 'zone', width: 100, render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
    { title: '价格', dataIndex: 'price', width: 90, render: (v: number) => `¥${v}` },
    {
      title: '可用', dataIndex: 'is_available', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '复核', dataIndex: 'is_verified', width: 80,
      render: (v: boolean) => v
        ? <Tag color="green"><CheckCircleOutlined /> 已复</Tag>
        : <Tag color="orange">待复</Tag>,
    },
    { title: '复核时间', dataIndex: 'verified_at', width: 140, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    {
      title: '操作', key: 'actions', width: 220, fixed: 'right' as const,
      render: (_: any, s: Seat) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace(s.id)}>痕迹</Button>
          {!s.is_verified && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => verify(s.id)}>复核</Button>
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
            <Statistic title="座位总数" value={total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="已复核"
              value={data.filter((x) => x.is_verified).length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="待复核"
              value={data.filter((x) => !x.is_verified).length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="不可用/已售"
              value={data.filter((x) => !x.is_available).length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        message="核对提示"
        description="绿色=已复核且可用 | 黄色=待复核 | 灰色=不可用/已售出。批量操作请先勾选座位。"
        type="info"
        showIcon
      />

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              placeholder="选择场次"
              allowClear
              style={{ width: 220 }}
              onChange={(v) => { setFilters({ ...filters, session_id: v }); setPage(1); }}
            >
              {sessions.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.performance_id} · {dayjs(s.start_time).format('MM-DD HH:mm')}
                  {s.status !== 'pending' ? ` (${STATUS_LABELS[s.status]})` : ''}
                </Option>
              ))}
            </Select>
            <Input
              prefix={<SearchOutlined />}
              placeholder="区域"
              allowClear
              style={{ width: 140 }}
              onPressEnter={(e: any) => { setFilters({ ...filters, zone: e.target.value }); setPage(1); }}
            />
            <Select placeholder="复核状态" allowClear style={{ width: 130 }} onChange={(v) => { setFilters({ ...filters, is_verified: v }); setPage(1); }}>
              <Option value={true}>已复核</Option>
              <Option value={false}>待复核</Option>
            </Select>
            <Select placeholder="可用状态" allowClear style={{ width: 130 }} onChange={(v) => { setFilters({ ...filters, is_available: v }); setPage(1); }}>
              <Option value={true}>可用</Option>
              <Option value={false}>不可用</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
          </Space>
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Tooltip title="批量复核">
                  <Button icon={<CheckSquareOutlined />} onClick={batchVerify}>
                    批量复核 ({selectedRowKeys.length})
                  </Button>
                </Tooltip>
                <Tooltip title="批量更新价格/区域/状态">
                  <Button type="primary" ghost onClick={batchUpdate}>
                    批量更新
                  </Button>
                </Tooltip>
              </>
            )}
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => { setModalMode('single'); setCurrent(null); form.resetFields(); setModalOpen(true); }}>
              单个录入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setModalMode('batch'); form.resetFields(); setModalOpen(true); }}>
              批量生成座位
            </Button>
          </Space>
        </div>

        {filters.session_id && groupedByRow.length > 0 && (
          <div style={{ padding: 24, background: '#fafafa' }}>
            <Title level={5} style={{ marginBottom: 16 }}>座位矩阵图</Title>
            <div style={{ overflowX: 'auto' }}>
              {groupedByRow.map((g) => (
                <div key={g.row} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ width: 50, textAlign: 'right', fontWeight: 600, color: '#666', marginRight: 12 }}>
                    {g.row}排
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {g.seats.map((s) => (
                      <Tooltip
                        key={s.id}
                        title={`${s.row}排${s.number}号 | ¥${s.price} | ${s.zone || '无区域'}`}
                      >
                        <div
                          onClick={() => {
                            const keys = [...selectedRowKeys];
                            const idx = keys.indexOf(s.id);
                            if (idx >= 0) keys.splice(idx, 1);
                            else keys.push(s.id);
                            setSelectedRowKeys(keys);
                          }}
                          style={{
                            width: 36, height: 32,
                            border: `2px solid ${selectedRowKeys.includes(s.id) ? '#1677ff' : 'transparent'}`,
                            background: seatCardColor(s),
                            color: '#fff',
                            borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {s.number}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Space>
                <Space><span style={{ display: 'inline-block', width: 14, height: 14, background: '#52c41a', borderRadius: 2 }}></span>已复核可用</Space>
                <Space><span style={{ display: 'inline-block', width: 14, height: 14, background: '#faad14', borderRadius: 2 }}></span>待复核</Space>
                <Space><span style={{ display: 'inline-block', width: 14, height: 14, background: '#8c8c8c', borderRadius: 2 }}></span>不可用/已售</Space>
                <Space><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #1677ff', borderRadius: 2 }}></span>已选中</Space>
              </Space>
            </div>
          </div>
        )}

        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns as any}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={modalMode === 'single' ? '单个座位录入' : '批量生成座位'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={modalMode === 'single' ? 560 : 640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="所属场次" name="session_id" rules={[{ required: true }]}>
            <Select placeholder="选择场次">
              {sessions.map((s) => (
                <Option key={s.id} value={s.id}>
                  演出#{s.performance_id} · {dayjs(s.start_time).format('MM-DD HH:mm')}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {modalMode === 'single' ? (
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label="排号" name="row" rules={[{ required: true }]}>
                  <Input placeholder="如 A 或 1" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="座位号" name="number" rules={[{ required: true }]}>
                  <Input placeholder="如 12" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="价格" name="price" initialValue={0}>
                  <InputNumber style={{ width: '100%' }} prefix="¥" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="区域" name="zone">
                  <Input placeholder="VIP/普通/A区..." />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Row gutter={12}>
              <Col span={14}>
                <Form.Item label="排号列表" name="rows" rules={[{ required: true }]}>
                  <Select
                    mode="tags"
                    placeholder="输入后回车添加，如 A,B,C 或 1,2,3,4,5"
                    style={{ width: '100%' }}
                    tokenSeparators={[',', '，', ' ']}
                  />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label="每排座位数" name="numbers_per_row" rules={[{ required: true }]} initialValue={20}>
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="统一价格" name="price" initialValue={0}>
                  <InputNumber style={{ width: '100%' }} prefix="¥" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="统一区域" name="zone">
                  <Input placeholder="可选" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      <Drawer title="处理痕迹" open={traceOpen} onClose={() => setTraceOpen(false)} width={600}>
        <Timeline
          items={trace.map((t) => ({
            color: t.action === 'create' ? 'green' : t.action === 'verify' ? 'cyan' : t.action === 'batch_update' ? 'purple' : 'blue',
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
