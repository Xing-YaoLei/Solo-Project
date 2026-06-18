import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Descriptions, Tag, Button, Space, Timeline, Form, Select, DatePicker, Input, message, Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { shortageApi } from '../lib/api';
import type { ShortageResolve } from '../lib/types';

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'red' },
  ordered: { text: '已下单', color: 'orange' },
  partial: { text: '部分到货', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
};

export default function ShortageDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resolveForm] = Form.useForm();

  const { data: shortage, isLoading } = useQuery({
    queryKey: ['shortage', id],
    queryFn: () => shortageApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  const resolveMutation = useMutation({
    mutationFn: (values: ShortageResolve) => shortageApi.resolve(Number(id), values),
    onSuccess: () => {
      message.success('缺件处理更新成功');
      queryClient.invalidateQueries({ queryKey: ['shortage', id] });
      resolveForm.resetFields();
    },
    onError: () => message.error('更新失败'),
  });

  if (isLoading) return <Card loading />;

  const isResolved = shortage?.status === 'resolved';

  const statusTimeline: { color: string; text: string; time?: string }[] = [
    { color: 'red', text: '缺件创建', time: dayjs(shortage?.created_at).format('YYYY-MM-DD HH:mm') },
  ];
  if (shortage?.status === 'ordered' || shortage?.status === 'partial' || shortage?.status === 'resolved') {
    statusTimeline.push({ color: 'orange', text: '已下单采购' });
  }
  if (shortage?.status === 'partial' || shortage?.status === 'resolved') {
    statusTimeline.push({ color: 'blue', text: '部分到货' });
  }
  if (shortage?.status === 'resolved') {
    statusTimeline.push({
      color: 'green',
      text: '已解决',
      time: shortage.resolved_at ? dayjs(shortage.resolved_at).format('YYYY-MM-DD HH:mm') : undefined,
    });
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/shortages' })}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>缺件记录 #{id}</span>
        <Tag color={statusConfig[shortage?.status ?? '']?.color}>
          {statusConfig[shortage?.status ?? '']?.text}
        </Tag>
      </Space>

      <Card title="缺件信息" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="工单号">{shortage?.order_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusConfig[shortage?.status ?? '']?.color}>
              {statusConfig[shortage?.status ?? '']?.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="需求数量">{shortage?.required_quantity}</Descriptions.Item>
          <Descriptions.Item label="可用数量">{shortage?.available_quantity}</Descriptions.Item>
          <Descriptions.Item label="预计到货">
            {shortage?.expected_arrival ? dayjs(shortage.expected_arrival).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(shortage?.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="配件信息" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="配件编号">{shortage?.part_no}</Descriptions.Item>
          <Descriptions.Item label="配件名称">{shortage?.part_name}</Descriptions.Item>
        </Descriptions>
        {shortage?.substitute_part_id && (
          <>
            <Divider />
            <Descriptions column={2} title="替代配件">
              <Descriptions.Item label="替代配件ID">{shortage.substitute_part_id}</Descriptions.Item>
              <Descriptions.Item label="替代配件名称">{shortage.substitute_part_name}</Descriptions.Item>
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
        {shortage?.notes && (
          <div style={{ marginTop: 16 }}>
            <strong>备注：</strong>{shortage.notes}
          </div>
        )}
      </Card>

      {!isResolved && (
        <Card title="处理操作" bordered={false}>
          <Form
            form={resolveForm}
            layout="vertical"
            onFinish={resolveMutation.mutate}
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
            <Form.Item name="notes" label="处理备注">
              <Input.TextArea rows={3} placeholder="请输入处理说明" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={resolveMutation.isPending}>
                提交处理
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {isResolved && (
        <Card title="解决信息" bordered={false} style={{ borderColor: '#52c41a' }}>
          <Descriptions column={2}>
            <Descriptions.Item label="解决时间">
              {shortage?.resolved_at ? dayjs(shortage.resolved_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="替代配件">
              {shortage?.substitute_part_name || '无'}
            </Descriptions.Item>
            {shortage?.notes && (
              <Descriptions.Item label="处理备注" span={2}>{shortage.notes}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
