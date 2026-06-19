import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  message, Drawer, Timeline, App as AntdApp, Row, Col, Statistic,
  Tooltip, Upload, Empty, Divider, Tabs, DatePicker, InputNumber, Typography, Descriptions,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  HistoryOutlined, ShopOutlined, FileTextOutlined,
  PaperClipOutlined, PhoneOutlined, EnvironmentOutlined,
  FileExcelOutlined, CalendarOutlined, DollarOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../../api';
import { STATUS_COLORS, STATUS_LABELS, Merchant, MerchantContract, RecordStatusEnum, TraceItem } from '../../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

export const Route = createLazyFileRoute('/_layout/operations/merchants')({
  component: MerchantsPage,
});

function MerchantsPage() {
  const { message, modal } = AntdApp.useApp();
  const [tab, setTab] = useState('merchants');
  const [merchData, setMerchData] = useState<Merchant[]>([]);
  const [contData, setContData] = useState<MerchantContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [merchTotal, setMerchTotal] = useState(0);
  const [contTotal, setContTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'merchant' | 'contract' | 'contract_view'>('merchant');
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [current, setCurrent] = useState<any>(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [traceOpen, setTraceOpen] = useState(false);
  const [trace, setTrace] = useState<TraceItem[]>([]);

  const [attachOpen, setAttachOpen] = useState(false);
  const [attachList, setAttachList] = useState<any[]>([]);
  const [attachTarget, setAttachTarget] = useState<{ type: string; id: number } | null>(null);

  const fetchMerch = () => {
    setLoading(true);
    api.get<any>('/operations/merchants', { page, page_size: pageSize }).then((r) => {
      setMerchData(r.data.items || []);
      setMerchTotal(r.data.total || 0);
      setLoading(false);
    });
  };

  const fetchCont = () => {
    setLoading(true);
    api.get<any>('/operations/contracts', { page, page_size: pageSize }).then((r) => {
      setContData(r.data.items || []);
      setContTotal(r.data.total || 0);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (tab === 'merchants') fetchMerch();
    else fetchCont();
  }, [tab, page, pageSize]);

  const merchMap = Object.fromEntries(merchData.map((m) => [m.id, m.name]) as any);

  const openModal = (type: 'merchant' | 'contract' | 'contract_view', mode: 'create' | 'update', record?: any) => {
    setModalType(type);
    setModalMode(mode);
    setCurrent(record || null);
    form.resetFields();
    if (record) {
      const data = { ...record };
      if (type !== 'merchant') {
        data.start_date = record.start_date ? dayjs(record.start_date) : null;
        data.end_date = record.end_date ? dayjs(record.end_date) : null;
      }
      form.setFieldsValue(data);
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      const payload = { ...v };
      if (modalType !== 'merchant') {
        payload.start_date = v.start_date?.format?.('YYYY-MM-DD') || v.start_date;
        payload.end_date = v.end_date?.format?.('YYYY-MM-DD') || v.end_date;
      }
      if (modalMode === 'create') {
        if (modalType === 'merchant') await api.post('/operations/merchants', payload);
        else if (modalType === 'contract') await api.post('/operations/contracts', payload);
        message.success('创建成功');
      } else if (current) {
        if (modalType === 'merchant') await api.put(`/operations/merchants/${current.id}`, payload);
        else if (modalType === 'contract') await api.put(`/operations/contracts/${current.id}`, payload);
        message.success('更新成功');
      }
      setModalOpen(false);
      if (modalType === 'merchant') fetchMerch();
      else fetchCont();
    } catch {}
  };

  const verifyCont = async (id: number) => {
    await api.post(`/operations/contracts/${id}/verify`);
    message.success('复核通过');
    fetchCont();
  };

  const batchUpdateCont = () => {
    if (selectedRowKeys.length === 0) return;
    let newStatus = '';
    modal.confirm({
      title: `批量更新 ${selectedRowKeys.length} 份合同`,
      content: (
        <Form layout="vertical">
          <Form.Item label="统一状态">
            <Select
              placeholder="选择状态"
              allowClear
              onChange={(v) => { newStatus = v; }}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已完成', value: 'completed' },
              ]}
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const updates: any = {};
        if (newStatus) updates.status = newStatus;
        if (Object.keys(updates).length === 0) return Promise.reject();
        await api.post('/operations/contracts/batch-update', {
          ids: selectedRowKeys.map(Number), updates,
        });
        message.success('批量任务已提交');
        setSelectedRowKeys([]);
        fetchCont();
      },
    });
  };

  const showTrace = (type: string, id: number) => {
    api.get('/audit-logs/trace', { record_type: type, record_id: id }).then((r) => {
      setTrace(r.data);
      setTraceOpen(true);
    });
  };

  const showAttachments = (type: string, id: number) => {
    api.get('/attachments', { record_type: type, record_id: id }).then((r) => {
      setAttachList(r.data || []);
      setAttachTarget({ type, id });
      setAttachOpen(true);
    });
  };

  const uploadProps = {
    name: 'files',
    multiple: true,
    action: '/api/v1/attachments/upload',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    data: () => ({ record_type: attachTarget?.type, record_id: attachTarget?.id }),
    onChange: (info: any) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        showAttachments(attachTarget!.type, attachTarget!.id);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  const merchColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '商户名称', dataIndex: 'name', width: 200,
      render: (v: string, r: Merchant) => (
        <Space>
          <ShopOutlined style={{ color: '#fa8c16' }} />
          <a onClick={() => openModal('merchant', 'update', r)}>{v}</a>
        </Space>
      ),
    },
    { title: '类别', dataIndex: 'category', width: 100, render: (v: string) => v ? <Tag color="orange">{v}</Tag> : '-' },
    { title: '联系人', dataIndex: 'contact_name', width: 100, render: (v: string) => v || '-' },
    { title: '电话', dataIndex: 'contact_phone', width: 130, render: (v: string) => v ? <a href={`tel:${v}`}><PhoneOutlined /> {v}</a> : '-' },
    { title: '地址', dataIndex: 'address', width: 180, render: (v: string) => v ? <span><EnvironmentOutlined /> {v.slice(0, 16)}</span> : '-' },
    { title: '创建', dataIndex: 'created_at', width: 140, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'actions', width: 180, fixed: 'right' as const,
      render: (_: any, r: Merchant) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace('merchant', r.id)}>痕迹</Button>
          <Button type="link" size="small" onClick={() => { setTab('contracts'); }}>合同</Button>
          <Button type="link" size="small" onClick={() => openModal('merchant', 'update', r)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const contColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '合同编号', dataIndex: 'contract_no', width: 160,
      render: (v: string) => <Tag color="purple" style={{ fontFamily: 'monospace' }}>{v}</Tag>,
    },
    {
      title: '合同标题', dataIndex: 'title', width: 220,
      render: (v: string, r: MerchantContract) => (
        <a onClick={() => openModal('contract_view', 'update', r)}>{v}</a>
      ),
    },
    { title: '商户', dataIndex: 'merchant_id', width: 140, render: (v: number) => merchMap[v] || `#${v}` },
    { title: '金额', dataIndex: 'amount', width: 110, render: (v: number) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{v.toLocaleString()}</span> },
    {
      title: '有效期', width: 220,
      render: (_: any, r: MerchantContract) => (
        <Space>
          <CalendarOutlined />
          <span>
            {dayjs(r.start_date).format('YY/MM/DD')}
            {r.end_date ? ` ~ ${dayjs(r.end_date).format('YY/MM/DD')}` : '起'}
          </span>
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: RecordStatusEnum) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</Tag>,
    },
    { title: '复核', dataIndex: 'verified_at', width: 140, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    {
      title: '操作', key: 'actions', width: 280, fixed: 'right' as const,
      render: (_: any, r: MerchantContract) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showTrace('merchant_contract', r.id)}>痕迹</Button>
          <Button type="link" size="small" icon={<PaperClipOutlined />} onClick={() => showAttachments('merchant_contract', r.id)}>附件</Button>
          <Button type="link" size="small" onClick={() => openModal('contract', 'update', r)}>编辑</Button>
          {r.status !== 'approved' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => verifyCont(r.id)}>复核</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card><Statistic title="商户总数" value={merchTotal} prefix={<ShopOutlined style={{ color: '#fa8c16' }} />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="合同总数" value={contTotal} prefix={<FileTextOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="合同总额"
              value={contData.reduce((s, c) => s + c.amount, 0)}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="待复核" value={contData.filter((c) => c.status === 'pending').length} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={tab}
          onChange={(k) => { setTab(k); setPage(1); setSelectedRowKeys([]); }}
          style={{ padding: '0 24px' }}
          items={[
            { key: 'merchants', label: '🏪 商户管理' },
            { key: 'contracts', label: '📄 商户合同' },
          ]}
        />
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input prefix={<SearchOutlined />} placeholder="搜索名称/编号" allowClear style={{ width: 180 }} />
            <Button icon={<ReloadOutlined />} onClick={() => tab === 'merchants' ? fetchMerch() : fetchCont()}>刷新</Button>
          </Space>
          <Space>
            {tab === 'contracts' && selectedRowKeys.length > 0 && (
              <Tooltip title={`批量操作 ${selectedRowKeys.length} 份`}>
                <Button type="primary" ghost onClick={batchUpdateCont}>批量更新 ({selectedRowKeys.length})</Button>
              </Tooltip>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(tab === 'merchants' ? 'merchant' : 'contract', 'create')}>
              新建{tab === 'merchants' ? '商户' : '合同'}
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={(tab === 'merchants' ? merchData : contData) as any}
          columns={(tab === 'merchants' ? merchColumns : contColumns) as any}
          rowSelection={tab === 'contracts' ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined}
          pagination={{
            current: page, pageSize, total: tab === 'merchants' ? merchTotal : contTotal,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={
          modalType === 'merchant'
            ? (modalMode === 'create' ? '新建商户' : '编辑商户')
            : modalType === 'contract_view'
            ? '合同详情'
            : (modalMode === 'create' ? '新建合同' : '编辑合同')
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={modalType === 'contract_view' ? undefined : handleSubmit}
        okButtonProps={modalType === 'contract_view' ? { style: { display: 'none' } } : undefined}
        cancelText={modalType === 'contract_view' ? '关闭' : '取消'}
        width={modalType === 'contract_view' ? 720 : 640}
        destroyOnClose
      >
        {modalType === 'contract_view' && current ? (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="purple" style={{ fontFamily: 'monospace', fontSize: 14 }}>{current.contract_no}</Tag>
              <Tag color={STATUS_COLORS[current.status as RecordStatusEnum]}>{STATUS_LABELS[current.status as RecordStatusEnum]}</Tag>
            </Space>
            <Title level={4} style={{ margin: '8px 0 16px' }}>{current.title}</Title>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="商户" span={2}>{merchMap[current.merchant_id] || `#${current.merchant_id}`}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{dayjs(current.start_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{current.end_date ? dayjs(current.end_date).format('YYYY-MM-DD') : '长期'}</Descriptions.Item>
              <Descriptions.Item label="合同金额" span={2}>
                <span style={{ color: '#fa8c16', fontWeight: 600, fontSize: 16 }}>¥{current.amount.toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="复核人">{current.verified_by ? `用户#${current.verified_by}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="复核时间">{current.verified_at ? dayjs(current.verified_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">合同内容</Divider>
            {current.content ? (
              <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 4 }}>
                {current.content}
              </Paragraph>
            ) : (
              <Empty description="暂无详细内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            <div style={{ marginTop: 16 }}>
              <Button icon={<PaperClipOutlined />} onClick={() => showAttachments('merchant_contract', current.id)}>
                查看附件
              </Button>
            </div>
          </div>
        ) : modalType === 'merchant' ? (
          <Form form={form} layout="vertical">
            <Form.Item label="商户名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="类别" name="category">
                  <Select placeholder="餐饮/纪念品/住宿/交通..." allowClear>
                    <Option value="餐饮">餐饮</Option>
                    <Option value="纪念品">纪念品</Option>
                    <Option value="住宿">住宿</Option>
                    <Option value="交通">交通</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="联系电话" name="contact_phone">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="联系人" name="contact_name">
              <Input />
            </Form.Item>
            <Form.Item label="地址" name="address">
              <TextArea rows={2} />
            </Form.Item>
          </Form>
        ) : (
          <Form form={form} layout="vertical">
            <Row gutter={12}>
              <Col span={14}>
                <Form.Item label="合同编号" name="contract_no" rules={[{ required: true }]}>
                  <Input placeholder="HT-2024-001" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label="商户" name="merchant_id" rules={[{ required: true }]}>
                  <Select placeholder="选择商户">
                    {merchData.map((m) => <Option key={m.id} value={m.id}>{m.name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="合同标题" name="title" rules={[{ required: true }]}>
              <Input placeholder="简要描述合同内容" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={10}>
                <Form.Item label="开始日期" name="start_date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label="结束日期" name="end_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="金额" name="amount" initialValue={0}>
                  <InputNumber style={{ width: '100%' }} prefix="¥" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="状态" name="status" initialValue="pending">
              <Select>
                {(['draft', 'pending', 'approved', 'completed'] as RecordStatusEnum[]).map((s) => (
                  <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="合同内容" name="content">
              <TextArea rows={6} placeholder="详细条款、合同内容..." />
            </Form.Item>
          </Form>
        )}
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

      <Drawer title="合同附件" open={attachOpen} onClose={() => setAttachOpen(false)} width={500}>
        <Upload.Dragger {...uploadProps as any} multiple>
          <p className="ant-upload-drag-icon"><PaperClipOutlined style={{ fontSize: 36 }} /></p>
          <p>上传合同扫描件/补充文件</p>
          <p style={{ color: '#999' }}>PDF、图片、Word 等任意格式</p>
        </Upload.Dragger>
        <Divider>已上传 ({attachList.length})</Divider>
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
      </Drawer>
    </Space>
  );
}
