import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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
  pending: { text: '待分配', color: 'default' },
  assigned: { text: '已分配', color: 'processing' },
  in_progress: { text: '进行中', color: 'blue' },
  parts_issued: { text: '已发料', color: 'cyan' },
  quality_check: { text: '质检中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  rework: { text: '返工', color: 'red' },
};

const priorityConfig: Record<string, { text: string; color: string }> = {
  low: { text: '低', color: 'default' },
  normal: { text: '普通', color: 'blue' },
  high: { text: '高', color: 'orange' },
  urgent: { text: '紧急', color: 'red' },
};

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', page, pageSize, search, statusFilter, priorityFilter, dateRange],
    queryFn: () =>
      workOrderApi
        .list({
          page,
          page_size: pageSize,
          search: search || undefined,
          status: statusFilter,
          priority: priorityFilter,
          start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
          end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        })
        .then((r) => r.data),
  });

  const batchStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: OrderStatus }) =>
      workOrderApi.batchUpdate(ids, status),
    onSuccess: () => {
      message.success('批量状态更新成功');
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
    { title: '顾问', dataIndex: 'consultant_name', key: 'consultant_name', width: 80 },
    {
      title: '技师',
      dataIndex: 'technician_name',
      key: 'technician_name',
      width: 80,
      render: (v: string) => v || '-',
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
      width: 120,
      render: (_: unknown, record: WorkOrder) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate({ to: '/work-orders/$id', params: { id: String(record.id) } })}>
            查看
          </Button>
        </Space>
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
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              allowClear
              style={{ width: 120 }}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
            <Select
              placeholder="优先级"
              value={priorityFilter}
              onChange={(v) => { setPriorityFilter(v); setPage(1); }}
              allowClear
              style={{ width: 120 }}
              options={Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.text }))}
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
                items: Object.entries(statusConfig).map(([k, v]) => ({
                  key: k,
                  label: v.text,
                  onClick: () =>
                    batchStatusMutation.mutate({
                      ids: selectedRowKeys.map(String),
                      status: k as OrderStatus,
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
