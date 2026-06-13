import { Form, Input, Button, Card, message, Tabs, Select, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import { UserRole } from '../types';
import type { User } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Client);

  useEffect(() => {
    authApi.getCoaches().then(setCoaches).catch(() => {});
  }, []);

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const result = await authApi.login(values.email, values.password);
      setAuth(result.token, result.user);
      message.success('登录成功');
      navigate('/records');
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      await authApi.register({
        userName: values.userName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        role: values.role ?? UserRole.Client,
        coachId: values.coachId
      });
      message.success('注册成功，请登录');
    } catch (err: any) {
      message.error(err.response?.data?.message || '注册失败');
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Card style={{ width: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>💪 健身饮食打卡排程台</h2>
          <p style={{ color: '#888', marginTop: 8 }}>专业私教 · 科学饮食 · 健康塑形</p>
        </div>
        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={onLogin} layout="vertical">
                  <Form.Item
                    name="email"
                    rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={onRegister} layout="vertical" initialValues={{ role: UserRole.Client }}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="userName"
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '请选择角色' }]}
                      >
                        <Select
                          onChange={(v) => setSelectedRole(v)}
                          options={[
                            { label: '👤 学员', value: UserRole.Client },
                            { label: '🏋️ 教练', value: UserRole.Coach },
                            { label: '👑 管理员', value: UserRole.Admin }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="邮箱" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }, { min: 6 }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码 (至少6位)" />
                  </Form.Item>
                  <Form.Item name="phoneNumber" label="手机号">
                    <Input prefix={<PhoneOutlined />} placeholder="手机号 (选填)" />
                  </Form.Item>
                  {selectedRole === UserRole.Client && (
                    <Form.Item name="coachId" label="所属教练">
                      <Select
                        allowClear
                        placeholder="选择所属教练 (选填)"
                        options={coaches.map((c) => ({ label: c.userName, value: c.id }))}
                      />
                    </Form.Item>
                  )}
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      注册账号
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default Login;
