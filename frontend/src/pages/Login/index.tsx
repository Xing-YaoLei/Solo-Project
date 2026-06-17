import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useStore();
  const [role, setRole] = useState<'admin' | 'worker'>('admin');
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    }
  };

  const handleRoleChange = (key: string) => {
    setRole(key as 'admin' | 'worker');
    if (key === 'admin') {
      form.setFieldsValue({ username: 'admin', password: 'admin123' });
    } else {
      form.setFieldsValue({ username: 'worker', password: 'worker123' });
    }
  };

  const tabItems = [
    {
      key: 'admin',
      label: '管理员登录',
    },
    {
      key: 'worker',
      label: '工作人员登录',
    },
  ];

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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '32px 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: '#1677ff',
              marginBottom: 8,
            }}
          >
            物业管理看板
          </div>
          <div style={{ color: '#888', fontSize: 14 }}>请登录以继续</div>
        </div>

        <Tabs
          activeKey={role}
          onChange={handleRoleChange}
          items={tabItems}
          centered
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          initialValues={{
            username: 'admin',
            password: 'admin123',
          }}
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

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
          <p>默认账号：</p>
          <p>管理员: admin / admin123</p>
          <p>工作人员: worker / worker123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
