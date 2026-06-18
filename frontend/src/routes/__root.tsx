import { useState } from 'react';
import { Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { ConfigProvider, Layout, Menu, Avatar, Dropdown, Typography, theme } from 'antd';
import {
  OrderedListOutlined,
  DollarOutlined,
  AuditOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import type { UserRole, User } from '../lib/types';
import { getStoredUser, logout, roleLabels } from '../lib/auth';
import { canAccess } from '../lib/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

const allMenuItems: MenuItem[] = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/work-orders', icon: <OrderedListOutlined />, label: '工单管理' },
  { key: '/quotes', icon: <DollarOutlined />, label: '报价单' },
  { key: '/inspections', icon: <AuditOutlined />, label: '质检记录' },
  { key: '/parts', icon: <ToolOutlined />, label: '配件库存' },
  { key: '/shortages', icon: <ExclamationCircleOutlined />, label: '缺件处理' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '统计分析' },
];

function getMenuItemsForRole(user: User | null): MenuItem[] {
  if (!user) return [];
  return allMenuItems.filter((item) => canAccess(user, item.key));
}

function getDefaultOpenKeys(pathname: string): string[] {
  if (pathname.startsWith('/work-orders')) return ['/work-orders'];
  if (pathname.startsWith('/quotes')) return ['/quotes'];
  if (pathname.startsWith('/inspections')) return ['/inspections'];
  if (pathname.startsWith('/parts')) return ['/parts'];
  if (pathname.startsWith('/shortages')) return ['/shortages'];
  if (pathname.startsWith('/statistics')) return ['/statistics'];
  return [];
}

export default function RootLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const user = getStoredUser();

  const menuItems = getMenuItemsForRole(user);

  const selectedKey = pathname === '/' ? '/' : `/${pathname.split('/').filter(Boolean)[0]}`;

  const handleMenuClick = (info: { key: string }) => {
    navigate({ to: info.key });
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const dropdownItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.display_name || ''} (${user ? roleLabels[user.role] : ''})`,
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { colorPrimary: '#1890ff' },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          style={{ borderRight: '1px solid #f0f0f0' }}
        >
          <div
            style={{
              height: 48,
              margin: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: collapsed ? 14 : 18,
              color: '#1890ff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {collapsed ? 'M&P' : '维修管理系统'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={getDefaultOpenKeys(pathname)}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              borderBottom: '1px solid #f0f0f0',
              height: 48,
              lineHeight: '48px',
            }}
          >
            <Dropdown menu={dropdownItems} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{user?.display_name}</Text>
              </div>
            </Dropdown>
          </Header>
          <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
