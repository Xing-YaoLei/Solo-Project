import { Layout, Menu, Button, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  QrcodeOutlined,
  FileTextOutlined,
  WarningOutlined,
  BarChartOutlined,
  GiftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useAppStore } from '../store'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/group-batches',
    icon: <ShoppingCartOutlined />,
    label: '团购批次',
  },
  {
    key: '/arrival-lists',
    icon: <InboxOutlined />,
    label: '到货清单',
  },
  {
    key: '/pickup-codes',
    icon: <QrcodeOutlined />,
    label: '自提码管理',
  },
  {
    key: '/after-sales',
    icon: <FileTextOutlined />,
    label: '售后凭证',
  },
  {
    key: '/exception-orders',
    icon: <WarningOutlined />,
    label: '异常单管理',
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: '数据报表',
  },
  {
    key: '/products',
    icon: <GiftOutlined />,
    label: '商品管理',
  },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed, toggleCollapsed, user } = useAppStore()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate({ to: key })
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: collapsed ? 14 : 16,
            color: '#1890ff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {collapsed ? '团购' : '社区团购跟进台'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666' }}>
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
