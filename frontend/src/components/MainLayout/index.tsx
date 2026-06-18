import { Layout, Menu, theme } from 'antd';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  WarningOutlined,
  BarChartOutlined,
  FileAddOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '排程台',
  },
  {
    key: '/parts-shortage',
    icon: <WarningOutlined />,
    label: '配件缺货管理',
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '统计汇总',
  },
  {
    key: '/appointment/new',
    icon: <FileAddOutlined />,
    label: '预约录入',
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 12 : 16,
          fontWeight: 'bold',
          background: '#001529',
        }}>
          {collapsed ? '维修' : '汽车维修排程台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '汽车维修预约进厂排程台'}
          </h2>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 16,
            background: '#f0f2f5',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
