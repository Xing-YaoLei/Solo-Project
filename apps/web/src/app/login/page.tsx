'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Eye, EyeOff, LogIn, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  password: z.string().min(6, '密码至少6位'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.phone, data.password);
      toast('登录成功', { type: 'success' });
      router.push('/dashboard');
    } catch (e: any) {
      toast(e?.response?.data?.message || '登录失败，请检查手机号和密码', {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light mb-4 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 font-serif">
              景区投诉管理系统
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              投诉任务分派与管理平台
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  maxLength={11}
                  {...register('phone')}
                  className={cn(
                    'w-full pl-11 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors',
                    errors.phone
                      ? 'border-danger focus:ring-2 focus:ring-danger/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  )}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  {...register('password')}
                  className={cn(
                    'w-full pl-11 pr-11 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors',
                    errors.password
                      ? 'border-danger focus:ring-2 focus:ring-danger/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-lg hover:from-primary-light hover:to-primary transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {loading ? '登录中...' : '登 录'}
            </button>

            <div className="text-center text-xs text-slate-400">
              登录即表示同意系统使用协议
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          © 2024 景区投诉管理系统 v1.0
        </p>
      </div>
    </div>
  );
}
