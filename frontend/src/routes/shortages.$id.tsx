import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Descriptions, Tag, Button, Space, Timeline, Form, Select, DatePicker, Input, message, Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { shortageApi, workOrderApi, partApi } from '../lib/api';
import type { Shortage, ShortageUpdate } from '../lib/types';
import { getStoredUser, hasPermission } from '../lib/auth';

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'red' },
  procuring: { text: '采购中', color: 'orange' },
  arrived: { text: '已到货', color: 'green' },
  substituted: { text: '已替代', color: 'purple' },
  cancelled: { text: '已取消', color: 'default' },
};

export default function ShortageDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updateForm] = Form.useForm();
  const user = getStoredUser();
  const canEdit = !!(user && hasPermission(user, 'shortages'));

  const { data: shortage, isLoading } = useQuery({
    queryKey: ['shortage', id],
    queryFn: () => shortageApi.get(id).then((r) => r.data as unknown as Shortage),
    enabled: !!id,
  });

  const { data: orderInfo } = useQuery({
    queryKey: ['shortage-order', shortage?.work_order_id],
    queryFn: async () => {
      if (!shortage?.work_order_id) return null;
      try {
        const r = await workOrderApi.get(shortage.work_order_id);
        return r.data;
      } catch {
        return null;
      }
    },
    enabled: !!shortage?.work_order_id,
  });

  const { data: substituteInfo } = useQuery({
    queryKey: ['substitute-part', shortage?.substitute_part_id],
    queryFn: async () => {
      if (!shortage?.substitute_part_id) return null;
      try {
        const r = await partApi.get(shortage.substitute_part_id);
        return r.data;
      } catch {
        return null;
      }
    },
    enabled: !!shortage?.substitute_part_id,
  });

  const updateMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const payload: ShortageUpdate = {};
      if (values.status) payload.status = values.status as string;
      if (values.expected_arrival) {
        payload.expected_arrival = (values.expected_arrival as dayjs.Dayjs).toISOString();
      }
      if (values.actual_arrival) {
        payload.actual_arrival = (values.actual_arrival as dayjs.Dayjs).toISOString();
      }
      if (values.substitute_part_id) payload.substitute_part_id = values.substitute_part_id as string;
      if (values.resolution_notes) payload.resolution_notes = values.resolution_notes as string;
      return shortageApi.update(id, payload);
    },
    onSuccess: () => {
      message.success('缺件处理更新成功');
      queryClient.invalidateQueries({ queryKey: ['shortage', id] });
      updateForm.resetFields();
    },
    onError: () => message.error('更新失败'),
  });

  if (isLoading) return <Card loading />;

  const isResolved =
    shortage?.status === 'arrived' ||
    shortage?.status === 'substituted' ||
    shortage?.status === 'cancelled';

  const statusTimeline: { color: string; text: string; time?: string }[] = [
    { color: 'red', text: '缺件登记', time: dayjs(shortage?.created_at).format('YYYY-MM-DD HH:mm') },
  ];
  if (shortage?.status === 'procuring') {
    statusTimeline.push({ color: 'orange', text: '已发起采购' });
  }
  if (shortage?.status === 'arrived') {
    statusTimeline.push({ color: 'orange', text: '已发起采购' });
    statusTimeline.push({
      color: 'green',
      text: '配件已到货',
      time: shortage.actual_arrival ? dayjs(shortage.actual_arrival).format('YYYY-MM-DD') : undefined,
    });
  }
  if (shortage?.status === 'substituted') {
    statusTimeline.push({ color: 'orange', text: '已发起采购' });
    statusTimeline.push({ color: 'purple', text: '已更换替代配件' });
  }
  if (shortage?.status === 'cancelled') {
    statusTimeline.push({ color: 'default', text: '需求已取消' });
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/shortages' })}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>{shortage?.part_name}</span>
        <Tag color={statusConfig[shortage?.status ?? '']?.color}>
          {statusConfig[shortage?.status ?? '']?.text}
        </Tag>
      </Space>

      <Card title="缺件信息" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="关联工单号">
            {orderInfo?.order_no ?? shortage?.work_order_id?.slice(0, 8)}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {orderInfo?.customer_name ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="需求数量">{shortage?.requested_quantity}</Descriptions.Item>
          <Descriptions.Item label="可用数量">{shortage?.available_quantity}</Descriptions.Item>
          <Descriptions.Item label="预计到货">
            {shortage?.expected_arrival ? dayjs(shortage.expected_arrival).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际到货">
            {shortage?.actual_arrival ? dayjs(shortage.actual_arrival).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(shortage?.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {shortage?.updated_at ? dayjs(shortage.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="材料信息" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="配件名称">{shortage?.part_name}</Descriptions.Item>
          <Descriptions.Item label="关联配件ID">
            {shortage?.part_id ? shortage.part_id.slice(0, 8) : '-'}
          </Descriptions.Item>
        </Descriptions>
        {shortage?.substitute_part_id && (
          <>
            <Divider />
            <Descriptions column={2} title="替代配件">
              <Descriptions.Item label="替代配件ID">{shortage.substitute_part_id.slice(0, 8)}</Descriptions.Item>
              <Descriptions.Item label="替代配件名称">{substituteInfo?.name ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="替代配件编号">{substituteInfo?.part_no ?? '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Card title="处理流程" bordered={false} style={{ marginBottom: 16 }}>
        <Timeline
          items={statusTimeline.map((item) => ({
            color: item.color,
            children: (
              <div>
                <div>{item.text}</div>
                {item.time && <div style={{ fontSize: 12, color: '#999' }}>{item.time}</div>}
              </div>
            ),
          }))}
        />
        {shortage?.resolution_notes && (
          <div style={{ marginTop: 16 }}>
            <strong>处理备注：</strong>{shortage.resolution_notes}
          </div>
        )}
      </Card>

      {!isResolved && canEdit && (
        <Card title="处理操作" bordered={false}>
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={(v) => updateMutation.mutate(v)}
            initialValues={{ status: shortage?.status }}
          >
            <Form.Item name="status" label="更新状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select
                options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.text }))}
              />
            </Form.Item>
            <Form.Item name="expected_arrival" label="预计到货日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="actual_arrival" label="实际到货日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="substitute_part_id" label="替代配件ID（如有）">
              <Input placeholder="输入替代配件的 UUID" />
            </Form.Item>
            <Form.Item name="resolution_notes" label="处理备注">
              <Input.TextArea rows={3} placeholder="请输入处理说明，包括采购进度、替代件信息等" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                提交处理
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {isResolved && (
        <Card title="最终处理" bordered={false} style={{ borderLeft: '3px solid #52c41a' }}>
          <Descriptions column={2}>
            <Descriptions.Item label="最终状态">
              <Tag color={statusConfig[shortage!.status].color}>
                {statusConfig[shortage!.status].text}
              </Tag>
            </Descriptions.Item>
            {shortage?.actual_arrival && (
              <Descriptions.Item label="到货日期">
                {dayjs(shortage.actual_arrival).format('YYYY-MM-DD')}
              </Descriptions.Item>
            )}
            {shortage?.substitute_part_id && (
              <Descriptions.Item label="替代配件">
                {substituteInfo?.name ?? shortage.substitute_part_id.slice(0, 8)}
              </Descriptions.Item>
            )}
            {shortage?.handled_by && (
              <Descriptions.Item label="处理人">
                {shortage.handled_by.slice(0, 8)}
              </Descriptions.Item>
            )}
            {shortage?.resolution_notes && (
              <Descriptions.Item label="处理备注" span={2}>{shortage.resolution_notes}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
