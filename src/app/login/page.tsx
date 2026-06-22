'use client';

import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Wrench,
  Eye,
} from 'lucide-react';
import { useSession } from '@/store/session';
import { listDemoUsers } from '@/lib/auth-helpers';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { loginByEmail, loading } = useSession();
  const [email, setEmail] = useState('management@company.com');
  const [pwd, setPwd] = useState('12345678');
  const [err, setErr] = useState<string | null>(null);
  const demos = listDemoUsers();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const r = await loginByEmail(email);
    if (!r.ok) setErr(r.error ?? '登录失败');
  };

  const quick = async (em: string) => {
    setErr(null);
    setEmail(em);
    const r = await loginByEmail(em);
    if (!r.ok) setErr(r.error ?? '登录失败');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-brand-50/40 to-brand-100/60 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-brand-300/30 to-brand-600/10 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-amber-200/30 to-brand-500/10 blur-3xl"></div>

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
            <li className="flex items-start gap-2">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-600"></div>
              派工规则分布、处理时限漏斗可视化
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-600"></div>
              复核意见排行、关闭原因变化趋势
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-600"></div>
              每一个导入批次独立编号、全量回查
            </li>
          </ul>
        </div>

        <div className="card p-7 sm:p-8 shadow-xl w-full max-w-md mx-auto lg:mx-0 relative">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">登录到整改跟踪系统</h2>
          <p className="text-sm text-slate-500 mt-1">请选择演示角色快速登录，或输入账号密码。</p>

          {err && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs ring-1 ring-rose-200">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
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
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className={cn('btn-primary w-full', loading && 'opacity-60 pointer-events-none')}
            >
              {loading ? '登录中...' : '登录'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-7">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200"></div>
              演示角色快速登录
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="mt-4 space-y-2">
              {demos.map((u, idx) => {
                const active = email === u.email;
                const Icon =
                  u.role === 'MANAGEMENT'
                    ? Shield
                    : u.role === 'EXECUTOR'
                      ? Wrench
                      : Eye;
                return (
                  <button
                    type="button"
                    key={u.email}
                    onClick={() => quick(u.email)}
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
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          active
                            ? 'text-white bg-gradient-to-br from-brand-500 to-brand-800'
                            : 'bg-slate-200 text-slate-600',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{u.hint}</div>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
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
