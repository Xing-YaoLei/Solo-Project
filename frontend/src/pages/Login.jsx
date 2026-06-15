import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { authApi } from '../services'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login(values.username, values.password)
      const token = res.data.access_token
      const meRes = await authApi.me()
      setAuth(token, meRes.data)
      message.success('登录成功！欢迎使用成绩复核跟进台')
      navigate({ to: '/dashboard' })
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <Card
        style={{ width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        title={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>高校教务成绩复核跟进台</div>
            <div style={{ fontSize: 13, color: '#8c8c8c' }}>Education Review Management System</div>
          </div>
        }
      >
        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名 (admin / teacher1 / advisor1 / affairs1)" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码 (admin123 / teacher123 ...)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />}>
              登录系统
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#8c8c8c', padding: '8px 0', borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
          默认账号：admin / admin123 （系统管理员）
        </div>
      </Card>
    </div>
  )
}
