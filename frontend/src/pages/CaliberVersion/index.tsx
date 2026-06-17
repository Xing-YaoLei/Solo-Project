import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, Timeline, Descriptions, Modal, message, Alert } from 'antd';
import { HistoryOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { caliberAPI } from '../../services/api';
import { CaliberVersion } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';

const CaliberVersion: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<CaliberVersion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CaliberVersion | null>(null);

  const mockVersions: CaliberVersion[] = [
    {
      id: '1',
      version: 'v3.2.0',
      name: 'KPI 统计口径 v3.2.0',
      description: '新增投诉标签分类，优化维修时长计算逻辑',
      effectiveDate: '2024-06-01',
      createTime: '2024-05-28 10:00:00',
      creator: 'admin',
      changes: [
        '投诉标签新增噪音、卫生、设施、安全、其他五类',
        '维修时长计算排除周末和法定节假日',
        '夜间维修时长按实际工时折算',
        '新增维修类型分类统计',
        '优化数据聚合性能',
      ],
    },
    {
      id: '2',
      version: 'v3.1.0',
      name: 'KPI 统计口径 v3.1.0',
      description: '支付流水统计口径更新',
      effectiveDate: '2024-04-15',
      createTime: '2024-04-10 14:30:00',
      creator: 'admin',
      changes: [
        '支付流水支持按区域、类型多维度筛选',
        '新增逾期天数统计',
        '优化收款排行算法',
        '支持支付备注功能',
      ],
    },
    {
      id: '3',
      version: 'v3.0.0',
      name: 'KPI 统计口径 v3.0.0',
      description: '重大版本更新，全面重构统计逻辑',
      effectiveDate: '2024-01-01',
      createTime: '2023-12-20 09:00:00',
      creator: 'admin',
      changes: [
        '全面重构 KPI 计算引擎',
        '支持多口径版本切换对比',
        '新增数据校验机制',
        '优化大数据量查询性能',
        '新增数据导入导出功能',
        '完善权限控制体系',
      ],
    },
    {
      id: '4',
      version: 'v2.5.0',
      name: 'KPI 统计口径 v2.5.0',
      description: '水电读数统计优化',
      effectiveDate: '2023-10-01',
      createTime: '2023-09-15 16:00:00',
      creator: 'admin',
      changes: [
        '水电读数支持箱线图展示',
        '新增异常读数自动标记',
        '优化抄表数据导入格式',
        '支持按区域、楼栋统计',
      ],
    },
    {
      id: '5',
      version: 'v2.4.0',
      name: 'KPI 统计口径 v2.4.0',
      description: '验房漏斗统计更新',
      effectiveDate: '2023-07-01',
      createTime: '2023-06-20 11:00:00',
      creator: 'admin',
      changes: [
        '验房漏斗新增待验房、预约中、验房中、验房完成、已入住五级',
        '优化漏斗转化率计算',
        '支持按验房师统计',
      ],
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await caliberAPI.getVersions({ page, pageSize }).catch(() => ({
          list: mockVersions.slice((page - 1) * pageSize, page * pageSize),
          total: mockVersions.length,
        }));
        setVersions(data.list);
        setTotal(data.total);
      } catch (error) {
        console.error('Failed to fetch caliber versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, pageSize]);

  const handleViewDetail = (version: CaliberVersion) => {
    setSelectedVersion(version);
    setDetailModalOpen(true);
  };

  const handleCompare = (version: CaliberVersion) => {
    message.info(`正在加载与 ${version.version} 的对比数据...`);
  };

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (value: string, record: CaliberVersion) => (
        <Space>
          <Tag color="blue">{value}</Tag>
          {record.id === '1' && <Tag color="green">当前生效</Tag>}
        </Space>
      ),
    },
    {
      title: '版本名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: CaliberVersion) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.id !== '1' && (
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
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
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
              <Descriptions.Item label="版本名称">{selectedVersion.name}</Descriptions.Item>
              <Descriptions.Item label="生效日期">{formatDate(selectedVersion.effectiveDate)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selectedVersion.createTime)}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedVersion.creator}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedVersion.id === '1' ? (
                  <Tag color="green">当前生效</Tag>
                ) : (
                  <Tag color="default">历史版本</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedVersion.description}
              </Descriptions.Item>
            </Descriptions>

            <Card title="变更内容" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={selectedVersion.changes.map((change, index) => ({
                  color: index === 0 ? 'green' : 'blue',
                  children: change,
                }))}
              />
            </Card>

            <Card title="影响指标" size="small" style={{ marginTop: 16 }}>
              <Space wrap>
                <Tag color="blue">本月验房数</Tag>
                <Tag color="green">收款总额</Tag>
                <Tag color="orange">平均维修时长</Tag>
                <Tag color="red">投诉数量</Tag>
                <Tag color="purple">水电读数分布</Tag>
                <Tag color="cyan">验房清单漏斗</Tag>
                <Tag color="magenta">收款流水排行</Tag>
                <Tag color="volcano">投诉标签变化</Tag>
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

export default CaliberVersion;
