import { ReactNode, useState } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Form, Modal, Drawer,
  Descriptions, App as AntdApp, Popconfirm, Upload, Tooltip, Typography, Timeline,
} from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, CheckCircleOutlined, DeleteOutlined, UploadOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../store/auth';
import { api } from '../api';
import { STATUS_COLORS, STATUS_LABELS, TraceItem } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export interface ColumnConfig<T = any> {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  render?: (value: any, record: T, index: number) => ReactNode;
  searchable?: boolean;
  searchType?: 'text' | 'select';
  searchOptions?: { label: string; value: any }[];
}

export interface UseCRUDOptions<T> {
  baseUrl: string;
  name: string;
  nameKey: keyof T & string;
  statusKey?: keyof T & string;
  createSchema?: any;
  updateSchema?: any;
  columns: ColumnConfig<T>[];
  verifyUrl?: (id: number) => string;
  deleteUrl?: (id: number) => string;
  auditType?: string;
  role?: string | string[];
  batchUrl?: string;
}

export function buildCRUD<T extends { id: number }>(opts: UseCRUDOptions<T>) {
  const { message, modal } = AntdApp.useApp();
  const { hasRole } = useAuth();
  const [form] = Form.useForm();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState<Record<string, any>>({});
  const [modalType, setModalType] = useState<'create' | 'update' | 'view' | 'trace' | null>(null);
  const [current, setCurrent] = useState<T | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [trace, setTrace] = useState<TraceItem[]>([]);

  const canEdit = !opts.role || (Array.isArray(opts.role) ? opts.role.some(r => hasRole(r as any)) : hasRole(opts.role as any));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(opts.baseUrl, {
        page, page_size: pageSize, ...search,
      });
      setData(res.data.items || []);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'create' | 'update' | 'view' | 'trace', record?: T) => {
    setCurrent(record || null);
    setModalType(type);
    if (type === 'update' && record) {
      form.setFieldsValue(record);
    } else if (type === 'create') {
      form.resetFields();
    }
    if (type === 'trace' && record && opts.auditType) {
      api.get('/audit-logs/trace', {
        record_type: opts.auditType,
        record_id: record.id,
      }).then(r => setTrace(r.data));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalType === 'create') {
        await api.post(opts.baseUrl, values);
        message.success('创建成功');
      } else if (modalType === 'update' && current) {
        await api.put(`${opts.baseUrl}/${current.id}`, values);
        message.success('更新成功');
      }
      setModalType(null);
      fetchData();
    } catch (e) { /* handled */ }
  };

  const handleVerify = async (record: T) => {
    if (!opts.verifyUrl) return;
    await api.post(opts.verifyUrl(record.id));
    message.success('复核完成');
    fetchData();
  };

  const handleDelete = async (record: T) => {
    const deleteFn = opts.deleteUrl;
    if (!deleteFn) return;
    modal.confirm({
      title: '确认删除？',
      content: `删除后不可恢复`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await api.delete(deleteFn(record.id));
        message.success('删除成功');
        fetchData();
      },
    });
  };

  const handleBatchUpdate = async () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: `批量更新 ${selectedRowKeys.length} 条${opts.name}`,
      content: (
        <Form layout="vertical" id="batch-form">
          <Form.Item label="状态">
            <Select
              id="batch-status"
              allowClear
              placeholder="选择要统一设置的状态"
              style={{ width: '100%' }}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已取消', value: 'cancelled' },
                { label: '已完成', value: 'completed' },
              ]}
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const status = (document.getElementById('batch-status') as HTMLSelectElement)?.value;
        const updates: any = {};
        if (status) updates.status = status;
        if (Object.keys(updates).length === 0) {
          message.warning('请至少设置一个字段');
          return;
        }
        await api.post(opts.batchUrl || `${opts.baseUrl}/batch-update`, {
          ids: selectedRowKeys.map(Number),
          updates,
          remarks: `批量更新${selectedRowKeys.length}条`,
        });
        message.success('批量任务已提交');
        setSelectedRowKeys([]);
        fetchData();
      },
    });
  };

  const StatusTag = (v: string) => (
    <Tag color={STATUS_COLORS[v as keyof typeof STATUS_COLORS]}>
      {STATUS_LABELS[v as keyof typeof STATUS_LABELS] || v}
    </Tag>
  );

  const searchFields = opts.columns.filter(c => c.searchable);

  const columns: TableProps<T>['columns'] = [
    ...opts.columns.map(c => ({
      title: c.title,
      dataIndex: c.dataIndex,
      key: c.key,
      width: c.width,
      render: (v: any, rec: T, i: number) => {
        if (c.render) return c.render(v, rec, i);
        if (opts.statusKey && c.key === opts.statusKey) return StatusTag(v);
        if (typeof v === 'string' && v.includes('T')) return dayjs(v).format('YYYY-MM-DD HH:mm');
        return v;
      },
    })),
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, rec: T) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => openModal('trace', rec)}>
            痕迹
          </Button>
          <Button type="link" size="small" onClick={() => openModal('view', rec)}>查看</Button>
          {canEdit && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal('update', rec)}>
              编辑
            </Button>
          )}
          {opts.verifyUrl && canEdit && (rec as any).status !== 'approved' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleVerify(rec)}>
              复核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return {
    renderPage: () => (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space wrap>
            {searchFields.map(c => (
              c.searchType === 'select' ? (
                <Select
                  key={c.key}
                  placeholder={c.title}
                  allowClear
                  style={{ width: 160 }}
                  options={c.searchOptions}
                  onChange={(v) => { setSearch({ ...search, [c.key]: v }); setPage(1); }}
                />
              ) : (
                <Input
                  key={c.key}
                  prefix={<SearchOutlined />}
                  placeholder={`搜索${c.title}`}
                  allowClear
                  style={{ width: 180 }}
                  onPressEnter={(e: any) => { setSearch({ ...search, [c.key]: e.target.value }); setPage(1); }}
                />
              )
            ))}
            <Input
              placeholder="关键词搜索"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 180 }}
              onPressEnter={(e: any) => { setSearch({ ...search, keyword: e.target.value }); setPage(1); }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => { setSearch({}); setPage(1); fetchData(); }}>
              重置
            </Button>
          </Space>
          <Space>
            {canEdit && opts.batchUrl !== null && selectedRowKeys.length > 0 && (
              <Tooltip title={`批量更新 ${selectedRowKeys.length} 条`}>
                <Button type="primary" ghost onClick={handleBatchUpdate}>
                  批量操作 ({selectedRowKeys.length})
                </Button>
              </Tooltip>
            )}
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')}>
                新建{opts.name}
              </Button>
            )}
          </Space>
        </Space>

        <Table<T>
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          rowSelection={canEdit ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          } : undefined}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1200 }}
        />

        <Modal
          title={modalType === 'create' ? `新建${opts.name}` : modalType === 'update' ? `编辑${opts.name}` : `查看${opts.name}`}
          open={modalType === 'create' || modalType === 'update' || modalType === 'view'}
          onCancel={() => setModalType(null)}
          onOk={handleSubmit}
          okButtonProps={modalType === 'view' ? { style: { display: 'none' } } : undefined}
          cancelText={modalType === 'view' ? '关闭' : '取消'}
          okText="提交"
          width={640}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            disabled={modalType === 'view'}
            initialValues={current || {}}
          >
            {opts.columns.filter(c => c.key !== 'id').map(c => (
              <Form.Item
                key={c.key}
                label={c.title}
                name={c.dataIndex}
                rules={c.key === opts.nameKey || c.key === 'code' ? [{ required: true }] : undefined}
              >
                {c.dataIndex === 'description' || c.dataIndex === 'content' || c.dataIndex === 'content_text' ? (
                  <TextArea rows={4} />
                ) : (
                  <Input />
                )}
              </Form.Item>
            ))}
          </Form>
        </Modal>

        <Drawer
          title="处理痕迹"
          open={modalType === 'trace'}
          onClose={() => setModalType(null)}
          width={640}
        >
          <Timeline
            items={trace.map(t => ({
              color: t.action === 'create' ? 'green' : t.action === 'delete' ? 'red' : 'blue',
              children: (
                <Space direction="vertical" size={0} style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag>{t.action}</Tag>
                    <Text strong>{t.user_name || `用户#${t.user_id}`}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(t.at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </Space>
                  {t.field && (
                    <Descriptions column={1} size="small" style={{ marginTop: 4 }}>
                      <Descriptions.Item label="字段">{t.field}</Descriptions.Item>
                      {t.old && <Descriptions.Item label="原值"><Text delete type="danger">{t.old}</Text></Descriptions.Item>}
                      {t.new && <Descriptions.Item label="新值"><Text strong type="success">{t.new}</Text></Descriptions.Item>}
                    </Descriptions>
                  )}
                  {t.remarks && <Text type="secondary" style={{ fontSize: 12 }}>{t.remarks}</Text>}
                </Space>
              ),
            }))}
          />
        </Drawer>
      </Space>
    ),
    fetchData,
  };
}
