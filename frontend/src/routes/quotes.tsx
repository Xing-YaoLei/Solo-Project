import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Table, Card, Button, Space, Tag, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quoteApi, workOrderApi } from '../lib/api';
import type { Quote } from '../lib/types';

const statusConfig: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  sent: { text: '已发送', color: 'processing' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
};

export default function QuotesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter],
    queryFn: async () => {
      const quotes = await quoteApi
        .list({ status: statusFilter })
        .then((r) => r.data as unknown as Quote[]);
      const orderMap = new Map<string, { order_no: string; customer_name: string }>();
      try {
        const ordersRes = await workOrderApi.list({ page: 1, page_size: 500 });
        (ordersRes.data?.items ?? []).forEach((o: { id: string; order_no: string; customer_name: string }) => {
          orderMap.set(o.id, { order_no: o.order_no, customer_name: o.customer_name });
        });
      } catch {
        /* ignore */
      }
      return { quotes, orderMap };
    },
  });

  const columns = [
    { title: '报价单号', dataIndex: 'quote_no', key: 'quote_no', width: 180 },
    {
      title: '工单号',
      dataIndex: 'work_order_id',
      key: 'work_order_id',
      width: 140,
      render: (v: string) => data?.orderMap.get(v)?.order_no ?? v?.slice(0, 8),
    },
    {
      title: '客户',
      dataIndex: 'work_order_id',
      key: 'customer_name',
      width: 120,
      render: (v: string) => data?.orderMap.get(v)?.customer_name ?? '-',
    },
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
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (v: number) => `¥${Number(v ?? 0).toFixed(2)}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: Quote) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/quotes/$id', params: { id: record.id } })}>
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
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => navigate({ to: '/quotes' })}>
              刷新
            </Button>
          </Space>
        </Space>
      </Card>

      <Card bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.quotes ?? []}
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
