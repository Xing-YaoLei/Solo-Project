import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  CarOutlined,
  WarningOutlined,
  ToolOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import FunnelDashboard from './pages/FunnelDashboard.jsx'
import ReworkAnalysis from './pages/ReworkAnalysis.jsx'
import VehicleList from './pages/VehicleList.jsx'
import VehicleDetail from './pages/VehicleDetail.jsx'
import StockTasks from './pages/StockTasks.jsx'
import WarningSettings from './pages/WarningSettings.jsx'
import RepairOrderDetail from './pages/RepairOrderDetail.jsx'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">报价漏斗看板</Link> },
  { key: '/rework', icon: <BarChartOutlined />, label: <Link to="/rework">返修率分析</Link> },
  { key: '/vehicles', icon: <CarOutlined />, label: <Link to="/vehicles">车辆档案</Link> },
  { key: '/stock-tasks', icon: <ToolOutlined />, label: <Link to="/stock-tasks">缺货任务</Link> },
  { key: '/warnings', icon: <SettingOutlined />, label: <Link to="/warnings">预警配置</Link> },
]

function App() {
  const location = useLocation()

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/vehicles/')) return '/vehicles'
    if (location.pathname.startsWith('/repair-order/')) return '/'
    return location.pathname
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-logo">
          <BarChartOutlined />
          汽车维修报价漏斗报表系统
        </div>
        <div style={{ color: '#666', fontSize: 13 }}>
          复盘报价问题 · 优化转化流程
        </div>
      </Header>
      <Layout>
        <Sider
          width={220}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            style={{ borderRight: 0, paddingTop: 12 }}
          />
        </Sider>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<FunnelDashboard />} />
            <Route path="/rework" element={<ReworkAnalysis />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/repair-order/:id" element={<RepairOrderDetail />} />
            <Route path="/stock-tasks" element={<StockTasks />} />
            <Route path="/warnings" element={<WarningSettings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
