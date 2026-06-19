'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ username, password });
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">汽修管理系统</h1>
          <p className="mt-2 text-slate-500">请登录以继续</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="用户名"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                autoFocus
              />

              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
            >
              登录
            </Button>

            <div className="text-center text-sm text-slate-500">
              <p>测试账号：</p>
              <p className="mt-1">顾问: advisor / admin123</p>
              <p>技师: technician / admin123</p>
              <p>配件员: partsclerk / admin123</p>
              <p>厂长: admin / admin123</p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-500">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
