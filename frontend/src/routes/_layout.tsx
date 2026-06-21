import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd'
import {
  FileTextOutlined,
  AuditOutlined,
  PayCircleOutlined,
  WarningOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useAuthStore, hasRole } from '../store/auth'
import { getUserRoleLabel } from '../utils/format'

const { Header, Sider, Content } = Layout

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      useAuthStore.getState().fetchMe()
    }
  }, [user])

  const menuItems = [
    {
      key: '/quotes',
      icon: <FileTextOutlined />,
      label: '报价单',
    },
    {
      key: '/approvals',
      icon: <AuditOutlined />,
      label: '审批工作台',
    },
    {
      key: '/payments',
      icon: <PayCircleOutlined />,
      label: '支付流水',
    },
    {
      key: '/exceptions',
      icon: <WarningOutlined />,
      label: '异常处理',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
  ]

  if (hasRole(user, 'partner', 'assistant')) {
    menuItems.splice(1, 0, {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理',
    })
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人信息',
        onClick: () => navigate({ to: '/profile' }),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: () => {
          logout()
          navigate({ to: '/login' })
        },
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220} collapsible>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          法律服务报价跟进台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate({ to: key as any })}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.full_name || '用户'}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {user ? getUserRoleLabel(user.role) : ''}
                </div>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: 0, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
