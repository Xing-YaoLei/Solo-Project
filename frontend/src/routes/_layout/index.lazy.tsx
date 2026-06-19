import { createLazyFileRoute } from '@tanstack/react-router';
import { Card, Col, Row, Statistic, Space, Typography, List, Tag } from 'antd';
import {
  EnvironmentOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ShopOutlined,
  WarningOutlined,
  UserOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { STATUS_COLORS, STATUS_LABELS, RecordStatusEnum } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const Route = createLazyFileRoute('/_layout/')({
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState<any>({
    routes: 0, heat_points: 0, contents: 0, performances: 0,
    seats: 0, merchants: 0, contracts: 0, exceptions: 0,
    today_tickets: 0, today_revenue: 0,
    pending_verify: { heat: 0, content: 0, seats: 0, contracts: 0 },
    recent_changes: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [routes, hp, contents, perfs, merchants, contracts, exps, tickets, audits] = await Promise.all([
        api.get('/guide/routes', { page_size: 1 }),
        api.get('/guide/heat-points', { page_size: 1 }),
        api.get('/guide/contents', { page_size: 1 }),
        api.get('/operations/performances', { page_size: 1 }),
        api.get('/operations/merchants', { page_size: 1 }),
        api.get('/operations/contracts', { page_size: 1 }),
        api.get('/operations/exceptions', { status: 'pending', page_size: 1 }),
        api.get('/tickets', { page_size: 1 }),
        api.get('/audit-logs', { page_size: 8 }),
      ]);
      setStats({
        routes: routes.data.total || 0,
        heat_points: hp.data.total || 0,
        contents: contents.data.total || 0,
        performances: perfs.data.total || 0,
        merchants: merchants.data.total || 0,
        contracts: contracts.data.total || 0,
        exceptions: exps.data.total || 0,
        today_tickets: tickets.data.total || 0,
        today_revenue: (tickets.data.items || []).reduce((s: number, t: any) => s + (t.price || 0), 0),
        pending_verify: {
          heat: (hp.data.items || []).filter((x: any) => x.status === 'pending').length,
          content: (contents.data.items || []).filter((x: any) => x.status === 'pending').length,
          seats: 0,
          contracts: (contracts.data.items || []).filter((x: any) => x.status === 'pending').length,
        },
        recent_changes: audits.data.items || [],
      });
    } catch (e) {
      /* ignore */
    }
  };

  const verifyCards = [
    { label: '点位待复核', value: stats.pending_verify.heat, color: '#fa8c16', icon: <EnvironmentOutlined />, to: '/guide/heat-points' },
    { label: '内容待复核', value: stats.pending_verify.content, color: '#eb2f96', icon: <PlayCircleOutlined />, to: '/guide/contents' },
    { label: '合同待复核', value: stats.pending_verify.contracts, color: '#52c41a', icon: <FileTextOutlined />, to: '/operations/merchants' },
    { label: '待处理异常', value: stats.exceptions, color: '#ff4d4f', icon: <WarningOutlined />, to: '/operations/exceptions' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">今日概览 · 待办核对 · 最近动态</Text>
      </div>

      <Row gutter={[16, 16]}>
        {[
          { title: '导览路线', value: stats.routes, icon: <EnvironmentOutlined />, color: '#1677ff' },
          { title: '热力点位', value: stats.heat_points, icon: <UserOutlined />, color: '#722ed1' },
          { title: '导览内容', value: stats.contents, icon: <PlayCircleOutlined />, color: '#eb2f96' },
          { title: '演出项目', value: stats.performances, icon: <UserOutlined />, color: '#13c2c2' },
          { title: '商户数', value: stats.merchants, icon: <ShopOutlined />, color: '#52c41a' },
          { title: '生效合同', value: stats.contracts, icon: <FileTextOutlined />, color: '#fa8c16' },
          { title: '票据总量', value: stats.today_tickets, icon: <FileTextOutlined />, color: '#1677ff' },
          { title: '票务营收', value: `¥${stats.today_revenue.toFixed(0)}`, icon: <MoneyCollectOutlined />, color: '#52c41a' },
        ].map((c, i) => (
          <Col xs={12} sm={8} md={6} xl={3} key={i}>
            <Card hoverable>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>{c.title}</span>}
                value={c.value}
                prefix={<span style={{ color: c.color }}>{c.icon}</span>}
                valueStyle={{ color: c.color, fontSize: 22, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="🔍 待办复核" styles={{ body: { padding: 0 } }}>
            <List
              itemLayout="horizontal"
              dataSource={verifyCards}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
                  onClick={() => window.location.href = item.to}
                >
                  <List.Item.Meta
                    avatar={<div style={{ fontSize: 28, color: item.color }}>{item.icon}</div>}
                    title={<span style={{ color: '#333' }}>{item.label}</span>}
                  />
                  <Tag color={item.color} style={{ fontSize: 16, padding: '4px 12px', borderRadius: 16 }}>
                    {item.value} 项
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="📜 最近操作痕迹" styles={{ body: { padding: 0 } }}>
            <List
              itemLayout="horizontal"
              dataSource={stats.recent_changes}
              locale={{ emptyText: '暂无记录' }}
              renderItem={(log: any) => (
                <List.Item style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: '#e6f4ff', color: '#1677ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: 12,
                    }}>
                      {log.action?.slice(0, 2).toUpperCase()}
                    </div>}
                    title={
                      <Space size={8}>
                        <Text strong>{log.record_type || '系统'}</Text>
                        <Tag color={STATUS_COLORS[log.action === 'create' ? 'approved' : 'pending'] as any} style={{ margin: 0 }}>
                          {log.action}
                        </Tag>
                        {log.field_name && <Text type="secondary" style={{ fontSize: 12 }}>字段: {log.field_name}</Text>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {log.remarks || (log.old_value && log.new_value ? `${log.old_value.slice(0, 20)} → ${log.new_value.slice(0, 20)}` : '')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(log.created_at).format('MM-DD HH:mm')} · 用户#{log.user_id || 'sys'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
