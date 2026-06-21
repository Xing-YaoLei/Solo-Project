import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import {
  DashboardOutlined,
  FileSearchOutlined,
  TeamOutlined,
  HomeOutlined,
  FormOutlined,
  DesktopOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { TabBar } from 'antd-mobile';
import {
  AppOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons';
import { useAppStore } from '@/store';

const { Sider, Header, Content } = Layout;

const DashboardPage = () => (
  <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
    <DashboardOutlined style={{ fontSize: 48, marginBottom: 16 }} />
    <h2>数据看板</h2>
    <p>开发中...</p>
  </div>
);

const RecordsPage = () => (
  <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
    <FileSearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
    <h2>核验记录</h2>
    <p>开发中...</p>
  </div>
);

const RidersPage = () => (
  <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
    <TeamOutlined style={{ fontSize: 48, marginBottom: 16 }} />
    <h2>骑手分析</h2>
    <p>开发中...</p>
  </div>
);

const MobileActionsPage = () => (
  <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
    <FormOutlined style={{ fontSize: 48, marginBottom: 16 }} />
    <h2>待办事项</h2>
    <p>开发中...</p>
  </div>
);

const desktopMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/records', icon: <FileSearchOutlined />, label: '核验记录' },
  { key: '/riders', icon: <TeamOutlined />, label: '骑手分析' },
];

function DesktopLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setIsMobile } = useAppStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          核验排程台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={desktopMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <span className="logo">跑腿物品核验排程台</span>
          <div className="header-actions">
            <Button
              type="text"
              icon={<MobileOutlined />}
              style={{ color: '#fff' }}
              onClick={() => setIsMobile(true)}
            >
              移动端视图
            </Button>
          </div>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/riders" element={<RidersPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsMobile } = useAppStore();

  const activeKey = location.pathname === '/actions' ? '/actions' : '/';

  return (
    <div className="mobile-view">
      <div className="mobile-header">跑腿物品核验排程台</div>
      <div className="mobile-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/actions" element={<MobileActionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <div className="mobile-tab-bar">
        <TabBar
          activeKey={activeKey}
          onChange={(key) => navigate(key)}
          items={[
            { key: '/', icon: <AppOutline />, title: '首页' },
            { key: '/actions', icon: <UnorderedListOutline />, title: '待办' },
          ]}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { isMobile, setIsMobile } = useAppStore();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
