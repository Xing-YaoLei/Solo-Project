import { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  InsuranceOutlined,
  BarChartOutlined,
  UserOutlined,
  ShopOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import { UserRoleNames, UserRole } from '@/types'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasRole } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)

  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '工作台',
      },
      {
        key: '/prescriptions',
        icon: <FileTextOutlined />,
        label: '处方审核',
      },
    ]

    if (hasRole([UserRole.StoreManager, UserRole.Headquarters, UserRole.Pharmacist])) {
      items.push({
        key: '/restock-orders',
        icon: <ShoppingCartOutlined />,
        label: '补货单核对',
      })
    }

    if (hasRole([UserRole.StoreManager, UserRole.Headquarters])) {
      items.push({
        key: '/insurance-records',
        icon: <InsuranceOutlined />,
        label: '医保流水',
      })
    }

    if (hasRole([UserRole.StoreManager, UserRole.Headquarters])) {
      items.push({
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: '统计报表',
      })
    }

    if (hasRole([UserRole.Headquarters])) {
      items.push({
        key: '/users',
        icon: <UserOutlined />,
        label: '用户管理',
      })
      items.push({
        key: '/stores',
        icon: <ShopOutlined />,
        label: '门店管理',
      })
    }

    return items
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {collapsed ? '审方台' : '处方审核排程台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: '#1f1f1f' }}>
            {getPageTitle(location.pathname)}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <div>
                <div style={{ fontSize: 14, color: '#1f1f1f' }}>{user?.realName}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {user ? UserRoleNames[user.role] : ''}
                </div>
              </div>
              <DownOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 0,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

const getPageTitle = (path: string): string => {
  if (path.startsWith('/dashboard')) return '工作台'
  if (path.startsWith('/prescriptions')) return '处方审核'
  if (path.startsWith('/restock-orders')) return '补货单核对'
  if (path.startsWith('/insurance-records')) return '医保流水'
  if (path.startsWith('/statistics')) return '统计报表'
  if (path.startsWith('/users')) return '用户管理'
  if (path.startsWith('/stores')) return '门店管理'
  return '处方审核排程台'
}

export default MainLayout
