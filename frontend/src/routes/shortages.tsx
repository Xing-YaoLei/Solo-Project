import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Table, Card, Button, Space, Tag, Select, Badge, Tooltip,
} from 'antd';
import type { ColumnType } from 'antd/es/table';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { shortageApi, workOrderApi } from '../lib/api';
import type { Shortage } from '../lib/types';

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'red' },
  procuring: { text: '采购中', color: 'orange' },
  arrived: { text: '已到货', color: 'blue' },
  substituted: { text: '已替代', color: 'purple' },
  cancelled: { text: '已取消', color: 'default' },
};

export default function ShortagesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['shortages', statusFilter],
    queryFn: async () => {
      const shortageRes = await shortageApi
        .list({ status: statusFilter });
      const shortages = shortageRes.data;
      const orderMap = new Map<string, string>();
      try {
        const ordersRes = await workOrderApi.list({ page: 1, page_size: 500 });
        (ordersRes.data?.items ?? []).forEach((o) => {
          orderMap.set(o.id, o.order_no);
        });
      } catch {
        /* ignore */
      }
      return { shortages, orderMap };
    },
  });

  const isUrgent = (createdAt: string, status: string) => {
    if (status === 'arrived' || status === 'substituted' || status === 'cancelled') return false;
    const days = dayjs().diff(dayjs(createdAt), 'day');
    return days >= 3;
  };

  const pendingCount = (data?.shortages ?? []).filter((s) => s.status === 'pending').length;

  const columns: ColumnType<Shortage>[] = [
    {
      title: '工单号',
      dataIndex: 'work_order_id',
      key: 'work_order_id',
      width: 130,
      render: (v: string) => data?.orderMap.get(v) ?? v?.slice(0, 8),
    },
    { title: '配件名称', dataIndex: 'part_name', key: 'part_name', width: 150 },
    { title: '需求数量', dataIndex: 'requested_quantity', key: 'requested_quantity', width: 90 },
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
      width: 120,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '紧急',
      key: 'urgent',
      width: 70,
      render: (_: unknown, record: Shortage) =>
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
      fixed: 'right',
      render: (_: unknown, record: Shortage) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/shortages/$id', params: { id: record.id } })}>
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
              onChange={(v) => setStatusFilter(v)}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
            <Badge count={pendingCount} offset={[6, 0]}>
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
          dataSource={data?.shortages ?? []}
          loading={isLoading}
          rowClassName={(record: Shortage) => {
            if (record.status === 'arrived' || record.status === 'substituted' || record.status === 'cancelled') return '';
            return isUrgent(record.created_at, record.status) ? 'shortage-urgent-row' : 'shortage-pending-row';
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 850 }}
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
