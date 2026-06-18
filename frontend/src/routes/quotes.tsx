import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Table, Card, Button, Space, Tag, Select } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quoteApi } from '../lib/api';

const statusConfig: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending_approval: { text: '待审批', color: 'processing' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
};

export default function QuotesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', page, pageSize, statusFilter],
    queryFn: () =>
      quoteApi
        .list({ page, page_size: pageSize, status: statusFilter })
        .then((r) => r.data),
  });

  const columns = [
    { title: '报价单号', dataIndex: 'quote_no', key: 'quote_no', width: 140 },
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name', width: 100 },
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
      render: (v: number) => `¥${(v ?? 0).toFixed(2)}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: { id: number }) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/quotes/$id', params: { id: String(record.id) } })}>
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
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => {}}>
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
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
