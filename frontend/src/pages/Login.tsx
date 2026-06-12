import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/api';
import { useAuthStore } from '@/store/auth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form] = Form.useForm();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (res) => {
      login(res.data.access_token, res.data.user);
      message.success('登录成功');
      navigate({ to: '/dashboard' });
    },
  });

  const initDataMutation = useMutation({
    mutationFn: authAPI.initData,
    onSuccess: (res) => {
      message.success('测试数据初始化成功，请使用下方账号登录');
      console.log('测试账号:', res.data.accounts);
    },
  });

  const handleLogin = (values: { username: string; password: string }) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <Card
        className="w-full max-w-md shadow-xl"
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coffee-600 text-white text-3xl mb-4">
            <CoffeeOutlined />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">连锁咖啡报损复核跟进台</h1>
          <p className="text-gray-500">Coffee Chain Loss Review System</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          size="large"
          initialValues={{ username: 'manager', password: '123456' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-11 text-base"
              loading={loginMutation.isPending}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
          <p className="mb-2">测试账号：</p>
          <p>管理层：manager / 123456</p>
          <p>一线人员：staff1 / 123456</p>
          <Button
            type="link"
            size="small"
            onClick={() => initDataMutation.mutate()}
            loading={initDataMutation.isPending}
            className="mt-2"
          >
            初始化测试数据
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Login;
