import React, { useEffect, useState } from 'react'
import { Layout, TabBar } from 'antd'
import {
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store'

const MobileLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUserStore()
  const [activeKey, setActiveKey] = useState('todos')

  useEffect(() => {
    const path = location.pathname
    if (path.includes('/mobile/todos')) {
      setActiveKey('todos')
    } else if (path.includes('/mobile/profile')) {
      setActiveKey('profile')
    }
  }, [location.pathname])

  const handleTabChange = (key: string) => {
    setActiveKey(key)
    if (key === 'todos') {
      navigate('/mobile')
    } else if (key === 'profile') {
      navigate('/mobile/profile')
    }
  }

  const tabs = [
    {
      key: 'todos',
      title: '待办',
      icon: <UnorderedListOutlined />,
    },
    {
      key: 'profile',
      title: '我的',
      icon: <UserOutlined />,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Layout.Header
        style={{
          background: '#1677ff',
          color: '#fff',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 18,
          padding: '0 16px',
        }}
      >
        {user?.name ? `${user.name}的待办` : '待办事项'}
      </Layout.Header>
      <Layout.Content
        style={{
          padding: 12,
          overflow: 'auto',
          paddingBottom: 60,
        }}
      >
        <Outlet />
      </Layout.Content>
      <Layout.Footer style={{ padding: 0, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
        <TabBar activeKey={activeKey} onChange={handleTabChange} items={tabs} />
      </Layout.Footer>
    </Layout>
  )
}

export default MobileLayout
