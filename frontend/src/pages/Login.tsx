import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      await login(values.username, values.password);
      message.success('登录成功');
      navigate({ to: '/dashboard' });
    } catch (e) {
      console.error(e);
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
      }}
    >
      <Card
        style={{ width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 8,
            }}
          >
            💪
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>
            健身私教课程消耗跟进系统
          </Title>
          <Text type="secondary">Fitness Training Tracking System</Text>
        </div>

        <Form name="login" onFinish={handleLogin} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<SafetyOutlined />}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            测试账号：admin/admin123，trainer1/trainer123，member1/member123
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
