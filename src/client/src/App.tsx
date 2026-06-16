import React from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import ElderManagement from './pages/ElderManagement';
import ScheduleManagement from './pages/ScheduleManagement';
import ScheduleDetail from './pages/ScheduleDetail';
import ExceptionManagement from './pages/ExceptionManagement';
import ExceptionDetail from './pages/ExceptionDetail';
import StatisticsAnalysis from './pages/StatisticsAnalysis';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const location = useLocation();

  const selectedKey = (() => {
    if (location.pathname.startsWith('/schedules/')) return '/schedules';
    if (location.pathname.startsWith('/exceptions/')) return '/exceptions';
    return location.pathname === '/' ? '/dashboard' : location.pathname;
  })();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">首页仪表盘</Link>,
    },
    {
      key: '/elders',
      icon: <UserOutlined />,
      label: <Link to="/elders">老人管理</Link>,
    },
    {
      key: '/schedules',
      icon: <CalendarOutlined />,
      label: <Link to="/schedules">排班管理</Link>,
    },
    {
      key: '/exceptions',
      icon: <WarningOutlined />,
      label: <Link to="/exceptions">异常管理</Link>,
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">统计分析</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🏥</span>
          养老护理床位排班排程台
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </div>
      </Header>
      <Layout>
        <Sider
          width={220}
          style={{
            background: colorBgContainer,
            borderRight: '1px solid #f0f0f0',
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={[]}
            style={{ height: '100%', borderRight: 0, paddingTop: '8px' }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '16px', background: '#f5f7fa' }}>
          <Content
            style={{
              padding: 0,
              margin: 0,
              minHeight: 'calc(100vh - 120px)',
              background: 'transparent',
              borderRadius: borderRadiusLG,
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/elders" element={<ElderManagement />} />
              <Route path="/schedules" element={<ScheduleManagement />} />
              <Route path="/schedules/:id" element={<ScheduleDetail />} />
              <Route path="/exceptions" element={<ExceptionManagement />} />
              <Route path="/exceptions/:id" element={<ExceptionDetail />} />
              <Route path="/statistics" element={<StatisticsAnalysis />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
