import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Drawer, Timeline, App as AntdApp, Row, Col, Upload,
  Statistic, Tooltip, InputNumber,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, EnvironmentOutlined,
  FileExcelOutlined, PaperClipOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, HeatPoint, GuideRoute, RecordStatusEnum, TraceItem } from '../../../types';
import dayjs from 'dayjs';
import type { UploadProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

export const Route = createLazyFileRoute('/_layout/guide/heat-points')({
  component: HeatPointsPage,
});

function HeatPointsPage() {
  const { message, modal } = AntdApp.useApp();
  const [data, setData] = useState<HeatPoint[]>([]);
  const [routes, setRoutes] = useState<GuideRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<{ route_id?: number; status?: RecordStatusEnum; keyword?: string }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [current, setCurrent] = useState<HeatPoint | null>(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);

  const [attachOpen, setAttachOpen] = useState(false);
  const [attachList, setAttachList] = useState<any[]>([]);
  const [attachTarget, setAttachTarget] = useState<{ type: string; id: number } | null>(null);

  useEffect(() => {
    api.get<any>('/guide/routes', { page_size: 200 }).then((r) => setRoutes(r.data.items || []));
  }, []);

  const fetch = () => {
    setLoading(true);
    api.get<any>('/guide/heat-points', { page, page_size: pageSize, ...filters }).then((r) => {
      setData(r.data.items || []);
      setTotal(r.data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetch, [page, pageSize, filters]);

  const routeMap = useMemo(() => Object.fromEntries(routes.map((r) => [r.id, r.name])), [routes]);

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      if (modalMode === 'create') {
        await api.post('/guide/heat-points', v);
        message.success('创建成功');
      } else if (modalMode === 'update' && current) {
        await api.put(`/guide/heat-points/${current.id}`, v);
        message.success('更新成功');
      }
      setModalOpen(false);
      fetch();
    } catch {}
  };

  const openModal = (mode: 'create' | 'update', record?: HeatPoint) => {
    setModalMode(mode);
    setCurrent(record || null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setModalOpen(true);
  };

  const verify = async (id: number) => {
    await api.post(`/guide/heat-points/${id}/verify`);
    message.success('复核通过');
    fetch();
  };

  const showTrace = (id: number) => {
    api.get('/audit-logs/trace', { record_type: 'heat_point', record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceOpen(true);
    });
  };

  const showAttachments = (id: number) => {
    api.get('/attachments', { record_type: 'heat_point', record_id: id }).then((r) => {
      setAttachList(r.data || []);
      setAttachTarget({ type: 'heat_point', id });
      setAttachOpen(true);
    });
  };

  const batchUpdate = () => {
    if (selectedRowKeys.length === 0) return;
    let newStatus = '';
    modal.confirm({
      title: `批量操作 ${selectedRowKeys.length} 个点位`,
      content: (
        <Form layout="vertical">
          <Form.Item label="统一设置状态">
            <Select
              placeholder="选择状态"
              allowClear
              onChange={(v) => { newStatus = v; }}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已取消', value: 'cancelled' },
              ]}
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const updates: any = {};
        if (newStatus) updates.status = newStatus;
        if (Object.keys(updates).length === 0) {
          message.warning('请至少设置一个字段');
          return Promise.reject();
        }
        await api.post('/guide/heat-points/batch-update', {
          ids: selectedRowKeys.map(Number),
          updates,
        });
        message.success('批量任务已提交，后台处理中');
        setSelectedRowKeys([]);
        fetch();
      },
    });
  };

  const uploadProps: UploadProps = {
    name: 'files',
    multiple: true,
    action: '/api/v1/attachments/upload',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    data: () => ({ record_type: attachTarget?.type, record_id: attachTarget?.id }),
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        if (attachTarget) showAttachments(attachTarget.id);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  const importProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    action: '/api/v1/import/heat-points',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    data: () => ({ route_id: filters.route_id || 1 }),
    onChange(info) {
      if (info.file.status === 'done') {
        message.success('导入任务已提交');
        fetch();
      }
    },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '点位名称', dataIndex: 'name', width: 180,
      render: (v: string, r: HeatPoint) => (
        <a onClick={() => openModal('update', r)}>{v}</a>
      ),
    },
    { title: '编码', dataIndex: 'code', width: 110, render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
    {
      title: '所属路线', dataIndex: 'route_id', width: 140,
      render: (v: number) => routeMap[v] || `路线#${v}`,
    },
    { title: '纬度', dataIndex: 'latitude', width: 100, render: (v: number) => v?.toFixed(5) },
    { title: '经度', dataIndex: 'longitude', width: 100, render: (v: number) => v?.toFixed(5) },
    { title: '半径(米)', dataIndex: 'radius_meters', width: 80 },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: RecordStatusEnum) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</Tag>,
    },
    { title: '复核时间', dataIndex: 'verified_at', width: 140, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    {
      title: '操作', key: 'actions', width: 280, fixed: 'right' as const,
      render: (_: any, r: HeatPoint) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace(r.id)}>痕迹</Button>
          <Button type="link" size="small" icon={<PaperClipOutlined />} onClick={() => showAttachments(r.id)}>附件</Button>
          <Button type="link" size="small" onClick={() => openModal('update', r)}>编辑</Button>
          {r.status !== 'approved' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => verify(r.id)}>复核</Button>
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
            <Statistic title="点位总数" value={total} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="待复核" value={data.filter((x) => x.status === 'pending').length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已复核" value={data.filter((x) => x.status === 'approved').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="所属路线" value={new Set(data.map((x) => x.route_id)).size} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              placeholder="所属路线"
              allowClear
              style={{ width: 180 }}
              onChange={(v) => { setFilters({ ...filters, route_id: v }); setPage(1); }}
            >
              {routes.map((r) => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
              onChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}
            >
              {(['draft', 'pending', 'approved'] as RecordStatusEnum[]).map((s) => (
                <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
              ))}
            </Select>
            <Input
              prefix={<SearchOutlined />}
              placeholder="名称/编码"
              allowClear
              style={{ width: 180 }}
              onPressEnter={(e: any) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
          </Space>
          <Space>
            <Upload {...importProps}>
              <Button icon={<FileExcelOutlined />}>CSV 导入</Button>
            </Upload>
            {selectedRowKeys.length > 0 && (
              <Tooltip title={`批量处理 ${selectedRowKeys.length} 条`}>
                <Button type="primary" ghost onClick={batchUpdate}>批量操作 ({selectedRowKeys.length})</Button>
              </Tooltip>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')}>新增点位</Button>
          </Space>
        </div>

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
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={modalMode === 'create' ? '新增热力点位' : '编辑热力点位'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="所属路线" name="route_id" rules={[{ required: true }]}>
            <Select placeholder="选择路线">
              {routes.map((r) => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item label="点位名称" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="点位编码" name="code">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item label="纬度" name="latitude" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} step={0.00001} precision={6} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="经度" name="longitude" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} step={0.00001} precision={6} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="半径(米)" name="radius_meters" initialValue={50}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="排序" name="sort_order" initialValue={0}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" name="status" initialValue="pending">
                <Select>
                  {(['draft', 'pending', 'approved'] as RecordStatusEnum[]).map((s) => (
                    <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="点位描述" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="处理痕迹" open={traceOpen} onClose={() => setTraceOpen(false)} width={600}>
        <Timeline
          items={trace.map((t) => ({
            color: t.action === 'create' ? 'green' : t.action === 'verify' ? 'cyan' : 'blue',
            children: (
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <Tag>{t.action}</Tag>
                  <b>{t.user_name || '系统'}</b>
                  <span style={{ color: '#999' }}>{dayjs(t.at).format('MM-DD HH:mm')}</span>
                </Space>
                {t.field && (
                  <div style={{ marginTop: 6 }}>
                    <div><b>字段</b>: {t.field}</div>
                    {t.old && <div style={{ color: '#f00' }}>原: {t.old}</div>}
                    {t.new && <div style={{ color: '#0a0' }}>新: {t.new}</div>}
                  </div>
                )}
                {t.remarks && <div style={{ color: '#666' }}>{t.remarks}</div>}
              </div>
            ),
          }))}
        />
      </Drawer>

      <Drawer title="附件管理" open={attachOpen} onClose={() => setAttachOpen(false)} width={500}>
        <div style={{ marginBottom: 16 }}>
          <Upload.Dragger {...uploadProps as any} multiple>
            <p className="ant-upload-drag-icon"><PaperClipOutlined style={{ fontSize: 36 }} /></p>
            <p>点击或拖拽文件到此处上传</p>
            <p style={{ color: '#999' }}>支持任意类型文件上传</p>
          </Upload.Dragger>
        </div>
        <div style={{ marginTop: 24 }}>
          <h5>已上传 ({attachList.length})</h5>
          {attachList.length === 0 ? (
            <span style={{ color: '#999' }}>暂无附件</span>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {attachList.map((a: any) => (
                <Card size="small" key={a.id}>
                  <Space style={{ width: '100%' }}>
                    <PaperClipOutlined />
                    <a href={`/api/v1/attachments/${a.id}/download`} download>
                      {a.original_name || a.file_name}
                    </a>
                    <Tag>{(a.file_size / 1024).toFixed(1)} KB</Tag>
                    <span style={{ color: '#999' }}>{dayjs(a.created_at).format('MM-DD HH:mm')}</span>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </div>
      </Drawer>
    </Space>
  );
}
