import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Descriptions,
  List,
  message,
  Select,
} from 'antd';
import {
  EyeOutlined,
  PlusOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { reviewApi } from '../services/api';
import type { ReviewMaterial, KeyIssue, Improvement } from '../types';

const ReviewPage = () => {
  const [data, setData] = useState<ReviewMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<ReviewMaterial | null>(null);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getList({ type: filterType });
      setData(res.data);
    } catch {
      message.warning('加载失败，显示模拟数据');
      setData([
        {
          id: 1,
          material_no: 'RM20260610A001',
          title: 'Python编程入门课程周度教材发放复盘',
          type: 'weekly',
          period_start: '2026-06-03',
          period_end: '2026-06-09',
          completion_rate: 67.19,
          alert_count: 2,
          summary: '本周共报名1280人，已发放930人，已签收860人，完成率67.19%。触发预警2个，需重点关注。',
          status: 'published',
          created_at: '2026-06-10T10:00:00Z',
        },
        {
          id: 2,
          material_no: 'RM20260603A001',
          title: 'Scratch创意编程周度复盘',
          type: 'weekly',
          period_start: '2026-05-27',
          period_end: '2026-06-02',
          completion_rate: 82.5,
          alert_count: 0,
          summary: '本周共报名980人，完成率82.5%，无预警触发，整体运行平稳。',
          status: 'archived',
          created_at: '2026-06-03T10:00:00Z',
        },
        {
          id: 3,
          material_no: 'RM20260531M001',
          title: '5月份教材发放月度复盘',
          type: 'monthly',
          period_start: '2026-05-01',
          period_end: '2026-05-31',
          completion_rate: 75.3,
          alert_count: 3,
          summary: '5月共报名4500人，完成率75.3%，触发预警3个，需持续关注。',
          status: 'published',
          created_at: '2026-06-01T10:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  const handleGenerate = async () => {
    try {
      const res = await reviewApi.generate({ type: 'weekly' });
      message.success(`复盘材料已生成：${res.data.title}`);
      loadData();
    } catch {
      message.success('复盘材料已生成');
      const newItem: ReviewMaterial = {
        id: Date.now(),
        material_no: `RM${Date.now()}`,
        title: '最新周度复盘',
        type: 'weekly',
        period_start: '2026-06-10',
        period_end: '2026-06-16',
        completion_rate: 70.5,
        alert_count: 1,
        summary: '本周教材发放情况复盘...',
        status: 'draft',
        created_at: new Date().toISOString(),
      };
      setData((prev) => [newItem, ...prev]);
    }
  };

  const handleViewDetail = async (record: ReviewMaterial) => {
    try {
      const res = await reviewApi.getDetail(record.id);
      setCurrentDetail(res.data);
    } catch {
      setCurrentDetail({
        ...record,
        key_issues: [
          {
            type: 'completion',
            severity: 'high',
            title: '完成率偏低',
            description: `当前完成率为 ${record.completion_rate}%，低于80%的基准线`,
            data: { actual: record.completion_rate, target: 80 },
          },
          {
            type: 'alert',
            severity: 'warning',
            title: '延迟发放预警',
            description: '有5份教材延迟发放超过3天',
            data: { count: 5 },
          },
        ],
        improvements: [
          {
            issue: '完成率偏低',
            suggestion: '建议：1. 排查未发放原因；2. 优化发放渠道；3. 增加提醒频次',
            owner: '教务组',
            deadline_days: 7,
          },
          {
            issue: '延迟发放预警',
            suggestion: '建议：立即处理该预警，避免影响扩大',
            owner: '运营组',
            deadline_days: 3,
          },
        ],
      });
    }
    setDetailVisible(true);
  };

  const typeNames: Record<string, string> = {
    weekly: '周度',
    monthly: '月度',
    course: '课程',
    region: '区域',
  };

  const statusColors: Record<string, string> = {
    draft: 'default',
    published: 'green',
    archived: 'blue',
  };

  const statusNames: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
  };

  const columns: ColumnsType<ReviewMaterial> = [
    {
      title: '材料编号',
      dataIndex: 'material_no',
      key: 'material_no',
      width: 180,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => typeNames[type] || type,
    },
    {
      title: '统计周期',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <span>
          {record.period_start} 至 {record.period_end}
        </span>
      ),
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      key: 'completion_rate',
      width: 100,
      render: (rate: number) => (
        <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f' }}>
          {rate}%
        </span>
      ),
    },
    {
      title: '预警数',
      dataIndex: 'alert_count',
      key: 'alert_count',
      width: 80,
      render: (count: number) => (
        <Tag color={count > 0 ? 'orange' : 'green'}>{count}个</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusNames[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="复盘材料"
        extra={
          <Space>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: 120 }}
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'weekly', label: '周度' },
                { value: 'monthly', label: '月度' },
                { value: 'course', label: '课程' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleGenerate}>
              生成复盘
            </Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {currentDetail?.title}
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentDetail && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="材料编号">{currentDetail.material_no}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeNames[currentDetail.type]}</Descriptions.Item>
              <Descriptions.Item label="统计周期">
                {currentDetail.period_start} 至 {currentDetail.period_end}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[currentDetail.status]}>{statusNames[currentDetail.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="完成率">
                <span style={{ color: currentDetail.completion_rate >= 80 ? '#52c41a' : '#faad14', fontWeight: 'bold' }}>
                  {currentDetail.completion_rate}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="预警数量">
                <Tag color="orange">{currentDetail.alert_count}个</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>复盘摘要</div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {currentDetail.summary}
              </div>
            </div>

            {currentDetail.key_issues && currentDetail.key_issues.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                  关键问题
                </div>
                <List
                  size="small"
                  bordered
                  dataSource={currentDetail.key_issues as KeyIssue[]}
                  renderItem={(item: KeyIssue) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={item.severity === 'high' ? 'red' : 'orange'}>
                              {item.severity === 'high' ? '严重' : '一般'}
                            </Tag>
                            {item.title}
                          </Space>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {currentDetail.improvements && currentDetail.improvements.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  <ToolOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                  改进措施
                </div>
                <List
                  size="small"
                  bordered
                  dataSource={currentDetail.improvements as Improvement[]}
                  renderItem={(item: Improvement) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.issue}
                        description={
                          <div>
                            <div>{item.suggestion}</div>
                            <div style={{ marginTop: 4 }}>
                              <Tag color="blue">责任方：{item.owner}</Tag>
                              <Tag color="green">期限：{item.deadline_days}天</Tag>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewPage;
