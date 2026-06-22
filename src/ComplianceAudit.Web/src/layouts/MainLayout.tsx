import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Avatar, Dropdown, Button, theme, Breadcrumb, Badge
} from 'antd';
import {
  DashboardOutlined, CalendarOutlined, FileSearchOutlined,
  WarningOutlined, BarChartOutlined, SearchOutlined,
  UserOutlined, LogoutOutlined, BellOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '排程台看板' },
  { key: '/schedules', icon: <CalendarOutlined />, label: '检查排程' },
  { key: '/rectifications', icon: <FileSearchOutlined />, label: '整改计划' },
  { key: '/evidence-missing', icon: <WarningOutlined />, label: '证据缺失处理' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '统计分析' },
  { key: '/document-trace', icon: <SearchOutlined />, label: '单据追溯' }
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const breadcrumbMap: Record<string, string> = {
    '/dashboard': '排程台看板',
    '/schedules': '检查排程',
    '/rectifications': '整改计划',
    '/evidence-missing': '证据缺失处理',
    '/statistics': '统计分析',
    '/document-trace': '单据追溯'
  };

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = [];
    let currentPath = '';
    for (const seg of pathSegments) {
      currentPath += `/${seg}`;
      if (breadcrumbMap[currentPath]) {
        items.push({ title: breadcrumbMap[currentPath] });
      } else if (!isNaN(Number(seg))) {
        items.push({ title: `详情 #${seg}` });
      }
    }
    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.fullName ?? ''} (${user?.roleName ?? ''})`
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => logout()
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 24,
            color: '#fff',
            fontSize: collapsed ? 18 : 16,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.05)'
          }}
        >
          {collapsed ? '合规' : '合规审计排程台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.startsWith('/schedules/') ? '/schedules' : location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ borderRight: 0 }}
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
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <span>»</span> : <span>«</span>}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size={36} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                <span style={{ color: 'rgba(0,0,0,0.85)' }}>{user?.fullName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
