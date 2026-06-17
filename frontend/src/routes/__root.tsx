import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Layout, Menu, theme, Avatar, Dropdown, Space } from 'antd'
import {
  HomeOutlined,
  FileTextOutlined,
  ReconciliationOutlined,
  FileSearchOutlined,
  ExceptionOutlined,
  TeamOutlined,
  ExportOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { User } from '@/types'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    // @ts-ignore
    label: <Link to="/">首页概览</Link>,
  },
  {
    key: '/contracts',
    icon: <FileTextOutlined />,
    // @ts-ignore
    label: <Link to="/contracts">合同与附件</Link>,
  },
  {
    key: '/reconciliation',
    icon: <ReconciliationOutlined />,
    // @ts-ignore
    label: <Link to="/reconciliation">对账差异</Link>,
  },
  {
    key: '/bills',
    icon: <FileSearchOutlined />,
    // @ts-ignore
    label: <Link to="/bills">单据明细</Link>,
  },
  {
    key: '/approval',
    icon: <TeamOutlined />,
    // @ts-ignore
    label: <Link to="/approval">审批节点</Link>,
  },
  {
    key: '/exceptions',
    icon: <ExceptionOutlined />,
    // @ts-ignore
    label: <Link to="/exceptions">异常处理</Link>,
  },
  {
    key: '/export',
    icon: <ExportOutlined />,
    // @ts-ignore
    label: <Link to="/export">数据导出</Link>,
  },
]

export const Route = createRootRoute({
  component: RootComponent,
})

export const routeTree = Route

function RootComponent() {
  const navigate = useNavigate()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      // @ts-ignore
      navigate({ to: '/login' })
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // @ts-ignore
    navigate({ to: '/login' })
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
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

  const pathname = window.location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold">
          家装量房跟进台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h2 className="text-lg font-medium m-0">家装工地量房报价跟进台</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.full_name || '用户'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
