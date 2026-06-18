import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Table, Card, Button, Space, Tag, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { inspectionApi } from '../lib/api';

const typeLabels: Record<string, string> = { pre_work: '工前检查', in_process: '过程检查', final: '终检' };
const resultConfig: Record<string, { text: string; color: string }> = {
  pass: { text: '合格', color: 'green' },
  fail: { text: '不合格', color: 'red' },
  conditional_pass: { text: '有条件通过', color: 'orange' },
};

export default function InspectionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [resultFilter, setResultFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', page, pageSize, typeFilter, resultFilter],
    queryFn: () =>
      inspectionApi
        .list({ page, page_size: pageSize, type: typeFilter, result: resultFilter })
        .then((r) => r.data),
  });

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => typeLabels[v] ?? v,
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (v: string) => {
        const cfg = resultConfig[v] || { text: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '检验员', dataIndex: 'inspector_name', key: 'inspector_name', width: 100 },
    {
      title: '时间',
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
        <Button type="link" size="small" onClick={() => navigate({ to: '/inspections/$id', params: { id: String(record.id) } })}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="检查类型"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
            allowClear
            style={{ width: 140 }}
            options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            placeholder="检查结果"
            value={resultFilter}
            onChange={(v) => { setResultFilter(v); setPage(1); }}
            allowClear
            style={{ width: 140 }}
            options={Object.entries(resultConfig).map(([k, v]) => ({ value: k, label: v.text }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => {}}>
            刷新
          </Button>
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
        />
      </Card>
    </div>
  );
}
