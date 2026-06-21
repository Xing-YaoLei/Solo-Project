import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { CalendarOutlined, UnorderedListOutlined, WarningOutlined, BellOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { UserRoleLabel, UserRole } from '../types';
import { canManageConflicts, canViewStatistics, canManageCapacity } from '../utils/permissions';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const menuItems = [
    { key: '/calendar', icon: <CalendarOutlined />, label: '开庭日历' },
    { key: '/hearings', icon: <UnorderedListOutlined />, label: '排程列表' },
    ...(canManageConflicts(user!.role) ? [{ key: '/conflicts', icon: <WarningOutlined />, label: '利益冲突' }] : []),
    { key: '/reminders', icon: <BellOutlined />, label: '提醒管理' },
    ...(canViewStatistics(user!.role) ? [{ key: '/statistics', icon: <BarChartOutlined />, label: '统计分析' }] : []),
    ...(canManageCapacity(user!.role) ? [{ key: '/capacity', icon: <SettingOutlined />, label: '容量规则' }] : []),
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: `${user!.fullName} (${UserRoleLabel[user!.role]})`, disabled: true },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${themeToken.colorBorderSecondary}` }}>
          <h2 style={{ margin: 0, fontSize: collapsed ? 14 : 16, whiteSpace: 'nowrap' }}>{collapsed ? '开庭' : '开庭日历排程台'}</h2>
        </div>
        <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} style={{ borderRight: 0 }} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: themeToken.colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: `1px solid ${themeToken.colorBorderSecondary}` }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: themeToken.colorBgContainer, borderRadius: themeToken.borderRadiusLG, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
