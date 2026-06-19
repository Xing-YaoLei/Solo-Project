import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { Form, Input, Button, Card, Typography, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../store/auth';
import { RoleEnum, ROLE_LABELS } from '../types';
import { useState } from 'react';

const { Title, Text } = Typography;

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(values.username, values.password);
        message.success('登录成功');
        navigate({ to: '/' });
      } else {
        await register({
          username: values.username,
          password: values.password,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          role: values.role || 'tourist',
        });
        message.success('注册成功，请登录');
        setMode('login');
        form.resetFields();
      }
    } catch {
      /* error handled in interceptor */
    } finally {
      setLoading(false);
    }
  };

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
        style={{ width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: 12 }}
        styles={{ body: { padding: 40 } }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, color: '#1677ff' }}>
              🎡 景区运营导览跟进台
            </Title>
            <Text type="secondary">
              {mode === 'login' ? '整理导览流程 · 集中核对点位/内容/座位/合同' : '创建新账号'}
            </Text>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" allowClear />
            </Form.Item>

            {mode === 'register' && (
              <>
                <Form.Item name="full_name" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input placeholder="真实姓名" allowClear />
                </Form.Item>
                <Form.Item name="email">
                  <Input placeholder="邮箱 (可选)" allowClear />
                </Form.Item>
                <Form.Item name="phone">
                  <Input placeholder="手机 (可选)" allowClear />
                </Form.Item>
                <Form.Item name="role" initialValue="tourist">
                  <Input.Group compact>
                    <select
                      className="ant-input"
                      style={{ width: '100%', height: 40, borderRadius: 6 }}
                      defaultValue="tourist"
                      onChange={(e) => form.setFieldValue('role', e.target.value as RoleEnum)}
                    >
                      {(Object.keys(ROLE_LABELS) as RoleEnum[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </Input.Group>
                </Form.Item>
              </>
            )}

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" allowClear />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                icon={mode === 'login' ? <LoginOutlined /> : <UserAddOutlined />}
                size="large"
              >
                {mode === 'login' ? '登录' : '注册'}
              </Button>
            </Form.Item>

            <Divider style={{ margin: '8px 0' }} />

            <Button type="link" block onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? '没有账号？立即注册' : '已有账号？去登录'}
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
