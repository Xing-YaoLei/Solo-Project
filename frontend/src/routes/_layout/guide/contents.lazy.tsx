import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Drawer, Timeline, App as AntdApp, Row, Col, Statistic,
  Tooltip, Radio, Upload, Empty, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, PlayCircleOutlined, FileTextOutlined, PaperClipOutlined,
  AudioOutlined, VideoCameraOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, GuideContent, GuideRoute, RecordStatusEnum, TraceItem } from '../../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

export const Route = createLazyFileRoute('/_layout/guide/contents')({
  component: GuideContentsPage,
});

function GuideContentsPage() {
  const { message, modal } = AntdApp.useApp();
  const [data, setData] = useState<GuideContent[]>([]);
  const [routes, setRoutes] = useState<GuideRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{ route_id?: number; content_type?: string; status?: RecordStatusEnum; keyword?: string }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [current, setCurrent] = useState<GuideContent | null>(null);
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
    api.get<any>('/guide/contents', { page, page_size: pageSize, ...filters }).then((r) => {
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
        await api.post('/guide/contents', v);
        message.success('创建成功');
      } else if (modalMode === 'update' && current) {
        await api.put(`/guide/contents/${current.id}`, v);
        message.success('更新成功');
      }
      setModalOpen(false);
      fetch();
    } catch {}
  };

  const openModal = (mode: 'create' | 'update' | 'view', record?: GuideContent) => {
    setModalMode(mode);
    setCurrent(record || null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setModalOpen(true);
  };

  const verify = async (id: number) => {
    await api.post(`/guide/contents/${id}/verify`);
    message.success('复核通过');
    fetch();
  };

  const showTrace = (id: number) => {
    api.get('/audit-logs/trace', { record_type: 'guide_content', record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceOpen(true);
    });
  };

  const showAttachments = (id: number) => {
    api.get('/attachments', { record_type: 'guide_content', record_id: id }).then((r) => {
      setAttachList(r.data || []);
      setAttachTarget({ type: 'guide_content', id });
      setAttachOpen(true);
    });
  };

  const batchUpdate = () => {
    if (selectedRowKeys.length === 0) return;
    let newStatus = '';
    modal.confirm({
      title: `批量操作 ${selectedRowKeys.length} 条内容`,
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
              ]}
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const updates: any = {};
        if (newStatus) updates.status = newStatus;
        if (Object.keys(updates).length === 0) return Promise.reject();
        await api.post('/guide/contents/batch-update', {
          ids: selectedRowKeys.map(Number), updates,
        });
        message.success('批量任务已提交');
        setSelectedRowKeys([]);
        fetch();
      },
    });
  };

  const contentTypeIcon = (t: string) => {
    if (t === 'audio') return <AudioOutlined style={{ color: '#1677ff' }} />;
    if (t === 'video') return <VideoCameraOutlined style={{ color: '#eb2f96' }} />;
    return <FileTextOutlined style={{ color: '#52c41a' }} />;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '标题', dataIndex: 'title', width: 220,
      render: (v: string, r: GuideContent) => (
        <Space>
          {contentTypeIcon(r.content_type)}
          <a onClick={() => openModal('view', r)}>{v}</a>
        </Space>
      ),
    },
    { title: '类型', dataIndex: 'content_type', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '语言', dataIndex: 'language', width: 80, render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: '所属路线', dataIndex: 'route_id', width: 140,
      render: (v: number) => routeMap[v] || `#${v}`,
    },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: RecordStatusEnum) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</Tag>,
    },
    {
      title: '复核时间', dataIndex: 'verified_at', width: 140,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作', key: 'actions', width: 280, fixed: 'right' as const,
      render: (_: any, r: GuideContent) => (
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

  const uploadProps = {
    name: 'files',
    multiple: true,
    action: '/api/v1/attachments/upload',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    data: () => ({ record_type: attachTarget?.type, record_id: attachTarget?.id }),
    onChange: (info: any) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        if (attachTarget) showAttachments(attachTarget.id);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}><Card><Statistic title="内容总数" value={total} prefix={<PlayCircleOutlined />} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="待复核" value={data.filter((x) => x.status === 'pending').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="已复核" value={data.filter((x) => x.status === 'approved').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="所属路线" value={new Set(data.map((x) => x.route_id)).size} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select placeholder="所属路线" allowClear style={{ width: 180 }} onChange={(v) => { setFilters({ ...filters, route_id: v }); setPage(1); }}>
              {routes.map((r) => <Option key={r.id} value={r.id}>{r.name}</Option>)}
            </Select>
            <Select placeholder="内容类型" allowClear style={{ width: 120 }} onChange={(v) => { setFilters({ ...filters, content_type: v }); setPage(1); }}>
              <Option value="text">文本</Option>
              <Option value="audio">音频</Option>
              <Option value="video">视频</Option>
            </Select>
            <Select placeholder="状态" allowClear style={{ width: 140 }} onChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}>
              {(['draft', 'pending', 'approved'] as RecordStatusEnum[]).map((s) => <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>)}
            </Select>
            <Input prefix={<SearchOutlined />} placeholder="搜索标题" allowClear style={{ width: 180 }} onPressEnter={(e: any) => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); }} />
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
          </Space>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Tooltip title={`批量处理 ${selectedRowKeys.length} 条`}>
                <Button type="primary" ghost onClick={batchUpdate}>批量操作 ({selectedRowKeys.length})</Button>
              </Tooltip>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')}>新建内容</Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns as any}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title={modalMode === 'create' ? '新建导览内容' : modalMode === 'update' ? '编辑导览内容' : '内容预览'}
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
              {contentTypeIcon(current.content_type)}
              <Tag color="blue">{current.language}</Tag>
              <Tag color={STATUS_COLORS[current.status]}>{STATUS_LABELS[current.status]}</Tag>
            </Space>
            <Title level={4} style={{ margin: 0 }}>{current.title}</Title>
            <div style={{ marginTop: 16 }}>
              {current.content_text && <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 6 }}>{current.content_text}</Paragraph>}
              {current.audio_url && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">音频：</Text>
                  <audio controls src={current.audio_url} style={{ width: '100%' }} />
                </div>
              )}
              {current.video_url && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">视频：</Text>
                  <video controls src={current.video_url} style={{ width: '100%' }} />
                </div>
              )}
              <div style={{ marginTop: 16, color: '#666' }}>
                所属路线：{routeMap[current.route_id] || `#${current.route_id}`} · 排序：{current.sort_order}
              </div>
            </div>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="所属路线" name="route_id" rules={[{ required: true }]}>
              <Select>
                {routes.map((r) => <Option key={r.id} value={r.id}>{r.name}</Option>)}
              </Select>
            </Form.Item>
            <Row gutter={12}>
              <Col span={16}>
                <Form.Item label="标题" name="title" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="语言" name="language" initialValue="zh-CN">
                  <Select>
                    <Option value="zh-CN">中文</Option>
                    <Option value="en-US">English</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="排序" name="sort_order" initialValue={0}>
                  <Input type="number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label="内容类型" name="content_type" initialValue="text">
                  <Radio.Group>
                    <Radio value="text">文本</Radio>
                    <Radio value="audio">音频</Radio>
                    <Radio value="video">视频</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="状态" name="status" initialValue="pending">
                  <Select>
                    {(['draft', 'pending', 'approved'] as RecordStatusEnum[]).map((s) => <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.content_type !== cur.content_type}>
              {({ getFieldValue }) => {
                const type = getFieldValue('content_type');
                return (
                  <>
                    {type === 'text' && (
                      <Form.Item label="文本内容" name="content_text">
                        <TextArea rows={6} />
                      </Form.Item>
                    )}
                    {type === 'audio' && (
                      <Form.Item label="音频URL" name="audio_url">
                        <Input placeholder="https://...mp3" />
                      </Form.Item>
                    )}
                    {type === 'video' && (
                      <Form.Item label="视频URL" name="video_url">
                        <Input placeholder="https://...mp4" />
                      </Form.Item>
                    )}
                  </>
                );
              }}
            </Form.Item>
          </Form>
        )}
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
                  <div style={{ marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 4 }}>
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

      <Drawer title="附件管理" open={attachOpen} onClose={() => setAttachOpen(false)} width={500}>
        <div style={{ marginBottom: 16 }}>
          <Upload.Dragger {...uploadProps as any} multiple>
            <p className="ant-upload-drag-icon"><PaperClipOutlined style={{ fontSize: 36 }} /></p>
            <p>点击或拖拽文件到此处上传</p>
            <p style={{ color: '#999' }}>支持任意类型文件上传</p>
          </Upload.Dragger>
        </div>
        <div style={{ marginTop: 24 }}>
          <Title level={5}>已上传 ({attachList.length})</Title>
          {attachList.length === 0 ? (
            <Empty description="暂无附件" />
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
