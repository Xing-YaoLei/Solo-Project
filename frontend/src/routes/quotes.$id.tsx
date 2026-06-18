import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Descriptions, Table, Tag, Button, Space, message, Modal, Input } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quoteApi, workOrderApi } from '../lib/api';
import type { Quote, QuoteItem } from '../lib/types';
import { getStoredUser, isRole } from '../lib/auth';

const statusConfig: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  sent: { text: '已发送', color: 'processing' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
};

const itemTypeLabels: Record<string, string> = {
  labor: '工时',
  part: '配件',
  other: '其他',
};

export default function QuoteDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quoteApi.get(id).then((r) => r.data as unknown as Quote),
    enabled: !!id,
  });

  const { data: orderInfo } = useQuery({
    queryKey: ['quote-order', quote?.work_order_id],
    queryFn: async () => {
      if (!quote?.work_order_id) return null;
      try {
        const r = await workOrderApi.get(quote.work_order_id);
        return r.data;
      } catch {
        return null;
      }
    },
    enabled: !!quote?.work_order_id,
  });

  const approveMutation = useMutation({
    mutationFn: () => quoteApi.changeStatus(id, 'approved'),
    onSuccess: () => {
      message.success('审批通过');
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
    onError: () => message.error('审批失败'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => quoteApi.changeStatus(id, 'rejected', reason),
    onSuccess: () => {
      message.success('已驳回');
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
    onError: () => message.error('驳回失败'),
  });

  const handleReject = () => {
    Modal.confirm({
      title: '驳回报价单',
      content: (
        <Input.TextArea id="reject-reason" rows={3} placeholder="请输入驳回原因" />
      ),
      onOk: () => {
        const textarea = document.getElementById('reject-reason') as HTMLTextAreaElement;
        const reason = textarea?.value || '';
        return rejectMutation.mutateAsync(reason);
      },
    });
  };

  const canApprove = !!(user && isRole(user, 'manager'));
  const canBeApproved = quote?.status === 'sent' || quote?.status === 'draft';

  if (isLoading) return <Card loading />;

  const columns = [
    {
      title: '类型',
      dataIndex: 'item_type',
      key: 'item_type',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'labor' ? 'blue' : v === 'part' ? 'green' : 'default'}>
          {itemTypeLabels[v] ?? v}
        </Tag>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 110,
      render: (v: number) => `¥${Number(v ?? 0).toFixed(2)}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => `¥${Number(v ?? 0).toFixed(2)}`,
    },
  ];

  const items = quote?.items ?? [];
  const laborTotal = items.filter((i) => i.item_type === 'labor').reduce((s, i) => s + (i.amount ?? 0), 0);
  const partsTotal = items.filter((i) => i.item_type === 'part').reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/quotes' })}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>{quote?.quote_no}</span>
        <Tag color={statusConfig[quote?.status ?? '']?.color}>
          {statusConfig[quote?.status ?? '']?.text}
        </Tag>
      </Space>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="报价单号">{quote?.quote_no}</Descriptions.Item>
          <Descriptions.Item label="关联工单号">
            {orderInfo?.order_no ?? quote?.work_order_id?.slice(0, 8)}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {orderInfo?.customer_name ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="工时费用">¥{laborTotal.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="配件费用">¥{partsTotal.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="总金额">
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1890ff' }}>
              ¥{Number(quote?.total_amount ?? 0).toFixed(2)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {quote?.created_at ? dayjs(quote.created_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {quote?.updated_at ? dayjs(quote.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审批人">
            {quote?.approved_by ? quote.approved_by.slice(0, 8) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {quote?.notes || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="明细项目" bordered={false} style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          pagination={false}
          size="small"
          summary={(rows: readonly QuoteItem[]) => {
            const total = rows.reduce((sum, item) => sum + (item.amount ?? 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}><strong>合计</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}><strong>¥{total.toFixed(2)}</strong></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {canApprove && canBeApproved && (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => approveMutation.mutate()}
            loading={approveMutation.isPending}
          >
            审批通过
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
            loading={rejectMutation.isPending}
          >
            驳回
          </Button>
        </Space>
      )}
    </div>
  );
}
