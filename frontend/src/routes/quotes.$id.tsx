import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Descriptions, Table, Tag, Button, Space, message, Modal, Input } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { quoteApi } from '../lib/api';
import type { QuoteItem } from '../lib/types';
import { getStoredUser, isRole } from '../lib/auth';

const statusConfig: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending_approval: { text: '待审批', color: 'processing' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
};

export default function QuoteDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quoteApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ['quote-items', id],
    queryFn: () => quoteApi.getItems(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => quoteApi.approve(Number(id)),
    onSuccess: () => {
      message.success('审批通过');
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
    onError: () => message.error('审批失败'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => quoteApi.reject(Number(id), reason),
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

  const canApprove = user && isRole(user, 'manager');
  const isPendingApproval = quote?.status === 'pending_approval';

  if (isLoading) return <Card loading />;

  const columns = [
    {
      title: '类型',
      dataIndex: 'item_type',
      key: 'item_type',
      width: 80,
      render: (v: string) => (v === 'labor' ? '工时' : '配件'),
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
  ];

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
          <Descriptions.Item label="工单号">{quote?.order_no}</Descriptions.Item>
          <Descriptions.Item label="客户">{quote?.customer_name}</Descriptions.Item>
          <Descriptions.Item label="工时费用">¥{(quote?.labor_amount ?? 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="配件费用">¥{(quote?.parts_amount ?? 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="总金额">
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1890ff' }}>
              ¥{(quote?.total_amount ?? 0).toFixed(2)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="审批人">{quote?.approved_by || '-'}</Descriptions.Item>
          <Descriptions.Item label="审批时间">
            {quote?.approved_at ? dayjs(quote.approved_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注">{quote?.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="明细项目" bordered={false} style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items ?? []}
          pagination={false}
          size="small"
          summary={(data: QuoteItem[]) => {
            const total = data.reduce((sum, item) => sum + item.amount, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}><strong>合计</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}><strong>¥{total.toFixed(2)}</strong></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {canApprove && isPendingApproval && (
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
