import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  Table, Card, Button, Space, Tag, Input, Select, DatePicker, message, Dropdown,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, DownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { workOrderApi } from '../lib/api';
import type { WorkOrder, OrderStatus } from '../lib/types';

const { RangePicker } = DatePicker;

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待确认', color: 'default' },
  confirmed: { text: '已确认', color: 'processing' },
  in_progress: { text: '进行中', color: 'blue' },
  waiting_parts: { text: '待料', color: 'orange' },
  in_inspection: { text: '质检中', color: 'purple' },
  completed: { text: '已完成', color: 'green' },
  closed: { text: '已关闭', color: 'default' },
  rework: { text: '返工', color: 'red' },
};

const priorityConfig: Record<string, { text: string; color: string }> = {
  normal: { text: '普通', color: 'blue' },
  urgent: { text: '紧急', color: 'orange' },
  critical: { text: '加急', color: 'red' },
};

const BATCH_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'confirmed', label: '已确认' },
  { value: 'in_progress', label: '进行中' },
  { value: 'waiting_parts', label: '待料' },
  { value: 'in_inspection', label: '质检中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
  { value: 'rework', label: '返工' },
];

interface WorkOrdersSearch {
  status?: string;
}

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = useSearch({ strict: false }) as WorkOrdersSearch;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(search.status);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    setStatusFilter(search.status);
    setPage(1);
  }, [search.status]);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', page, pageSize, searchText, statusFilter, dateRange],
    queryFn: () =>
      workOrderApi
        .list({
          page,
          page_size: pageSize,
          search: searchText || undefined,
          status: statusFilter,
          date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
          date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
        })
        .then((r) => r.data),
  });

  const batchStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: OrderStatus }) =>
      workOrderApi.batchUpdate(ids, status),
    onSuccess: (res) => {
      const d = res.data as { updated: number; total: number };
      message.success(`批量更新成功：${d.updated ?? 0}/${d.total ?? 0} 条`);
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: () => message.error('批量状态更新失败'),
  });

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name', width: 100 },
    { title: '车牌', dataIndex: 'vehicle_plate', key: 'vehicle_plate', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status] || { text: status, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => {
        const cfg = priorityConfig[p] || { text: p, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '顾问',
      dataIndex: 'assigned_consultant_id',
      key: 'assigned_consultant_id',
      width: 90,
      render: (v: string) => v ? v.slice(0, 8) : '-',
    },
    {
      title: '技师',
      dataIndex: 'assigned_technician_id',
      key: 'assigned_technician_id',
      width: 90,
      render: (v: string) => v ? v.slice(0, 8) : '-',
    },
    {
      title: '预计完成',
      dataIndex: 'estimated_completion',
      key: 'estimated_completion',
      width: 110,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: WorkOrder) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/work-orders/$id', params: { id: String(record.id) } })}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              placeholder="搜索工单号/客户/车牌"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
                navigate({
                  to: '/work-orders',
                  search: v ? { status: v } : {},
                  replace: true,
                });
              }}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
            <RangePicker
              value={dateRange}
              onChange={(v) => { setDateRange(v); setPage(1); }}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['work-orders'] })}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/work-orders/new' })}>
              新建工单
            </Button>
          </Space>
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Dropdown
              menu={{
                items: BATCH_STATUS_OPTIONS.map((opt) => ({
                  key: opt.value,
                  label: opt.label,
                  onClick: () =>
                    batchStatusMutation.mutate({
                      ids: selectedRowKeys.map(String),
                      status: opt.value,
                    }),
                })),
              }}
            >
              <Button>
                批量修改状态 <DownOutlined />
              </Button>
            </Dropdown>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </Card>
      )}

      <Card bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
