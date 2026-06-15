import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge } from 'antd';
import {
  BookOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BellOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import RecordsPage from './pages/RecordsPage';
import MonthlyReviewPage from './pages/MonthlyReviewPage';
import AlertsPage from './pages/AlertsPage';
import ExportPage from './pages/ExportPage';
import DashboardPage from './pages/DashboardPage';

const { Header, Sider, Content } = Layout;

function App() {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">工作台</Link>,
    },
    {
      key: '/records',
      icon: <BookOutlined />,
      label: <Link to="/records">学习记录</Link>,
    },
    {
      key: '/review',
      icon: <BarChartOutlined />,
      label: <Link to="/review">月底复盘</Link>,
    },
    {
      key: '/alerts',
      icon: <BellOutlined />,
      label: (
        <Link to="/alerts">
          <Badge count={0} size="small" offset={[5, -1]}>
            告警中心
          </Badge>
        </Link>
      ),
    },
    {
      key: '/exports',
      icon: <FileTextOutlined />,
      label: <Link to="/exports">导出中心</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        📚 职业教育证书考试排程台
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '16px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/review" element={<MonthlyReviewPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/exports" element={<ExportPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
