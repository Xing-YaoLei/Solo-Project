import { Suspense, useEffect } from 'react'
import { useRoutes } from 'react-router-dom'
import { ConfigProvider, Spin, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { routes } from '@/router'
import { useAuthStore } from '@/store'

function App() {
  const element = useRoutes(routes)
  const { isAuthenticated, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser()
    }
  }, [isAuthenticated, fetchCurrentUser])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          {element}
        </Suspense>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
