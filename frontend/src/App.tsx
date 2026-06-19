import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, theme, Badge } from 'antd'
import {
  CalendarOutlined,
  BellOutlined,
  WarningOutlined,
  TeamOutlined,
  BarChartOutlined,
  DashboardOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import BookingsPage from './pages/BookingsPage'
import ConflictsPage from './pages/ConflictsPage'
import ReminderListsPage from './pages/ReminderListsPage'
import NotificationsPage from './pages/NotificationsPage'
import StatisticsPage from './pages/StatisticsPage'
import DashboardPage from './pages/DashboardPage'
import { notificationApi } from './services/api'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/bookings', icon: <CalendarOutlined />, label: '预约记录' },
  { key: '/conflicts', icon: <WarningOutlined />, label: '冲突中心' },
  { key: '/reminder-lists', icon: <TeamOutlined />, label: '提醒名单' },
  { key: '/notifications', icon: <BellOutlined />, label: '通知中心' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '月底复盘' },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    const fetchUnread = () => {
      notificationApi.getUnreadCount().then((count) => {
        setUnreadCount(count)
      }).catch(() => {
        setUnreadCount(0)
      })
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Layout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: collapsed ? 12 : 16,
            letterSpacing: 1,
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          {collapsed ? '景区' : '景区预约排程台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => {
            if (item.key === '/notifications') {
              return {
                ...item,
                icon: (
                  <Badge count={unreadCount} size="small" offset={[2, -2]}>
                    {item.icon}
                  </Badge>
                ),
              }
            }
            return item
          })}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {menuItems.find((m) => m.key === location.pathname)?.label || '工作台'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SettingOutlined style={{ fontSize: 16, color: '#666' }} />
            <span style={{ color: '#666' }}>运营管理员</span>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 0,
            minHeight: 280,
            background: '#f0f2f5',
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/conflicts" element={<ConflictsPage />} />
            <Route path="/reminder-lists" element={<ReminderListsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
