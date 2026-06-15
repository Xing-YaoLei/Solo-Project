import { useEffect, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd'
import {
  DashboardOutlined,
  FileSearchOutlined,
  TeamOutlined,
  AuditOutlined,
  UserOutlined,
  ReadOutlined,
  BarChartOutlined,
  FileDoneOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth'
import { notificationsApi } from '../services'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/records', icon: <FileSearchOutlined />, label: '记录台（三栏视图）' },
  { key: '/reviews', icon: <AuditOutlined />, label: '复核申请' },
  { key: '/students', icon: <TeamOutlined />, label: '学生名单' },
  { key: '/advisors', icon: <ReadOutlined />, label: '导师名额' },
  { key: '/monthly-review', icon: <BarChartOutlined />, label: '月底复盘' },
  { key: '/reports', icon: <FileDoneOutlined />, label: '报表下载' },
  { key: '/notifications', icon: <BellOutlined />, label: '通知中心' },
  { key: '/audit', icon: <BookOutlined />, label: '审计日志' },
]

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [unread, setUnread] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetchUnread()
    const timer = setInterval(fetchUnread, 30000)
    return () => clearInterval(timer)
  }, [])

  const fetchUnread = async () => {
    try {
      const res = await notificationsApi.unreadCount()
      setUnread(res.data.unread_count)
    } catch {}
  }

  const getSelectedKey = () => {
    const p = location.pathname
    for (const item of menuItems) {
      if (p === item.key || p.startsWith(item.key + '/')) return item.key
    }
    return '/dashboard'
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const userMenu = {
    items: [
      { key: '1', icon: <UserOutlined />, label: `${user?.full_name || ''} (${user?.role || ''})` },
      { key: '2', icon: <SettingOutlined />, label: '个人设置', disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  }

  return (
    <Layout className="app-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 14 : 16, fontWeight: 600, background: '#000c17' }}>
          {collapsed ? '教务' : '成绩复核跟进台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate({ to: key })}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="logo">
            <FileSearchOutlined style={{ fontSize: 20 }} />
            {!collapsed && <span>高校教务成绩复核跟进台</span>}
          </div>
          <div className="user-info">
            <Badge count={unread} size="small" offset={[-4, 4]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ color: 'white', fontSize: 16 }} />}
                onClick={() => navigate({ to: '/notifications' })}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.full_name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
