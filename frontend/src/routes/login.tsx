import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '@/api'
import { UserLogin } from '@/types'

// @ts-ignore
export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values: UserLogin) => {
    try {
      const result = await authApi.login(values)
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('user', JSON.stringify(result.user))
      message.success('登录成功')
      // @ts-ignore
      navigate({ to: '/' })
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleDemoLogin = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin123',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card
        className="w-full max-w-md shadow-xl"
        title={
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">家装工地量房报价跟进台</h2>
            <p className="text-sm text-gray-500 mt-1">请登录您的账户</p>
          </div>
        }
      >
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-11 text-base"
            >
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <Button type="link" onClick={handleDemoLogin}>
              使用演示账号登录 (admin / admin123)
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
