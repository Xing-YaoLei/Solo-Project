import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';
import { getRoleText } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/api';

const { Header, Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'pending'],
    queryFn: () => notificationApi.list({ status: 'pending' }),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const pendingCount = notifications.length;

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程管理',
    },
    {
      key: '/records',
      icon: <FileTextOutlined />,
      label: '记录页',
    },
    {
      key: '/review',
      icon: <BarChartOutlined />,
      label: '月底复盘',
    },
    {
      key: '/notifications',
      icon: (
        <Badge count={pendingCount} size="small" offset={[6, -2]}>
          <BellOutlined />
        </Badge>
      ),
      label: '进度通知',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate({ to: key });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.full_name} (${getRoleText(user?.role || '')})`,
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const selectedKey = location.pathname.startsWith('/courses/')
    ? '/courses'
    : `/${location.pathname.split('/')[1]}`;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            color: '#3b82f6',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {collapsed ? 'FT' : '💪 健身跟进系统'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={
                <Badge count={pendingCount} size="small">
                  <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
              }
              onClick={() => navigate({ to: '/notifications' })}
            />
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} src={user?.avatar_url} />
                <span style={{ fontSize: 14 }}>{user?.full_name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
