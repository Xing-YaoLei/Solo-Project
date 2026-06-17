import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Switch, theme } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  ToolOutlined,
  UploadOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import RoleGuard from '../components/common/RoleGuard';
import { UserRole } from '../types';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, darkMode, toggleDarkMode } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const { defaultAlgorithm, darkAlgorithm } = theme;

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '总览看板',
      roles: ['admin', 'worker'] as UserRole[],
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
      roles: ['admin', 'worker'] as UserRole[],
    },
    {
      key: '/repair',
      icon: <ToolOutlined />,
      label: '维修时长',
      roles: ['admin', 'worker'] as UserRole[],
    },
    {
      key: '/data-import',
      icon: <UploadOutlined />,
      label: '数据导入',
      roles: ['admin'] as UserRole[],
    },
    {
      key: '/caliber-version',
      icon: <HistoryOutlined />,
      label: '口径版本管理',
      roles: ['admin'] as UserRole[],
    },
  ];

  const filteredMenuItems = menuItems
    .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
    .map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    }));

  const userMenuItems = [
    {
      key: '1',
      label: (
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontWeight: 500 }}>{user?.full_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {user?.role === 'admin' ? '管理员' : '工作人员'}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: async () => {
        await logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={darkMode ? 'dark' : 'light'}
        width={240}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
            fontSize: collapsed ? 18 : 20,
            fontWeight: 600,
            color: darkMode ? '#fff' : '#1677ff',
            borderBottom: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`,
          }}
        >
          {collapsed ? '物' : '物业管理看板'}
        </div>
        <Menu
          theme={darkMode ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 'none',
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: darkMode ? '#1f1f1f' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {darkMode ? <MoonOutlined /> : <SunOutlined />}
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                checkedChildren="暗"
                unCheckedChildren="明"
              />
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = darkMode
                    ? '#333'
                    : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Avatar size={32} icon={<UserOutlined />} src={user?.avatar_url} />
                <span
                  style={{
                    marginLeft: 8,
                    color: darkMode ? '#fff' : '#333',
                  }}
                >
                  {user?.full_name}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: darkMode ? '#141414' : '#f5f5f5',
            borderRadius: 8,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
