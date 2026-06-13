import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
  DownloadOutlined,
  WarningOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuthStore();

  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const menuItems = [
    { key: '/records', icon: <FileTextOutlined />, label: '饮食记录' },
    { key: '/monthly-review', icon: <BarChartOutlined />, label: '月底复盘' },
    { key: '/export', icon: <DownloadOutlined />, label: '数据导出' },
    { key: '/interruptions', icon: <WarningOutlined />, label: '打卡中断' }
  ];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/login');
        }
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 600 }}>
          💪 健身饮食打卡
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
        <Header className="app-header">
          <div className="app-logo">健身私教饮食打卡排程台</div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatarUrl} />
              <span>{user?.userName}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
