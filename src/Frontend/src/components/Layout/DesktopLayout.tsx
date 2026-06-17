import React, { useEffect, useState } from 'react'
import { Layout, Menu, theme, Dropdown, Avatar, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAppStore, useUserStore } from '@/store'

const { Header, Sider, Content } = Layout

const DesktopLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed, toggleCollapsed } = useAppStore()
  const { user, logout } = useUserStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const [selectedKey, setSelectedKey] = useState('orders')

  useEffect(() => {
    const path = location.pathname
    if (path.includes('/desktop/orders')) {
      setSelectedKey('orders')
    } else if (path.includes('/desktop/analysis')) {
      setSelectedKey('analysis')
    } else if (path.includes('/desktop/overdue')) {
      setSelectedKey('overdue')
    }
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
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

  const menuItems = [
    {
      key: 'orders',
      icon: <UnorderedListOutlined />,
      label: <Link to="/desktop/orders">退租单管理</Link>,
    },
    {
      key: 'overdue',
      icon: <ClockCircleOutlined />,
      label: <Link to="/desktop/overdue">逾期处理</Link>,
    },
    {
      key: 'analysis',
      icon: <BarChartOutlined />,
      label: <Link to="/desktop/analysis">维修时长分析</Link>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: borderRadiusLG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '退租' : '退租验房管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
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
          }}
        >
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggleCollapsed,
            style: { fontSize: 18, cursor: 'pointer' },
          })}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name || '管理员'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default DesktopLayout
