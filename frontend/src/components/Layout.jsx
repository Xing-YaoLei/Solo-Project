import { Layout, Menu, theme } from 'antd'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  ApiOutlined,
  GiftOutlined,
  UserOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: <Link to="/">工作台</Link>,
  },
  {
    key: '/orders',
    icon: <ShoppingOutlined />,
    label: <Link to="/orders">订单管理</Link>,
  },
  {
    key: '/appeals',
    icon: <FileTextOutlined />,
    label: <Link to="/appeals">申诉管理</Link>,
  },
  {
    key: '/settlements',
    icon: <CalculatorOutlined />,
    label: <Link to="/settlements">结算管理</Link>,
  },
  {
    key: '/riders',
    icon: <UserOutlined />,
    label: <Link to="/riders">骑手管理</Link>,
  },
  {
    key: '/stats',
    icon: <BarChartOutlined />,
    label: <Link to="/stats">复盘分析</Link>,
  },
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: '管理配置',
    children: [
      {
        key: '/admin/address-dict',
        icon: <EnvironmentOutlined />,
        label: <Link to="/admin/address-dict">地址字典</Link>,
      },
      {
        key: '/admin/track-rules',
        icon: <ApiOutlined />,
        label: <Link to="/admin/track-rules">轨迹规则</Link>,
      },
      {
        key: '/admin/subsidy-rules',
        icon: <GiftOutlined />,
        label: <Link to="/admin/subsidy-rules">补贴规则</Link>,
      },
    ],
  },
]

export default function AppLayout() {
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.startsWith('/orders')) return '/orders'
    if (path.startsWith('/appeals')) return '/appeals'
    if (path.startsWith('/admin/address')) return '/admin/address-dict'
    if (path.startsWith('/admin/track')) return '/admin/track-rules'
    if (path.startsWith('/admin/subsidy')) return '/admin/subsidy-rules'
    return path
  }

  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/admin')) return ['admin']
    return []
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-logo">🚴 跑腿即时下单跟进台</div>
        <div style={{ color: 'white' }}>管理员</div>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            defaultOpenKeys={getOpenKeys()}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '16px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
