'use client';

import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  LogOut,
  User as UserIcon,
  Shield,
  Wrench,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { useSession } from '@/store/session';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TITLE_MAP: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: '总览仪表盘', sub: '管理层全局风险总览、KPI 指标与预警' },
  '/my-tasks': { title: '我的整改', sub: '分配给您的整改项、首次解决率与待办' },
  '/audits': { title: '审计项', sub: '全量审计项检索、筛选、派工与状态流转' },
  '/analytics': { title: '分析中心', sub: '派工规则、处理时限、复核意见、关闭原因' },
  '/import': { title: '数据导入中心', sub: '权限日志、ERP、邮件材料的批次导入与回查' },
  '/login': { title: '登录', sub: '' },
};

function findTitle(pathname: string) {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  const key = Object.keys(TITLE_MAP).find((k) => pathname.startsWith(k));
  if (key) return TITLE_MAP[key];
  return { title: '合规审计系统', sub: '' };
}

export function TopBar() {
  const pathname = usePathname();
  const { user, switchRole, setUser } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const { title, sub } = findTitle(pathname ?? '');
  const roleIcon =
    user?.role === 'MANAGEMENT'
      ? Shield
      : user?.role === 'EXECUTOR'
        ? Wrench
        : Eye;
  const RoleIcon = roleIcon;
  const roleLabel =
    user?.role === 'MANAGEMENT'
      ? '管理层'
      : user?.role === 'EXECUTOR'
        ? '执行角色'
        : '复核人员';

  return (
    <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200/70 sticky top-0 z-20">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>首页</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">{title}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
            {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200">
            <span className="chip bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20">
              Demo 演示环境
            </span>
            <span className="text-xs text-slate-500">批次全量可回查</span>
          </div>
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {user?.name.slice(0, 1)}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate max-w-[140px]">
                  {user?.name}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <RoleIcon className="w-3 h-3" />
                  {roleLabel}
                </div>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition', open && 'rotate-180')} />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 animate-fade-in overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    所属部门：{user?.department ?? '-'}
                  </div>
                </div>
                <div className="px-2 py-2 border-b border-slate-100">
                  <div className="text-[11px] text-slate-400 px-2 py-1">切换角色（演示用）</div>
                  <div className="grid grid-cols-3 gap-1 p-1">
                    <button
                      onClick={() => switchRole('MANAGEMENT')}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-medium transition',
                        user?.role === 'MANAGEMENT'
                          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <Shield className="w-3.5 h-3.5 mx-auto mb-1" />
                      管理层
                    </button>
                    <button
                      onClick={() => switchRole('EXECUTOR')}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-medium transition',
                        user?.role === 'EXECUTOR'
                          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <Wrench className="w-3.5 h-3.5 mx-auto mb-1" />
                      执行
                    </button>
                    <button
                      onClick={() => switchRole('REVIEWER')}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-medium transition',
                        user?.role === 'REVIEWER'
                          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <Eye className="w-3.5 h-3.5 mx-auto mb-1" />
                      复核
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setUser(null);
                      window.location.href = '/login';
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
