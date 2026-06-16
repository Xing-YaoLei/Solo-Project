import React from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ToolOutlined,
  AlertOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/bills',
      icon: <FileTextOutlined />,
      label: '结算单据',
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: '治疗日历',
    },
    {
      key: '/devices',
      icon: <ToolOutlined />,
      label: '器械管理',
    },
    {
      key: '/exceptions',
      icon: <AlertOutlined />,
      label: '异常处理',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计汇总',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark">
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          康复医保排程台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key as string)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {menuItems.find((item) => item.key === location.pathname)?.label || '康复中心医保结算排程台'}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>管理员</span>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
