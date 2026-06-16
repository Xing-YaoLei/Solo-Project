import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Table } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { statisticsApi } from '../services/api';
import type { DashboardDto, StatusOverview } from '../types';
import { SettlementStatusMap } from '../types';

const Dashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await statisticsApi.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setDashboard(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): DashboardDto => ({
    totalBills: 156,
    pendingBills: 42,
    completedBills: 98,
    exceptionBills: 16,
    totalAmount: 1258600.5,
    insuranceAmount: 896500.0,
    statusOverview: [
      { statusId: 1, statusName: '待录入', count: 12, amount: 85000 },
      { statusId: 2, statusName: '待审核', count: 18, amount: 156000 },
      { statusId: 5, statusName: '处理中', count: 12, amount: 98000 },
      { statusId: 6, statusName: '待复盘', count: 8, amount: 72000 },
      { statusId: 7, statusName: '已完成', count: 65, amount: 520000 },
      { statusId: 9, statusName: '医保拒付', count: 9, amount: 89000 },
      { statusId: 10, statusName: '补充材料中', count: 5, amount: 45000 },
      { statusId: 11, statusName: '升级处理', count: 2, amount: 18000 },
    ],
    sourceChannelStats: [
      { sourceChannelId: 1, sourceChannelName: '门诊转诊', billCount: 58, totalAmount: 486000, insuranceAmount: 320000, rate: 37.2 },
      { sourceChannelId: 2, sourceChannelName: '住院转诊', billCount: 42, totalAmount: 420000, insuranceAmount: 290000, rate: 26.9 },
      { sourceChannelId: 3, sourceChannelName: '社区推荐', billCount: 28, totalAmount: 196000, insuranceAmount: 140000, rate: 17.9 },
      { sourceChannelId: 4, sourceChannelName: '线上预约', billCount: 18, totalAmount: 108000, insuranceAmount: 78000, rate: 11.5 },
      { sourceChannelId: 5, sourceChannelName: '其他', billCount: 10, totalAmount: 48600, insuranceAmount: 35000, rate: 6.4 },
    ],
    trainingCompletionRate: {
      totalScheduled: 420,
      completed: 378,
      cancelled: 18,
      noShow: 24,
      completionRate: 90.0,
    },
  });

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="单据总数"
              value={dashboard?.totalBills || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理"
              value={dashboard?.pendingBills || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="已完成"
              value={dashboard?.completedBills || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="异常单据"
              value={dashboard?.exceptionBills || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="训练完成率" loading={loading}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={Math.round(dashboard?.trainingCompletionRate.completionRate || 0)}
                width={180}
                status="active"
              />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-around' }}>
                <div>
                  <div style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>
                    {dashboard?.trainingCompletionRate.completed || 0}
                  </div>
                  <div style={{ color: '#999' }}>已完成</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, color: '#1890ff', fontWeight: 'bold' }}>
                    {dashboard?.trainingCompletionRate.totalScheduled || 0}
                  </div>
                  <div style={{ color: '#999' }}>总预约</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, color: '#faad14', fontWeight: 'bold' }}>
                    {dashboard?.trainingCompletionRate.cancelled || 0}
                  </div>
                  <div style={{ color: '#999' }}>已取消</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, color: '#f5222d', fontWeight: 'bold' }}>
                    {dashboard?.trainingCompletionRate.noShow || 0}
                  </div>
                  <div style={{ color: '#999' }}>未到</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="来源渠道分布" loading={loading}>
            <List
              dataSource={dashboard?.sourceChannelStats || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<RiseOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <span>
                        {item.sourceChannelName}
                        <Tag style={{ marginLeft: 8 }} color="blue">
                          {item.billCount} 单
                        </Tag>
                      </span>
                    }
                    description={
                      <div>
                      <div>总金额：¥{item.totalAmount.toLocaleString()}</div>
                      <div style={{ marginTop: 4 }}>
                        <Progress percent={item.rate.toFixed(1)} style={{ width: '100%' }} />
                      </div>
                    </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="各状态单据分布" style={{ marginTop: 16 }} loading={loading}>
        <Row gutter={[16, 16]}>
          {dashboard?.statusOverview.map((item: StatusOverview) => (
            <Col span={6} key={item.statusId}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  background: '#f5f5f5',
                  textAlign: 'center',
                }}
              >
                <Tag color={SettlementStatusMap[item.statusId]?.color || 'default'}>
                  {item.statusName}
                </Tag>
                <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>
                  {item.count}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  ¥{item.amount.toLocaleString()}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
