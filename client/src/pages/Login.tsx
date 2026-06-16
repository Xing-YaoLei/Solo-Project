import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import { login } from '@/api/auth'
import type { LoginRequest } from '@/types'

const Login = () => {
  const navigate = useNavigate()
  const { setToken, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true)
    try {
      const result = await login(values)
      setToken(result.token)
      setUser(result.user)
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
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
          width: 400,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1f1f1f', marginBottom: 8 }}>
            处方审核排程台
          </h1>
          <p style={{ color: '#8c8c8c', margin: 0 }}>药店连锁处方审核管理系统</p>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 44, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
          <p style={{ margin: 0 }}>测试账号：</p>
          <p style={{ margin: '4px 0 0 0' }}>admin / 123456 (总部运营)</p>
          <p style={{ margin: '4px 0 0 0' }}>pharmacist001 / 123456 (药师)</p>
          <p style={{ margin: '4px 0 0 0' }}>cashier001 / 123456 (收银员)</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
