import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Timeline, Descriptions, Modal, message, Alert } from 'antd';
import { HistoryOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { repairAPI } from '../../services/api';
import { CaliberVersion as CaliberVersionType } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';

const CaliberVersionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<CaliberVersionType[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CaliberVersionType | null>(null);

  const mockVersions: CaliberVersionType[] = [
    {
      id: 1,
      version: 'v2.0',
      description: '派单起算，排除待确认状态',
      effective_date: '2024-06-01',
      created_at: '2024-05-28 10:00:00',
      is_active: true,
      calculation_rule: '从派单时间开始计算，排除待确认状态',
      exclude_holidays: true,
      exclude_weekends: true,
      start_event: 'dispatch',
      end_event: 'complete',
      created_by: 1,
    },
    {
      id: 2,
      version: 'v1.1',
      description: '排除周末和节假日',
      effective_date: '2024-03-15',
      created_at: '2024-03-10 14:30:00',
      is_active: false,
      calculation_rule: '自然日计算，排除周末和法定节假日',
      exclude_holidays: true,
      exclude_weekends: true,
      start_event: 'report',
      end_event: 'complete',
      created_by: 1,
      end_date: '2024-05-31',
    },
    {
      id: 3,
      version: 'v1.0',
      description: '初始版本，自然日计算',
      effective_date: '2024-01-01',
      created_at: '2023-12-20 09:00:00',
      is_active: false,
      calculation_rule: '从报单到完成的自然日计算',
      exclude_holidays: false,
      exclude_weekends: false,
      start_event: 'report',
      end_event: 'complete',
      created_by: 1,
      end_date: '2024-03-14',
    },
  ];

  const changesMap: Record<number, string[]> = {
    1: [
      '计算起点从报单改为派单',
      '排除待确认状态不计入时长',
      '保留排除周末和节假日规则',
    ],
    2: [
      '新增排除周末和法定节假日',
      '修复重复工单统计bug',
      '增加工单去重逻辑',
    ],
    3: [
      '初始版本上线',
      '支持维修时长基础统计',
    ],
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await repairAPI.getCaliberVersions().catch(() => mockVersions);
        setVersions(data as CaliberVersionType[]);
      } catch (error) {
        console.error('Failed to fetch caliber versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewDetail = (version: CaliberVersionType) => {
    setSelectedVersion(version);
    setDetailModalOpen(true);
  };

  const handleCompare = (version: CaliberVersionType) => {
    message.info(`正在加载与 ${version.version} 的对比数据...`);
  };

  const getVersionName = (version: CaliberVersionType) => {
    return `维修时长统计口径 ${version.version}`;
  };

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (value: string, record: CaliberVersionType) => (
        <Space>
          <Tag color="blue">{value}</Tag>
          {record.is_active && <Tag color="green">当前生效</Tag>}
        </Space>
      ),
    },
    {
      title: '版本名称',
      key: 'name',
      width: 220,
      render: (_: unknown, record: CaliberVersionType) => getVersionName(record),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: CaliberVersionType) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {!record.is_active && (
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleCompare(record)}
            >
              对比
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="口径版本管理"
        bordered={false}
        extra={
          <Space>
            <InfoCircleOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#666' }}>
              口径版本用于理解数字变化的原因，切换不同版本可查看历史统计方式
            </span>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={`版本详情 - ${selectedVersion?.version}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedVersion && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="版本号">{selectedVersion.version}</Descriptions.Item>
              <Descriptions.Item label="版本名称">{getVersionName(selectedVersion)}</Descriptions.Item>
              <Descriptions.Item label="生效日期">{formatDate(selectedVersion.effective_date)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selectedVersion.created_at)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedVersion.is_active ? (
                  <Tag color="green">当前生效</Tag>
                ) : (
                  <Tag color="default">历史版本</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="失效日期">
                {selectedVersion.end_date ? formatDate(selectedVersion.end_date) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="计算规则" span={2}>
                {selectedVersion.calculation_rule || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="排除周末">
                {selectedVersion.exclude_weekends ? '是' : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="排除节假日">
                {selectedVersion.exclude_holidays ? '是' : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedVersion.description}
              </Descriptions.Item>
            </Descriptions>

            <Card title="变更内容" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={(changesMap[selectedVersion.id] || []).map((change: string, index: number) => ({
                  color: index === 0 ? 'green' : 'blue',
                  children: change,
                }))}
              />
            </Card>

            <Card title="影响指标" size="small" style={{ marginTop: 16 }}>
              <Space wrap>
                <Tag color="orange">平均维修时长</Tag>
                <Tag color="blue">本月验房数</Tag>
                <Tag color="green">收款总额</Tag>
                <Tag color="red">投诉数量</Tag>
              </Space>
            </Card>

            <Alert
              message="使用说明"
              description={`在维修时长页面选择此版本，可按照 ${selectedVersion.version} 的统计口径查看历史数据。`}
              type="info"
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default CaliberVersionPage;
