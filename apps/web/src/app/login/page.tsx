'use client';

import React from 'react';
import { Form, Input, Button, Card, Typography, App as AntdApp, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LoginRequest } from '@/lib/api/auth';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const onFinish = async (values: LoginRequest) => {
    try {
      clearError();
      await login(values);
      message.success('登录成功');
      router.push('/dashboard');
    } catch {
      message.error(error || '登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <Title level={2} className="!mb-2">
            审计管理系统
          </Title>
          <Text type="secondary">企业内部审计管理平台</Text>
        </div>

        <Card className="shadow-xl border-0 rounded-2xl">
          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              closable
              onClose={clearError}
              className="mb-6"
            />
          )}

          <Form
            form={form}
            name="login"
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ username: '', password: '' }}
            size="large"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                className="h-11 font-medium"
              >
                登录
              </Button>
            </Form.Item>

            <div className="text-center text-sm text-gray-500">
              <Text type="secondary">测试账号: admin / admin123</Text>
            </div>
          </Form>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>© 2024 审计管理系统 版权所有</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
