'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackageCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少6位'),
});

type LoginForm = z.infer<typeof loginSchema>;

const QUICK_ACCOUNTS = [
  { username: 'admin', label: '管理员', desc: '全部权限' },
  { username: 'manager', label: '管理层', desc: '查看趋势看板' },
  { username: 'dispatcher', label: '调度员', desc: '任务分派管理' },
  { username: 'verifier', label: '核验员', desc: '核验物品处理' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: 'dispatcher', password: '123456' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.login(data);
      setAuth(res.access_token, res.user);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <PackageCheck size={28} />
            </div>
            <div>
              <div className="text-xl font-bold">跑腿物品核验平台</div>
              <div className="text-sm text-white/70">Errand Verification System</div>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              高效核验
              <br />
              智能分派
              <br />
              全程可追溯
            </h1>
            <p className="text-white/70 text-lg">
              按日常处理节奏组织工作流，从照片核验、标签评价到地址核对、轨迹追踪、补贴核算，损坏处理全流程闭环管理。
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-white/60">核验准确率</div>
              </div>
              <div>
                <div className="text-3xl font-bold">5min</div>
                <div className="text-sm text-white/60">平均分派</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-white/60">全天运行</div>
              </div>
            </div>
          </div>

          <div className="text-white/50 text-sm">© 2024 Errand Verification Platform</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
              <PackageCheck size={22} />
            </div>
            <span className="text-lg font-bold text-gray-900">核验分派台</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">欢迎回来</h2>
            <p className="text-gray-500 text-sm mb-6">登录账号以进入工作台</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">用户名</label>
                <input
                  {...register('username')}
                  className={cn('input', errors.username && 'border-danger-500')}
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-danger-500">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="label">密码</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={cn('input pr-11', errors.password && 'border-danger-500')}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary h-11 text-base disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    登录中...
                  </>
                ) : (
                  '登 录'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-400 mb-3 text-center">快捷登录（默认密码：123456）</div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    onClick={() => {
                      setValue('username', acc.username);
                      setValue('password', '123456');
                    }}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                  >
                    <div className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                      {acc.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{acc.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
