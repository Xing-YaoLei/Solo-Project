'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  Shield,
  Wrench,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/utils';

const ROLE_PRESETS: {
  role: UserRole;
  label: string;
  sub: string;
  email: string;
  Icon: typeof Shield;
}[] = [
  {
    role: 'MANAGEMENT',
    label: '管理层（合规总监）',
    sub: '查看全局总览、KPI、分析图表与导入',
    email: 'management@company.com',
    Icon: Shield,
  },
  {
    role: 'EXECUTOR',
    label: '执行角色（财务主管）',
    sub: '只查看分配给您的整改项与首次解决率',
    email: 'executor@company.com',
    Icon: Wrench,
  },
  {
    role: 'REVIEWER',
    label: '复核人员（审计经理）',
    sub: '复核整改结果、写复核注释退回或通过',
    email: 'reviewer@company.com',
    Icon: Eye,
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('management@company.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { switchRole } = useSession();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const preset = ROLE_PRESETS.find((p) => p.email === email.trim().toLowerCase());
      if (!preset) {
        setError('未找到演示账号，请从下方角色列表中选择一个快速登录。');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少 6 位。');
        setLoading(false);
        return;
      }
      switchRole(preset.role);
      setLoading(false);
      router.replace('/');
    }, 500);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-brand-50/40 to-brand-100/60 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-brand-300/30 to-brand-600/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-amber-200/30 to-brand-500/10 blur-3xl" />

      <div className="relative z-10 grid lg:grid-cols-2 gap-10 max-w-6xl w-full items-center">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 ring-1 ring-brand-500/20 text-xs font-medium text-brand-800 backdrop-blur">
            <ShieldCheck className="w-3.5 h-3.5" />
            企业级合规审计平台
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            合规审计 <span className="text-brand-700">整改跟踪</span>
            <br />
            全流程可追溯·数据多源融合
          </h1>
          <p className="mt-4 text-slate-600 leading-relaxed max-w-md">
            先处理权限日志，再合并 ERP 导出与邮件材料，按批次回查原始数据。管理层看总览，
            执行角色专注分内整改与首次解决率，复核不通过随时写注释。
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700 max-w-md">
            {[
              '派工规则分布、处理时限漏斗可视化',
              '复核意见排行、关闭原因变化趋势',
              '每一个导入批次独立编号、全量回查',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-7 sm:p-8 shadow-xl w-full max-w-md mx-auto lg:mx-0 relative">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">登录到整改跟踪系统</h2>
          <p className="text-sm text-slate-500 mt-1">请选择演示角色快速登录，或输入账号密码。</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">邮箱</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">密码</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9"
                  type="password"
                  placeholder="至少 6 位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="text-xs text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '登录中...' : '登录'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-7">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />
              演示角色快速登录
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="mt-4 space-y-2">
              {ROLE_PRESETS.map((p) => {
                const active = email === p.email;
                const Icon = p.Icon;
                return (
                  <button
                    key={p.role}
                    onClick={() => setEmail(p.email)}
                    type="button"
                    className={cn(
                      'w-full text-left rounded-xl border px-4 py-3 transition-all',
                      active
                        ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                          active
                            ? 'bg-gradient-to-br from-brand-500 to-brand-800'
                            : 'bg-slate-200 text-slate-600',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{p.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">{p.sub}</div>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{p.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
