import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  MedicineBoxOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  AlertOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: '管理配置',
    children: [
      { key: '/admin/medication-dict', icon: <MedicineBoxOutlined />, label: '用药清单字典' },
      { key: '/admin/visit-rules', icon: <TeamOutlined />, label: '探访记录规则' },
      { key: '/admin/activity-thresholds', icon: <SafetyCertificateOutlined />, label: '活动签到阈值' },
    ],
  },
  {
    key: 'business',
    icon: <UserOutlined />,
    label: '业务管理',
    children: [
      { key: '/business/elderly', icon: <UserOutlined />, label: '老人档案' },
      { key: '/business/risk-events', icon: <AlertOutlined />, label: '风险事件' },
      { key: '/business/medication-schedules', icon: <ScheduleOutlined />, label: '用药排程' },
    ],
  },
  {
    key: '/query/combined',
    icon: <SearchOutlined />,
    label: '综合查询',
  },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const selectedKeys = [location.pathname];

  const defaultOpenKeys = ['admin', 'business'];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#001529',
        }}
      >
        <div
          style={{
            height: 48,
            margin: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MedicineBoxOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          {!collapsed && (
            <Text strong style={{ color: '#fff', marginLeft: 8, fontSize: 14, whiteSpace: 'nowrap' }}>
              养老护理系统
            </Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={defaultOpenKeys}
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
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            justifyContent: 'space-between',
          }}
        >
          <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
            养老护理用药提醒排程台
          </Text>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#fff',
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
