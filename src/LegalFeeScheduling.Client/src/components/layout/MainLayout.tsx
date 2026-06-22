import { useState } from 'react'
import { Layout, Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  FileTextOutlined,
  AuditOutlined,
  SettingOutlined,
  HistoryOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/quotes',
    icon: <FileTextOutlined />,
    label: '报价录入',
  },
  {
    key: '/review',
    icon: <AuditOutlined />,
    label: '审核管理',
  },
  {
    key: '/processing',
    icon: <ThunderboltOutlined />,
    label: '处理执行',
  },
  {
    key: '/history',
    icon: <HistoryOutlined />,
    label: '历史追溯',
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '汇总统计',
  },
]

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/review-detail')) return ['/review']
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '律师费' : '律师费调度系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#333',
            }}
          >
            <SettingOutlined style={{ marginRight: 8 }} />
            律师费调度管理系统
          </div>
        </Header>
        <Content style={{ margin: '16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
