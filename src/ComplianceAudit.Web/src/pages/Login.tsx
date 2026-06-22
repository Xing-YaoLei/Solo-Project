import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Tabs, Radio } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AuditRole } from '@/types';

const { Title, Text } = Typography;

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('用户名或密码错误');
      }
    } catch {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const success = await register(values);
      if (success) {
        message.success('注册成功');
        navigate('/dashboard');
      } else {
        message.error('注册失败');
      }
    } catch {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24
    }}>
      <Card
        style={{ width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', borderRadius: 12 }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1677ff, #69c0ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#fff', fontSize: 28, fontWeight: 700
          }}>
            合
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>合规审计制度检查排程台</Title>
          <Text type="secondary">Compliance Audit Management System</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form form={loginForm} layout="vertical" onFinish={handleLogin} size="large">
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效邮箱' }
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="邮箱地址" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
                      登录系统
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={handleRegister} size="large">
                  <Form.Item name="fullName" rules={[{ required: true, message: '请输入姓名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="姓名" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效邮箱' }
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="邮箱地址" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 8, message: '密码至少8位' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码（至少8位，含大小写和数字）" />
                  </Form.Item>
                  <Form.Item name="department">
                    <Input placeholder="部门（可选）" />
                  </Form.Item>
                  <Form.Item name="role" initialValue={AuditRole.Auditor}>
                    <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%' }}>
                      <Radio.Button value={AuditRole.Auditor} style={{ width: '50%' }}>审计员</Radio.Button>
                      <Radio.Button value={AuditRole.BusinessOwner} style={{ width: '50%' }}>业务负责人</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
                      注册账号
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2026 合规审计制度检查排程台 · Powered by ASP.NET Core + React + SQL Server
          </Text>
        </div>
      </Card>
    </div>
  );
}
