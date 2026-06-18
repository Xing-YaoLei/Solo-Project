import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Table, Card, Button, Space, Tag, Select, Badge, Tooltip,
} from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { shortageApi } from '../lib/api';

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'red' },
  ordered: { text: '已下单', color: 'orange' },
  partial: { text: '部分到货', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
};

export default function ShortagesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['shortages', page, pageSize, statusFilter],
    queryFn: () =>
      shortageApi
        .list({ page, page_size: pageSize, status: statusFilter })
        .then((r) => r.data),
  });

  const isUrgent = (createdAt: string, status: string) => {
    if (status === 'resolved') return false;
    const days = dayjs().diff(dayjs(createdAt), 'day');
    return days >= 3;
  };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', width: 130 },
    { title: '配件名称', dataIndex: 'part_name', key: 'part_name', width: 130 },
    { title: '配件编号', dataIndex: 'part_no', key: 'part_no', width: 110 },
    { title: '需求数量', dataIndex: 'required_quantity', key: 'required_quantity', width: 90 },
    { title: '可用数量', dataIndex: 'available_quantity', key: 'available_quantity', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] || { text: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '预计到货',
      dataIndex: 'expected_arrival',
      key: 'expected_arrival',
      width: 110,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '紧急',
      key: 'urgent',
      width: 60,
      render: (_: unknown, record: { created_at: string; status: string }) =>
        isUrgent(record.created_at, record.status) ? (
          <Tooltip title="等待超过3天">
            <Tag color="volcano" icon={<ExclamationCircleOutlined />}>紧急</Tag>
          </Tooltip>
        ) : null,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: { id: number }) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/shortages/$id', params: { id: String(record.id) } })}>
          处理
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
            <Badge count={data?.items?.filter((s) => s.status === 'pending').length ?? 0} offset={[6, 0]}>
              <Tag color="red">待处理</Tag>
            </Badge>
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['shortages'] })}>
              刷新
            </Button>
          </Space>
        </Space>
      </Card>

      <Card bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          rowClassName={(record) => {
            if (record.status === 'resolved') return '';
            return isUrgent(record.created_at, record.status) ? 'shortage-urgent-row' : 'shortage-pending-row';
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <style>{`
        .shortage-urgent-row { background: #fff1f0 !important; }
        .shortage-pending-row { background: #fffbe6 !important; }
        .shortage-urgent-row:hover > td,
        .shortage-pending-row:hover > td { background: inherit !important; }
      `}</style>
    </div>
  );
}
