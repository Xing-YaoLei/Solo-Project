import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Descriptions, Tag, Button, Space, Image, Upload, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { inspectionApi } from '../lib/api';

const typeLabels: Record<string, string> = { pre_work: '工前检查', in_process: '过程检查', final: '终检' };
const resultConfig: Record<string, { text: string; color: string }> = {
  pass: { text: '合格', color: 'green' },
  fail: { text: '不合格', color: 'red' },
  conditional_pass: { text: '有条件通过', color: 'orange' },
};

export default function InspectionDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => inspectionApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <Card loading />;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate({ to: '/inspections' })}>
          返回
        </Button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          质检记录 #{id}
        </span>
      </Space>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="工单号">{inspection?.order_no}</Descriptions.Item>
          <Descriptions.Item label="检查类型">{typeLabels[inspection?.type ?? ''] ?? inspection?.type}</Descriptions.Item>
          <Descriptions.Item label="检验员">{inspection?.inspector_name}</Descriptions.Item>
          <Descriptions.Item label="结果">
            <Tag color={resultConfig[inspection?.result ?? '']?.color}>
              {resultConfig[inspection?.result ?? '']?.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="时间">
            {dayjs(inspection?.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {inspection?.notes && (
            <Descriptions.Item label="备注" span={2}>{inspection.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="照片" bordered={false}>
        {inspection?.photos?.length > 0 ? (
          <Image.PreviewGroup>
            <Space wrap>
              {inspection.photos.map((photo, idx) => (
                <Image
                  key={idx}
                  width={160}
                  height={120}
                  src={photo}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
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
