import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import FunnelDashboard from './pages/FunnelDashboard'
import MemberList from './pages/MemberList'
import MemberDetail from './pages/MemberDetail'
import RefundAnalysis from './pages/RefundAnalysis'
import VerificationRecords from './pages/VerificationRecords'
import ThresholdSettings from './pages/ThresholdSettings'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: <Link to="/">续费漏斗看板</Link>,
  },
  {
    key: '/members',
    icon: <TeamOutlined />,
    label: <Link to="/members">会员档案</Link>,
  },
  {
    key: '/verification',
    icon: <BarChartOutlined />,
    label: <Link to="/verification">核销记录</Link>,
  },
  {
    key: '/refund',
    icon: <FileTextOutlined />,
    label: <Link to="/refund">退款分析</Link>,
  },
  {
    key: '/thresholds',
    icon: <SettingOutlined />,
    label: <Link to="/thresholds">预警阈值</Link>,
  },
]

function App() {
  return (
    <Router>
      <Layout className="app-layout" style={{ minHeight: '100vh' }}>
        <Sider theme="dark" width={220}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            健身私教管理
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header className="app-header" style={{ background: '#fff', padding: '0 24px' }}>
            <div className="app-title">
              <DashboardOutlined />
              会员续费漏斗报表系统
            </div>
            <div style={{ color: '#666' }}>
              运营数据复盘 · 续费率分析
            </div>
          </Header>
          <Content className="app-content" style={{ padding: 24 }}>
            <Routes>
              <Route path="/" element={<FunnelDashboard />} />
              <Route path="/members" element={<MemberList />} />
              <Route path="/members/:id" element={<MemberDetail />} />
              <Route path="/verification" element={<VerificationRecords />} />
              <Route path="/refund" element={<RefundAnalysis />} />
              <Route path="/thresholds" element={<ThresholdSettings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App
