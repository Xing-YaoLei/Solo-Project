import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { Pill, User, Lock } from 'lucide-react';

export function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    const success = login(username, password);
    if (success) {
      router.navigate({ to: '/' });
    } else {
      setError('用户名不存在，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mb-4">
              <Pill className="w-8 h-8 text-brand-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">处方审核跟进台</h1>
            <p className="text-sm text-slate-400 mt-1">药店连锁处方审核管理系统</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2"
            >
              登录
            </button>

            <p className="text-2xs text-slate-400 text-center mt-3">
              提示：可使用 张伟、李芳、王强 等用户名登录
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
