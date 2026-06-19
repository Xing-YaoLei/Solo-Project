import { createFileRoute, Outlet, useNavigate, Link } from '@tanstack/react-router';
import { Layout, Menu, Dropdown, Avatar, Badge, Space, Button } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  PlayCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  ShopOutlined,
  WarningOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  DownOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { ROLE_LABELS, RoleEnum } from '../types';

const { Header, Sider, Content } = Layout;

export const Route = createFileRoute('/_layout')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user, token } = useAuth.getState();
    if (!token || !isAuthenticated) {
      throw new Error('登录状态已失效，请重新登录');
    }
    return { user };
  },
  errorComponent: ({ error, reset }) => {
    const navigate = useNavigate();
    useEffect(() => {
      useAuth.getState().logout();
      navigate({ to: '/login' });
    }, []);
    return <div style={{ padding: 40, textAlign: 'center' }}>
      <p>{error?.message || '需要登录'}</p>
    </div>;
  },
  component: AppLayout,
});

const MENU_ITEMS: any[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: <Link to="/">工作台</Link>,
    roles: ['tourist', 'ticket_clerk', 'patrol', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/guide/routes',
    icon: <EnvironmentOutlined />,
    label: <Link to="/guide/routes">导览路线</Link>,
    roles: ['tourist', 'ticket_clerk', 'patrol', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/guide/heat-points',
    icon: <HomeOutlined />,
    label: <Link to="/guide/heat-points">热力点位</Link>,
    roles: ['patrol', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/guide/contents',
    icon: <PlayCircleOutlined />,
    label: <Link to="/guide/contents">导览内容</Link>,
    roles: ['ticket_clerk', 'patrol', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/operations/performances',
    icon: <UserOutlined />,
    label: <Link to="/operations/performances">演出管理</Link>,
    roles: ['ticket_clerk', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/operations/seats',
    icon: <FileTextOutlined />,
    label: <Link to="/operations/seats">座位核对</Link>,
    roles: ['ticket_clerk', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/operations/merchants',
    icon: <ShopOutlined />,
    label: <Link to="/operations/merchants">商户与合同</Link>,
    roles: ['operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/operations/exceptions',
    icon: <WarningOutlined />,
    label: <Link to="/operations/exceptions">
      <Space>异常记录
        <Badge count={0} showZero={false} size="small" />
      </Space>
    </Link>,
    roles: ['patrol', 'ticket_clerk', 'operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: <Link to="/statistics">统计分析</Link>,
    roles: ['operation', 'admin'] as RoleEnum[],
  },
  {
    key: '/audit-logs',
    icon: <HistoryOutlined />,
    label: <Link to="/audit-logs">处理痕迹</Link>,
    roles: ['operation', 'admin'] as RoleEnum[],
  },
];

function AppLayout() {
  const { user, logout, hasRole, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user && useAuth.getState().token) {
      fetchMe();
    }
  }, [user, fetchMe]);

  const visibleMenu = MENU_ITEMS.filter((item) => hasRole(...item.roles));

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.full_name} (${ROLE_LABELS[user?.role || 'tourist']})`,
        disabled: true,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout();
        navigate({ to: '/login' });
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={230}
      >
        <div
          style={{
            height: 64,
            margin: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 16,
            color: '#fff',
            fontSize: collapsed ? 22 : 18,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
          }}
        >
          🎡 {!collapsed && '导览跟进台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          selectedKeys={[window.location.pathname]}
          items={visibleMenu}
          style={{ border: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: '#1f1f1f' }}>
            景区运营导览路线跟进台
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" style={{ padding: '0 8px' }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.full_name || '用户'}</span>
                <span style={{ color: '#8c8c8c' }}>
                  ({ROLE_LABELS[user?.role || 'tourist']})
                </span>
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
