import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, ConfigProvider } from 'antd'
import { Outlet, createRootRouteWithContext, createRoute, createRouter, Link, useRouter } from '@tanstack/react-router'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  ExperimentOutlined,
  ToolOutlined,
  TeamOutlined,
  WarningOutlined,
  ExportOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import { useAuth } from '@/hooks/useAuth'
import Dashboard from '@/pages/Dashboard'
import ChecklistList from '@/pages/ChecklistList'
import ChecklistForm from '@/pages/ChecklistForm'
import SamplingList from '@/pages/SamplingList'
import SamplingForm from '@/pages/SamplingForm'
import SamplingDetail from '@/pages/SamplingDetail'
import RectificationList from '@/pages/RectificationList'
import RectificationForm from '@/pages/RectificationForm'
import VendorList from '@/pages/VendorList'
import ExceptionList from '@/pages/ExceptionList'
import ExceptionForm from '@/pages/ExceptionForm'
import ExportPage from '@/pages/ExportPage'

const { Header, Sider, Content } = Layout

interface RouterContext {
  auth: ReturnType<typeof useAuth>
}

const RootComponent: React.FC = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.navigate({ to: '/' })
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  }

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">首页仪表盘</Link>,
    },
    {
      key: '/checklist',
      icon: <UnorderedListOutlined />,
      label: <Link to="/checklist">检查清单</Link>,
    },
    {
      key: '/sampling',
      icon: <ExperimentOutlined />,
      label: <Link to="/sampling">抽样记录</Link>,
    },
    {
      key: '/rectification',
      icon: <ToolOutlined />,
      label: <Link to="/rectification">整改计划</Link>,
    },
    {
      key: '/vendors',
      icon: <TeamOutlined />,
      label: <Link to="/vendors">供应商管理</Link>,
    },
    {
      key: '/exceptions',
      icon: <WarningOutlined />,
      label: <Link to="/exceptions">异常单处理</Link>,
    },
    {
      key: '/export',
      icon: <ExportOutlined />,
      label: <Link to="/export">数据导出</Link>,
    },
  ]

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={220} theme="dark">
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              borderBottom: '1px solid #333',
            }}
          >
            合规审计系统
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Badge count={3} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
              <Dropdown menu={userMenu} placement="bottomRight">
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{user?.username || '用户'}</span>
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content style={{ margin: 24, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const checklistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checklist',
  component: ChecklistList,
})

const checklistNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checklist/new',
  component: () => <ChecklistForm />,
})

const checklistEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checklist/$id/edit',
  component: () => {
    const { id } = checklistEditRoute.useParams()
    return <ChecklistForm id={Number(id)} />
  },
})

const samplingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sampling',
  component: SamplingList,
})

const samplingNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sampling/new',
  component: SamplingForm,
})

const samplingEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sampling/$id/edit',
  component: () => {
    const { id } = samplingEditRoute.useParams()
    return <SamplingForm id={Number(id)} />
  },
})

const samplingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sampling/$id',
  component: () => {
    const { id } = samplingDetailRoute.useParams()
    return <SamplingDetail id={Number(id)} />
  },
})

const rectificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rectification',
  component: RectificationList,
})

const rectificationNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rectification/new',
  component: RectificationForm,
})

const rectificationEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rectification/$id/edit',
  component: () => {
    const { id } = rectificationEditRoute.useParams()
    return <RectificationForm id={Number(id)} />
  },
})

const vendorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vendors',
  component: VendorList,
})

const exceptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exceptions',
  component: ExceptionList,
})

const exceptionNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exceptions/new',
  component: ExceptionForm,
})

const exceptionEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exceptions/$id/edit',
  component: () => {
    const { id } = exceptionEditRoute.useParams()
    return <ExceptionForm id={Number(id)} />
  },
})

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: ExportPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  checklistRoute,
  checklistNewRoute,
  checklistEditRoute,
  samplingRoute,
  samplingNewRoute,
  samplingEditRoute,
  samplingDetailRoute,
  rectificationRoute,
  rectificationNewRoute,
  rectificationEditRoute,
  vendorsRoute,
  exceptionsRoute,
  exceptionNewRoute,
  exceptionEditRoute,
  exportRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    auth: undefined as unknown as ReturnType<typeof useAuth>,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
