import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore, useDeviceStore } from '@/hooks/useStore';
import {
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  AuditOutlined,
  LogoutOutlined,
  MobileOutlined,
  DesktopOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { isMobile, setIsMobile } = useDeviceStore();

  const menuItems = [
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: '工单管理',
    },
    {
      key: '/review',
      icon: <AuditOutlined />,
      label: '复盘视图',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
    {
      key: '/dispatch-rules',
      icon: <SettingOutlined />,
      label: '派工规则',
    },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate({ to: '/login' });
  };

  const toggleView = () => {
    const newIsMobile = !isMobile;
    setIsMobile(newIsMobile);
    if (newIsMobile) {
      navigate({ to: '/m/orders' });
    } else {
      navigate({ to: '/orders' });
    }
  };

  if (location.pathname.startsWith('/m/')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-gray-800">合规审计</h1>
            <div className="flex items-center gap-3">
              <button onClick={toggleView} className="text-gray-600">
                <DesktopOutlined />
              </button>
              <span className="text-sm text-gray-600">{user?.full_name}</span>
              <button onClick={handleLogout} className="text-red-500">
                <LogoutOutlined />
              </button>
            </div>
          </div>
        </div>
        <div className="pb-6">
          {children || <Outlet />}
        </div>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold">
          合规审计整改系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate({ to: key as any })}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={toggleView} className="text-gray-600 hover:text-blue-500">
              <MobileOutlined /> 切换移动端
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎，{user?.full_name}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-600">
              <LogoutOutlined /> 退出
            </button>
          </div>
        </Header>
        <Content className="p-6">
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
}
