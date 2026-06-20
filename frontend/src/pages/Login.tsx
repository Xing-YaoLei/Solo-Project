import { useState } from 'react'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore, UserRole } from '../store/auth'

const { Text } = Typography

interface LoginForm {
  username: string
  password: string
}

const Login = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const demoAccounts = [
    { user: 'ops_manager', pass: 'ops123', role: '运营经理（导出CSV）' },
    { user: 'analyst', pass: 'analyst123', role: '分析师' },
    { user: 'admin', pass: 'admin123', role: '管理员' },
    { user: 'viewer', pass: 'viewer123', role: '查看者' },
  ]

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(values)
      setAuth(res.access_token, {
        id: 1,
        username: values.username,
        email: `${values.username}@scenic.com`,
        full_name: values.username,
        role: values.username === 'ops_manager' ? 'operation_manager' as UserRole :
              values.username === 'admin' ? 'admin' as UserRole :
              values.username === 'analyst' ? 'analyst' as UserRole : 'viewer' as UserRole,
        is_active: true,
      })
      navigate('/')
    } catch (e) {
      setError('用户名或密码错误，请使用下方演示账号登录')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">景区运营演出排期风险监测</h2>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 12, background: '#f6f8fa', borderRadius: 6 }}>
          <Text strong>演示账号：</Text>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            {demoAccounts.map((a) => (
              <li key={a.user} style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                {a.user} / {a.pass} — <Text type="secondary">{a.role}</Text>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login
