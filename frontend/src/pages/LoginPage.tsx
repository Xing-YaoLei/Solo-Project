import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Typography, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { LoginData } from '@/types'

const { Title, Text } = Typography

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const searchParams = new URLSearchParams(location.search || '')
  const rawRedirect = searchParams.get('redirect') || '/'
  let redirectTo = '/'
  try {
    redirectTo = decodeURIComponent(rawRedirect)
    if (!redirectTo.startsWith('/') || redirectTo.startsWith('/login')) {
      redirectTo = '/'
    }
  } catch {
    redirectTo = '/'
  }

  const handleSubmit = async (values: LoginData) => {
    setLoading(true)
    try {
      await login(values)
      message.success('登录成功！')
      navigate({ to: redirectTo })
    } catch (error: any) {
      const msg = error.response?.data?.detail || '登录失败，请检查用户名和密码'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '40px 36px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SafetyOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: '0 0 8px' }}>
            合规审计系统
          </Title>
          <Text type="secondary">Compliance Audit Platform</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          initialValues={{ remember: true, username: 'admin', password: 'admin123' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认账号: admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
