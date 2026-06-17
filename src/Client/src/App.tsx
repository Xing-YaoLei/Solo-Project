import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  TagsOutlined,
  SafetyOutlined,
  BellOutlined,
  BarChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import Dashboard from '@/pages/Dashboard'
import SiteList from '@/pages/SiteList'
import SiteDetail from '@/pages/SiteDetail'
import CustomerList from '@/pages/CustomerList'
import MaterialDict from '@/pages/MaterialDict'
import TagGroup from '@/pages/TagGroup'
import AuthScope from '@/pages/AuthScope'
import Notification from '@/pages/Notification'
import Review from '@/pages/Review'
import About from '@/pages/About'

const { Header, Sider, Content, Footer } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '工作台'
  },
  {
    key: '/sites',
    icon: <HomeOutlined />,
    label: '工地管理'
  },
  {
    key: '/customers',
    icon: <TeamOutlined />,
    label: '客户档案'
  },
  {
    key: '/materials',
    icon: <FileTextOutlined />,
    label: '材料字典'
  },
  {
    key: '/tag-groups',
    icon: <TagsOutlined />,
    label: '标签分组'
  },
  {
    key: '/auth-scopes',
    icon: <SafetyOutlined />,
    label: '授权阈值'
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: '通知中心'
  },
  {
    key: '/review',
    icon: <BarChartOutlined />,
    label: '资料复盘'
  },
  {
    key: '/about',
    icon: <InfoCircleOutlined />,
    label: '关于'
  }
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const getSelectedKey = () => {
    const pathname = location.pathname
    if (pathname.startsWith('/sites/')) {
      return '/sites'
    }
    return pathname
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0
        }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '64px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}
        >
          家装排程台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
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
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            家装工地客户确认排程台
          </div>
          <div style={{ color: '#666' }}>
            欢迎您，管理员
          </div>
        </Header>
        <Content
          style={{
            margin: '0',
            overflow: 'initial',
            minHeight: 'calc(100vh - 130px)'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sites" element={<SiteList />} />
            <Route path="/sites/:id" element={<SiteDetail />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/materials" element={<MaterialDict />} />
            <Route path="/tag-groups" element={<TagGroup />} />
            <Route path="/auth-scopes" element={<AuthScope />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/review" element={<Review />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          家装工地客户确认排程台 ©{new Date().getFullYear()} Created with React + Vite + Ant Design
        </Footer>
      </Layout>
    </Layout>
  )
}

export default App
