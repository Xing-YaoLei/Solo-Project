import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Select, Spin } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { UserRole } from '@/types'
import { userRoleLabels } from '@/config/status'
import type { FormProps } from 'antd'

const { Title, Text } = Typography

interface RegisterFormFields {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phoneNumber?: string
  role: UserRole
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterFormFields>()
  const [error, setError] = useState<string | null>(null)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const onFinish: FormProps<RegisterFormFields>['onFinish'] = async (values) => {
    try {
      setError(null)
      const { confirmPassword, ...registerData } = values
      await register(registerData)
      navigate('/dashboard')
    } catch {
      setError('注册失败，请稍后重试')
    }
  }

  const roleOptions = Object.values(UserRole).map((role) => ({
    value: role,
    label: userRoleLabels[role],
  }))

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 16px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            注册账号
          </Title>
          <Text type="secondary">创建您的家装平台账号</Text>
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
          name="register"
          onFinish={onFinish}
          size="large"
          layout="vertical"
          disabled={isLoading}
        >
          <Form.Item
            name="fullName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="手机号（选填）"
            rules={[
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入有效的手机号',
              },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              prefix={<SafetyOutlined />}
              placeholder="请选择角色"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（至少6位）"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              style={{ height: 44 }}
            >
              {isLoading ? <Spin size="small" /> : '注册'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            已有账号？
            <Link to="/login" style={{ marginLeft: 4 }}>
              立即登录
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage
