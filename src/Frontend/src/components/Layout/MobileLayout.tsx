
import React, { useEffect, useState } from 'react'
import { Layout } from 'antd'
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

  const handleTabClick = (key: string) => {
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
      icon: <UnorderedListOutlined style={{ fontSize: 20 }} />,
    },
    {
      key: 'profile',
      title: '我的',
      icon: <UserOutlined style={{ fontSize: 20 }} />,
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
          height: 48,
          lineHeight: '48px',
        }}
      >
        {user?.name ? `${user.name}的待办` : '待办事项'}
      </Layout.Header>
      <Layout.Content
        style={{
          padding: 12,
          overflow: 'auto',
          paddingBottom: 64,
          height: 'calc(100vh - 48px)',
        }}
      >
        <Outlet />
      </Layout.Content>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: '#fff',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          zIndex: 100,
          borderTop: '1px solid #f0f0f0',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key
          return (
            <div
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isActive ? '#1677ff' : '#999',
                transition: 'color 0.2s',
              }}
            >
              {tab.icon}
              <span style={{ fontSize: 11, marginTop: 2 }}>{tab.title}</span>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

export default MobileLayout
