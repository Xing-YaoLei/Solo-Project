import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  WarningOutlined,
  AuditOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { roleLabels } from '../utils/enumLabels'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘',
      },
    ]

    if (user?.role === 'Administrator' || user?.role === 'AcademicAffairs' || user?.role === 'Dean') {
      baseItems.push(
        { key: '/courses', icon: <BookOutlined />, label: '课程目录' },
        { key: '/classrooms', icon: <HomeOutlined />, label: '教室资源' },
        { key: '/students', icon: <TeamOutlined />, label: '学生名单' }
      )
    }

    baseItems.push(
      { key: '/schedule', icon: <CalendarOutlined />, label: '排课排程台' },
      { key: '/conflicts', icon: <WarningOutlined />, label: '冲突处理' },
      { key: '/approvals', icon: <AuditOutlined />, label: '待办审核' }
    )

    if (user?.role === 'Teacher' || user?.role === 'Administrator' || user?.role === 'AcademicAffairs') {
      baseItems.push({ key: '/transcripts', icon: <FileTextOutlined />, label: '成绩单' })
    }

    if (user?.role === 'Student' || user?.role === 'Administrator' || user?.role === 'AcademicAffairs') {
      baseItems.push({ key: '/applications', icon: <FormOutlined />, label: '申请材料' })
    }

    return baseItems
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

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
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 18,
            color: '#1890ff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          教务排课系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {getMenuItems().find((item) => item.key === location.pathname)?.label || '教务排课系统'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#666' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>
                  {user?.realName} ({roleLabels[user?.role as keyof typeof roleLabels]})
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
