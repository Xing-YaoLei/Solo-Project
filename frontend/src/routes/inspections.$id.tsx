import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Descriptions, Tag, Button, Space, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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

export default function InspectionDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => inspectionApi.get(id).then((r) => r.data as unknown as Inspection),
    enabled: !!id,
  });

  const { data: orderInfo } = useQuery({
    queryKey: ['inspection-order', inspection?.work_order_id],
    queryFn: async () => {
      if (!inspection?.work_order_id) return null;
      try {
        const r = await workOrderApi.get(inspection.work_order_id);
        return r.data;
      } catch {
        return null;
      }
    },
    enabled: !!inspection?.work_order_id,
  });

  if (isLoading) return <Card loading />;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/inspections' })}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          {typeLabels[inspection?.type ?? ''] ?? '质检记录'}
        </span>
        <Tag color={resultConfig[inspection?.result ?? '']?.color}>
          {resultConfig[inspection?.result ?? '']?.text}
        </Tag>
      </Space>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="工单号">
            {orderInfo?.order_no ?? inspection?.work_order_id?.slice(0, 8)}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {orderInfo?.customer_name ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="检查类型">
            {typeLabels[inspection?.type ?? ''] ?? inspection?.type}
          </Descriptions.Item>
          <Descriptions.Item label="结果">
            <Tag color={resultConfig[inspection?.result ?? '']?.color}>
              {resultConfig[inspection?.result ?? '']?.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="检验员">-</Descriptions.Item>
          <Descriptions.Item label="时间">
            {dayjs(inspection?.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {inspection?.notes && (
            <Descriptions.Item label="备注" span={2}>{inspection.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="质检照片" bordered={false}>
        {inspection?.photos && inspection.photos.length > 0 ? (
          <Image.PreviewGroup>
            <Space wrap size={12}>
              {inspection.photos.map((photo, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <Image
                    width={180}
                    height={135}
                    src={photo.photo_url}
                    alt={photo.description || `photo-${idx + 1}`}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                  {photo.description && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12,
                      padding: '4px 8px', borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                    }}>
                      {photo.description}
                    </div>
                  )}
                </div>
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无照片</div>
        )}
      </Card>
    </div>
  );
}
