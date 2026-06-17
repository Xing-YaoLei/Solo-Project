import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import type { FormProps } from 'antd'

const { Title, Text } = Typography

interface LoginFormFields {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormFields>()
  const [error, setError] = useState<string | null>(null)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  const onFinish: FormProps<LoginFormFields>['onFinish'] = async (values) => {
    try {
      setError(null)
      await login(values.email, values.password)
      navigate(from, { replace: true })
    } catch {
      setError('登录失败，请检查邮箱和密码')
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
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            家装报价调度平台
          </Title>
          <Text type="secondary">请登录您的账号</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          size="large"
          layout="vertical"
          disabled={isLoading}
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入邮箱" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              icon={<LoginOutlined />}
              style={{ height: 44 }}
            >
              {isLoading ? <Spin size="small" /> : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            还没有账号？
            <Link to="/register" style={{ marginLeft: 4 }}>
              立即注册
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
