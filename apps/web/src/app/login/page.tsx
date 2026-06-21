'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@legal/shared';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: UserRole.CLIENT,
    barNumber: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              法
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">法律案件委托分派台</h1>
              <p className="text-xs text-slate-500">Legal Case Delegation Platform</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    姓名
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="请输入真实姓名"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    手机号
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="请输入手机号"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    角色
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={UserRole.CLIENT}>客户</option>
                    <option value={UserRole.ASSISTANT}>助理</option>
                    <option value={UserRole.LAWYER}>律师</option>
                    <option value={UserRole.ADMIN}>管理员</option>
                  </select>
                </div>
                {form.role === UserRole.LAWYER && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      律师执业证号（选填）
                    </label>
                    <input
                      type="text"
                      value={form.barNumber}
                      onChange={(e) => setForm({ ...form, barNumber: e.target.value })}
                      placeholder="请输入执业证号"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                邮箱
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="请输入邮箱地址"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === 'register' ? '至少 6 位' : '请输入密码'}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? '处理中...' : mode === 'login' ? '登录' : '创建账号'}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            {mode === 'login' ? (
              <>
                还没有账号？{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账号？{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  去登录
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/cases/new"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            直接提交案件委托（无需登录）→
          </Link>
        </div>
      </div>
    </div>
  );
}
