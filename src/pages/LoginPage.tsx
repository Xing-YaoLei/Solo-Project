import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { cn } from '@/lib/utils';
import { Shield, User as UserIcon, Lock, ChevronRight } from 'lucide-react';

type UserRole = 'store_manager' | 'region_ops' | 'risk_admin' | 'management';

const ROLE_OPTIONS: { key: UserRole; label: string; desc: string }[] = [
  { key: 'store_manager', label: '门店店长', desc: '负责单店日常运营' },
  { key: 'region_ops', label: '区域运营', desc: '管辖区域内多家门店' },
  { key: 'risk_admin', label: '风控管理员', desc: '全局风险监控与规则' },
  { key: 'management', label: '总部管理层', desc: '全国运营数据总览' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('risk_admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setTimeout(() => {
      login(
        {
          id: `u-${Date.now()}`,
          name: name.trim(),
          role,
          storeId: role === 'store_manager' ? 's1' : undefined,
        },
        `mock-token-${Date.now()}`
      );
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-surface text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden border border-surface-border shadow-2xl">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-500/20 via-surface-elevated to-surface-elevated border-r border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-blue">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-white leading-tight">过户材料</div>
              <div className="font-display font-bold text-lg text-white leading-tight">风控监测系统</div>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="font-display text-3xl font-bold text-white leading-snug">
              让每台二手车的<br />过户材料都可追溯
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              实时监控门店过户材料齐备情况，智能识别风险，加速周转，降低合规风险。
            </p>

            <ul className="space-y-2.5 text-xs text-slate-400">
              {[
                '8 家门店 30 台车辆实时监测',
                '6 类材料 × 6 阶段矩阵分析',
                '规则引擎动态预警，钉钉/企微推送',
                '一键导出复盘 PDF/Excel 报告',
              ].map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[11px] text-slate-500">© 2026 过户材料风控监测 · Demo 版本</div>
        </div>

        <div className="bg-surface-elevated/80 backdrop-blur-xl p-8 lg:p-10">
          <div className="max-w-sm mx-auto">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-blue">
                <Shield size={18} className="text-white" />
              </div>
              <div className="font-display font-bold text-white">过户材料风控监测</div>
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-1">欢迎登录</h3>
            <p className="text-sm text-slate-500 mb-7">请选择角色并输入用户名开始体验</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">选择角色</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRole(opt.key)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all',
                        role === opt.key
                          ? 'bg-brand-500/15 border-brand-500/30 shadow-glow-blue/30'
                          : 'bg-surface/40 border-surface-border hover:bg-surface/60 hover:border-white/10'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                          role === opt.key ? 'border-brand-500' : 'border-slate-600'
                        )}
                      >
                        {role === opt.key && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">用户名</label>
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入您的姓名"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface/60 border border-surface-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40 focus:bg-surface transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">演示密码 (任意)</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    defaultValue="demo123"
                    placeholder="演示环境无需填写"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface/60 border border-surface-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40 focus:bg-surface transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className={cn(
                  'w-full h-11 rounded-xl text-sm font-semibold text-white transition-all inline-flex items-center justify-center gap-2',
                  name.trim() && !loading
                    ? 'bg-brand-500 hover:bg-brand-600 shadow-glow-blue'
                    : 'bg-brand-500/40 cursor-not-allowed'
                )}
              >
                {loading ? '登录中...' : '登录系统'}
                {!loading && <ChevronRight size={16} />}
              </button>
            </form>

            <div className="mt-6 text-[11px] text-slate-500 text-center leading-relaxed">
              登录即代表同意《服务协议》与《隐私政策》<br />
              本演示版本数据均为前端 Mock 生成
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
