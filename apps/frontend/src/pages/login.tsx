import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Lock, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, token, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.toString() || '登录失败，请检查用户名和密码');
    }
  };

  const quickLogin = (user: string) => {
    setUsername(user);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            民宿房态管理系统
          </h1>
          <p className="text-gray-500">旅游民宿房态管理任务分派台</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            登录账户
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full btn btn-primary py-2.5',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3 text-center">快速登录（测试账号）</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('admin')}
                className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
              >
                管理员
              </button>
              <button
                onClick={() => quickLogin('manager')}
                className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
              >
                经理
              </button>
              <button
                onClick={() => quickLogin('frontline1')}
                className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
              >
                前台
              </button>
              <button
                onClick={() => quickLogin('frontline2')}
                className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
              >
                保洁
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2024 民宿房态管理系统 - RMS Platform
        </p>
      </div>
    </div>
  );
}
