import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header } = Layout

interface AppHeaderProps {
  title: string
}

function AppHeader({ title }: AppHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/', label: '首页' },
    { key: '/about', label: '关于' },
  ]

  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginRight: '40px' }}>
        {title}
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Header>
  )
}

export default AppHeader
