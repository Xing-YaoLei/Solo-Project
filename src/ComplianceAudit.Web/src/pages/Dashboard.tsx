import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Tag, Table, List, Avatar, Progress,
  Typography, Button, Badge, Empty
} from 'antd';
import {
  FileDoneOutlined, CheckCircleOutlined, WarningOutlined,
  ClockCircleOutlined, SafetyOutlined, AlertOutlined,
  ScheduleOutlined, RightOutlined, RedEnvelopeOutlined
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardApi, schedulesApi } from '@/services/api';
import type { DashboardStats, ScheduleSummary, RiskLevel as RiskLevelEnum, CheckStatus } from '@/types';

const { Title, Text } = Typography;

const RiskTag = ({ level }: { level: number }) => {
  const map: Record<number, { color: string; text: string; className: string }> = {
    1: { color: 'green', text: '低', className: 'tag-low' },
    2: { color: 'orange', text: '中', className: 'tag-medium' },
    3: { color: 'red', text: '高', className: 'tag-high' },
    4: { color: '#000', text: '严重', className: 'tag-critical' }
  };
  const cfg = map[level] ?? map[1];
  return <Tag className={cfg.className} color={cfg.color}>{cfg.text}风险</Tag>;
};

const StatusTag = ({ status }: { status: number }) => {
  const map: Record<number, { color: string; text: string }> = {
    1: { color: 'default', text: '待处理' },
    2: { color: 'processing', text: '进行中' },
    3: { color: 'warning', text: '待复核' },
    4: { color: 'processing', text: '已复核' },
    5: { color: 'success', text: '已通过' },
    6: { color: 'error', text: '已拒绝' },
    7: { color: 'default', text: '已关闭' }
  };
  const cfg = map[status] ?? map[1];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusSummary, setStatusSummary] = useState<ScheduleSummary[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [pendingSchedules, setPendingSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, statusRes, riskRes, schedRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getScheduleStatusSummary(),
        dashboardApi.getRiskDistribution(),
        schedulesApi.list({ pageNumber: 1, pageSize: 5 })
      ]);
      if (statsRes.success) setStats(statsRes.data!);
      if (statusRes.success) setStatusSummary(statusRes.data ?? []);
      if (riskRes.success) {
        const map: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险', 4: '严重风险' };
        setRiskDist((riskRes.data ?? []).map(r => ({
          type: map[(r as any).riskLevel] ?? '未知',
          value: (r as any).count
        })));
      }
      if (schedRes.success) setPendingSchedules((schedRes.data as any)?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: '全部排程', value: stats.totalSchedules, icon: <ScheduleOutlined />, color: '#1677ff', bg: '#E6F4FF' },
    { label: '我待处理', value: stats.myPendingSchedules, icon: <ClockCircleOutlined />, color: '#722ED1', bg: '#F9F0FF' },
    { label: '我进行中', value: stats.myInProgressSchedules, icon: <RedEnvelopeOutlined />, color: '#13C2C2', bg: '#E6FFFB' },
    { label: '待复核项', value: stats.pendingReviewCount, icon: <CheckCircleOutlined />, color: '#FA8C16', bg: '#FFF7E6' },
    { label: '证据缺失', value: stats.evidenceMissingCount, icon: <WarningOutlined />, color: '#F5222D', bg: '#FFF1F0' },
    { label: '逾期整改', value: stats.overdueRectifications, icon: <AlertOutlined />, color: '#CF1322', bg: '#FFF1F0' },
    { label: '整体合规率', value: `${stats.overallComplianceRate}%`, icon: <SafetyOutlined />, color: '#52C41A', bg: '#F6FFED' },
    { label: '高/严重问题', value: stats.highRiskFindings + stats.criticalRiskFindings, icon: <FileDoneOutlined />, color: '#EB2F96', bg: '#FFF0F6' }
  ] : [];

  const pieConfig = {
    data: riskDist,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    innerRadius: 0.6,
    label: { text: 'value', position: 'outside' },
    legend: { position: 'bottom' }
  };

  const statusMap: Record<number, string> = {
    1: '待处理', 2: '进行中', 3: '待复核', 4: '已复核', 5: '已通过', 6: '已拒绝', 7: '已关闭'
  };
  const barData = statusSummary.map(s => ({
    status: statusMap[s.status] ?? '未知',
    count: s.count
  }));

  const columnConfig = {
    data: barData,
    xField: 'status',
    yField: 'count',
    label: { position: 'top' },
    colorField: 'status',
    legend: false
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>排程台看板</Title>
          <Text type="secondary">今日 {dayjs().format('YYYY年MM月DD日 dddd')} · 欢迎回来</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={() => navigate('/schedules')}>查看全部排程 <RightOutlined /></Button>
          <Button onClick={() => loadData()}>刷新</Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((card, i) => (
          <Col xs={12} sm={8} md={6} key={i}>
            <Card className="stat-card" bordered={false} styles={{ body: { padding: 20 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                </div>
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: card.bg, color: card.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="排程状态分布" bordered={false} styles={{ body: { paddingTop: 8 } }}>
            {barData.length > 0 ? (
              <Column {...columnConfig} height={280} />
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="发现问题风险分布" bordered={false} styles={{ body: { paddingTop: 8 } }}>
            {riskDist.length > 0 ? (
              <Pie {...pieConfig} height={280} />
            ) : <Empty />}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title="最新检查排程"
            bordered={false}
            extra={<Button type="link" onClick={() => navigate('/schedules')}>查看全部</Button>}
          >
            {pendingSchedules.length > 0 ? (
              <List
                dataSource={pendingSchedules}
                renderItem={(item: any) => (
                  <List.Item
                    key={item.id}
                    onClick={() => navigate(`/schedules/${item.id}`)}
                    style={{ cursor: 'pointer', padding: '12px 0' }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: '#1677ff' }} icon={<ScheduleOutlined />} />}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{item.title}</Text>
                          <StatusTag status={item.status} />
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Text type="secondary">编号：{item.scheduleNo}</Text>
                            <Text type="secondary" style={{ marginLeft: 16 }}>制度：{item.regulationName}</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <RiskTag level={item.riskLevel} />
                            <Badge status="processing" text={`审计员：${item.auditorName}`} />
                            <Text type="secondary">截止：{dayjs(item.dueDate).format('YYYY-MM-DD')}</Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="合规完成度" bordered={false}>
            {stats && (
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(stats.overallComplianceRate)}
                    size={180}
                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>整体合规率</Title>
                    <Text type="secondary">基于 {stats.openCheckRecords + stats.totalSchedules} 项检查</Text>
                  </div>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#FFF7E6', border: 'none' }}>
                      <Statistic title="高风险问题" value={stats.highRiskFindings} valueStyle={{ color: '#CF1322' }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#FFF1F0', border: 'none' }}>
                      <Statistic title="严重问题" value={stats.criticalRiskFindings} valueStyle={{ color: '#000' }} />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
