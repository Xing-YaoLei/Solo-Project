import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Badge } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store'
import { menuItems, roleLabels } from '@/config/menu'
import { UserRole } from '@/types'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { fullName, role, logout } = useAuthStore()

  const filteredMenuItems = menuItems.filter(
    (item) => !item.allowedRoles || (role && item.allowedRoles.includes(role as UserRole))
  )

  const selectedKey = filteredMenuItems.find((item) =>
    location.pathname.startsWith(item.path)
  )?.key || 'dashboard'

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const item = filteredMenuItems.find((m) => m.key === key)
    if (item) {
      navigate(item.path)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={250}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: 16,
            borderRadius: 8,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: collapsed ? 12 : 18,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {collapsed ? '家装' : '家装报价调度平台'}
          </span>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredMenuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0} showZero={false}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  transition: 'background 0.3s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar icon={<UserOutlined />} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, lineHeight: 1.2 }}>{fullName}</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.2 }}>
                    {role ? roleLabels[role as UserRole] : ''}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
