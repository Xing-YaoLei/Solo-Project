import { Outlet, useNavigate } from '@tanstack/react-router';
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  BarChartOutlined,
  ShopOutlined,
  LogoutOutlined,
  UserOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@/api';
import { useEffect } from 'react';

const { Header, Sider, Content } = Layout;

function App() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authAPI.getCurrentUser().then((res) => res.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser, setUser]);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
      onClick: () => navigate({ to: '/dashboard' }),
    },
    {
      key: '/loss-reports',
      icon: <FileTextOutlined />,
      label: '报损单管理',
      onClick: () => navigate({ to: '/loss-reports' }),
    },
    {
      key: '/reviews',
      icon: <CheckCircleOutlined />,
      label: '复核管理',
      onClick: () => navigate({ to: '/reviews' }),
    },
  ];

  if (user?.role === 'manager') {
    menuItems.push(
      {
        key: '/approvals',
        icon: <AuditOutlined />,
        label: '审批管理',
        onClick: () => navigate({ to: '/approvals' }),
      },
      {
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: '统计分析',
        onClick: () => navigate({ to: '/statistics' }),
      },
      {
        key: '/stores',
        icon: <ShopOutlined />,
        label: '门店管理',
        onClick: () => navigate({ to: '/stores' }),
      }
    );
  }

  const currentPath = window.location.pathname;

  const userMenuItems = [
    {
      key: '1',
      label: (
        <Space>
          <UserOutlined />
          {user?.full_name}
        </Space>
      ),
      disabled: true,
    },
    {
      key: '2',
      label: user?.role === 'manager' ? '管理层' : '一线人员',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: (
        <Space onClick={handleLogout}>
          <LogoutOutlined />
          退出登录
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220} style={{ position: 'fixed', height: '100vh', left: 0 }}>
        <div
          className="flex items-center justify-center h-16 text-white text-xl font-bold"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <CoffeeOutlined className="mr-2" />
          <span>咖啡报损系统</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Header
          className="flex justify-between items-center px-6"
          style={{ background: '#fff', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
        >
          <h2 className="text-lg font-medium text-gray-800">
            {menuItems.find((m) => m.key === currentPath)?.label as string}
          </h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer hover:bg-gray-100 px-3 py-2 rounded">
              <Avatar icon={<UserOutlined />} className="mr-2" />
              <span className="mr-2">{user?.full_name}</span>
              <span className="text-sm text-gray-500">
                ({user?.role === 'manager' ? '管理层' : '一线人员'})
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
