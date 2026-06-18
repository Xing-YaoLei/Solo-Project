import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Form, Input, Button, Card, Typography, message, App, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { login } from '../lib/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate({ to: '/' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error?.response?.data?.detail || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <App>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Card
          style={{ width: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
          bordered={false}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 4 }}>
              汽车维修预约进厂跟进系统
            </Title>
            <Text type="secondary">请登录以继续</Text>
          </div>

          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
            message="演示账号"
            description={
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div>厂长：<code>manager / manager123</code></div>
                <div>顾问：<code>consultant / consultant123</code></div>
                <div>技师：<code>technician / technician123</code></div>
                <div>配件员：<code>parts / parts123</code></div>
              </div>
            }
          />

          <Form onFinish={handleSubmit} size="large" autoComplete="off">
            <Form.Item
              name="username"
              initialValue="manager"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              initialValue="manager123"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </App>
  );
}
