import React from 'react';
import { Layout, Typography, Space, Tag, Row, Col } from 'antd';
import {
  DashboardOutlined,
  CoffeeOutlined,
  ToolOutlined,
  ShopOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import CleaningFunnelChart from './components/CleaningFunnelChart';
import EquipmentStatusChart from './components/EquipmentStatusChart';
import StoreListTable from './components/StoreListTable';
import ThresholdPanel from './components/ThresholdPanel';
import ReviewMaterialPanel from './components/ReviewMaterialPanel';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据复盘', active: true },
    { key: 'equipment', icon: <ToolOutlined />, label: '设备管理' },
    { key: 'store', icon: <ShopOutlined />, label: '点位管理' },
    { key: 'threshold', icon: <SettingOutlined />, label: '阈值配置' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <Space>
          <CoffeeOutlined style={{ color: '#fff', fontSize: 24 }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            连锁咖啡设备清洁漏斗报表
          </Title>
        </Space>
        <Space style={{ marginLeft: 'auto' }}>
          <Tag color="green">系统运行中</Tag>
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>管理员</span>
        </Space>
      </Header>

      <Layout>
        <Sider
          width={200}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
        >
          <div style={{ padding: '16px 0' }}>
            {menuItems.map((item) => (
              <div
                key={item.key}
                style={{
                  padding: '12px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: item.active ? '#1890ff' : 'rgba(0,0,0,0.65)',
                  background: item.active ? '#e6f7ff' : 'transparent',
                  borderRight: item.active ? '3px solid #1890ff' : '3px solid transparent',
                  fontWeight: item.active ? 500 : 400,
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Sider>

        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              设备清洁复盘总览
            </Title>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              基于会员小票、POS流水和库存数据，多维度呈现设备清洁执行情况
            </p>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <CleaningFunnelChart />
            </Col>
            <Col xs={24} lg={10}>
              <EquipmentStatusChart />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <StoreListTable />
            </Col>
            <Col xs={24} lg={8}>
              <ThresholdPanel />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <ReviewMaterialPanel />
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
