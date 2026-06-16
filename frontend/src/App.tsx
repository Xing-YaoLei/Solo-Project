import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  PhoneOutlined,
  PictureOutlined,
  DollarOutlined,
  UserOutlined,
  BarChartOutlined,
  WarningOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import AppointmentSchedule from './pages/AppointmentSchedule';
import TreatmentPlans from './pages/TreatmentPlans';
import FollowUpTasks from './pages/FollowUpTasks';
import Images from './pages/Images';
import Billing from './pages/Billing';
import Patients from './pages/Patients';
import Reports from './pages/Reports';
import NoShowManagement from './pages/NoShowManagement';
import AppointmentDetail from './pages/AppointmentDetail';

const { Sider, Content, Header } = Layout;

function App() {
  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: '工作台',
      path: '/dashboard',
    },
    {
      key: '2',
      icon: <CalendarOutlined />,
      label: '复诊排程',
      path: '/appointments',
    },
    {
      key: '3',
      icon: <FileTextOutlined />,
      label: '治疗计划',
      path: '/treatment-plans',
    },
    {
      key: '4',
      icon: <PhoneOutlined />,
      label: '随访任务',
      path: '/follow-ups',
    },
    {
      key: '5',
      icon: <PictureOutlined />,
      label: '影像附件',
      path: '/images',
    },
    {
      key: '6',
      icon: <DollarOutlined />,
      label: '收费明细',
      path: '/billing',
    },
    {
      key: '7',
      icon: <UserOutlined />,
      label: '患者档案',
      path: '/patients',
    },
    {
      type: 'divider' as const,
    },
    {
      key: '8',
      icon: <BarChartOutlined />,
      label: '复诊率趋势',
      path: '/reports',
    },
    {
      key: '9',
      icon: <WarningOutlined />,
      label: '爽约管理',
      path: '/no-show',
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider theme="dark" width={220}>
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
            }}
          >
            口腔诊所排程台
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['2']}
            items={menuItems}
            onClick={({ key }) => {
              const item = menuItems.find((m: any) => m.key === key);
              if (item && 'path' in item) {
                window.location.hash = item.path || '';
              }
            }}
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
              boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 500 }}>会员复诊排程管理系统</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>管理员</span>
            </div>
          </Header>
          <Content style={{ margin: 0, background: '#f0f2f5', padding: 24, minHeight: 280 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/appointments" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<AppointmentSchedule />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/treatment-plans" element={<TreatmentPlans />} />
              <Route path="/follow-ups" element={<FollowUpTasks />} />
              <Route path="/images" element={<Images />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/no-show" element={<NoShowManagement />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
