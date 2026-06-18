import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Table, Card, Button, Space, Tag, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { inspectionApi, workOrderApi } from '../lib/api';
import type { Inspection } from '../lib/types';

const typeLabels: Record<string, string> = {
  pre_inspection: '工前检查',
  in_progress: '过程检查',
  final: '终检',
};

const resultConfig: Record<string, { text: string; color: string }> = {
  pass: { text: '合格', color: 'green' },
  fail: { text: '不合格', color: 'red' },
  conditional: { text: '有条件通过', color: 'orange' },
};

export default function InspectionsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [resultFilter, setResultFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', typeFilter, resultFilter],
    queryFn: async () => {
      const inspections = await inspectionApi
        .list({ type: typeFilter, result: resultFilter })
        .then((r) => r.data as unknown as Inspection[]);
      const orderMap = new Map<string, string>();
      try {
        const ordersRes = await workOrderApi.list({ page: 1, page_size: 500 });
        (ordersRes.data?.items ?? []).forEach((o: { id: string; order_no: string }) => {
          orderMap.set(o.id, o.order_no);
        });
      } catch {
        /* ignore */
      }
      return { inspections, orderMap };
    },
  });

  const columns = [
    {
      title: '工单号',
      dataIndex: 'work_order_id',
      key: 'work_order_id',
      width: 140,
      render: (v: string) => data?.orderMap.get(v) ?? v?.slice(0, 8),
    },
    {
      title: '检查类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (v: string) => typeLabels[v] ?? v,
    },
    {
      title: '检查结果',
      dataIndex: 'result',
      key: 'result',
      width: 110,
      render: (v: string) => {
        const cfg = resultConfig[v] || { text: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '检验员', dataIndex: 'inspector_name', key: 'inspector_name', width: 100, render: (v: string) => v || '-' },
    {
      title: '时间',
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
      render: (_: unknown, record: Inspection) => (
        <Button type="link" size="small" onClick={() => navigate({ to: '/inspections/$id', params: { id: record.id } })}>
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
              placeholder="检查类型"
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))}
            />
            <Select
              placeholder="检查结果"
              value={resultFilter}
              onChange={(v) => setResultFilter(v)}
              allowClear
              style={{ width: 140 }}
              options={Object.entries(resultConfig).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => {
              setTypeFilter(undefined); setResultFilter(undefined);
            }}>
              刷新
            </Button>
          </Space>
        </Space>
      </Card>

      <Card bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.inspections ?? []}
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 750 }}
        />
      </Card>
    </div>
  );
}
