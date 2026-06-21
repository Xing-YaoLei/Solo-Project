import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { useRecordStore } from '@/stores/recordStore';
import { LEVELS } from '@/mock/levels';
import { RecordStorage, ConfigStorage, UserStorage } from '@/utils/storage';
import type { Level, TrainingRecord } from '@/types';
import {
  Play, Trophy, Star, Map as MapIcon, Award, BookOpen, Layers, Users,
  Settings, ChevronRight, TrendingUp, Clock, Target, Zap, Sparkles, GraduationCap, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Home() {
  const navigate = useNavigate();
  const { loadAll: loadRecords, records } = useRecordStore();
  const [savedLevels, setSavedLevels] = useState<Level[]>(LEVELS);
  const [bestRecord, setBestRecord] = useState<TrainingRecord | null>(null);

  const user = UserStorage.CURRENT_USER;

  useEffect(() => {
    loadRecords();
    const sl = ConfigStorage.getLevels<Level[] | null>(null);
    if (sl && sl.length > 0) setSavedLevels(sl);
  }, [loadRecords]);

  useEffect(() => {
    if (records && records.length > 0) {
      const sorted = [...records].sort((a, b) => b.accuracy - a.accuracy || b.score - a.score);
      setBestRecord(sorted[0]);
    }
  }, [records]);

  const stats = useMemo(() => {
    if (!records || records.length === 0) return { total: 0, avgAcc: 0, totalTime: 0, completedCount: 0 };
    const total = records.length;
    const avgAcc = records.reduce((s, r) => s + r.accuracy, 0) / total;
    const totalTime = records.reduce((s, r) => s + r.totalDuration, 0);
    const completedCount = savedLevels.filter(l => l.completed).length;
    return { total, avgAcc, totalTime, completedCount };
  }, [records, savedLevels]);

  const unlockedLevels = savedLevels.filter(l => l.unlocked);
  const continueLevel = useMemo(() => {
    const notCompleted = unlockedLevels.find(l => !l.completed);
    return notCompleted || unlockedLevels[unlockedLevels.length - 1] || savedLevels[0];
  }, [unlockedLevels, savedLevels]);

  const quickActions = [
    { id: 'levels', label: '关卡模式', icon: MapIcon, color: 'from-indigo-500 to-purple-500', desc: '循序渐进式训练' },
    { id: 'practice', label: '自由练习', icon: Zap, color: 'from-cyan-500 to-emerald-500', desc: '自定义题型组合' },
    { id: 'records', label: '训练记录', icon: Award, color: 'from-amber-500 to-orange-500', desc: '复盘学习轨迹' },
    { id: 'config', label: '配置管理', icon: Settings, color: 'from-rose-500 to-pink-500', desc: '题目与奖励配置' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20 text-2xl">
              🛵
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">跑腿补贴调度训练系统</h1>
              <p className="text-xs text-slate-400 mt-0.5">Paotui Subsidy & Dispatch Training Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 text-lg">
                {user.avatar || '👤'}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.role === 'manager' ? '城市经理' : '训练学员'}</p>
              </div>
            </div>
            {user.role === 'manager' && (
              <button
                onClick={() => navigate('/config')}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <Settings className="h-3.5 w-3.5" />配置中心
              </button>
            )}
          </div>
        </header>

        <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-slate-900/60 to-cyan-600/20 p-6 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-60 pointer-events-none">
            <div className="absolute right-6 top-6 text-[140px] sm:text-[200px] leading-none select-none">
              🛍️
            </div>
          </div>
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-200">岗位能力训练 · 沉浸式3D教学</span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-black text-white leading-[1.05] tracking-tight">
              从补贴识别到赔付判定
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                一站式调度能力训练
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              围绕真实运营场景设计四大题型：补贴规则匹配、申诉证据筛选、结算明细排序、物品损坏赔付判定。3D 城市地图沉浸式体验，数据化复盘助力快速成长。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {continueLevel && (
                <button
                  onClick={() => navigate(`/game/level/${continueLevel.id}`)}
                  className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-cyan-500/25 transition hover:shadow-cyan-500/50 hover:-translate-y-0.5"
                >
                  <Play className="h-5 w-5 fill-white" />
                  {continueLevel.completed ? '继续挑战更高难度' : `继续：${continueLevel.name}`}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
              <button
                onClick={() => navigate('/levels')}
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <Layers className="h-4 w-4" />全部关卡
              </button>
            </div>
          </div>
        </section>

        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: '累计训练', value: stats.total, unit: '次', icon: BookOpen, color: 'text-indigo-400', bg: 'from-indigo-500/15' },
            { label: '平均正确率', value: (stats.avgAcc * 100).toFixed(0), unit: '%', icon: Target, color: 'text-emerald-400', bg: 'from-emerald-500/15' },
            { label: '训练总时长', value: Math.floor(stats.totalTime / 60), unit: '分', icon: Clock, color: 'text-cyan-400', bg: 'from-cyan-500/15' },
            { label: '通关关卡', value: `${stats.completedCount}/${savedLevels.length}`, unit: '', icon: Trophy, color: 'text-amber-400', bg: 'from-amber-500/15' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${s.bg} to-slate-900/50 p-4 sm:p-5`}>
                <Icon className={`absolute right-3 top-3 h-7 w-7 opacity-20 ${s.color}`} />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</span>
                  {s.unit && <span className="text-xs text-slate-500">{s.unit}</span>}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-cyan-400" /> 四大训练模块
            </h3>
            <p className="text-xs text-slate-400">覆盖运营全流程补贴判断</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(a => {
              const Icon = a.icon;
              const goTo = () => {
                if (a.id === 'practice') navigate('/practice');
                else if (a.id === 'records') navigate('/records');
                else if (a.id === 'config') navigate('/config');
                else navigate('/levels');
              };
              return (
                <button
                  key={a.id}
                  onClick={goTo}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5 text-left transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20"
                >
                  <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${a.color} opacity-10 blur-2xl transition-opacity group-hover:opacity-30`} />
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} shadow-lg mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-base font-black text-white">{a.label}</h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{a.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                    立即进入 <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-indigo-400" />关卡进度
              </h3>
              <button onClick={() => navigate('/levels')} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                查看全部 <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {savedLevels.map((l, idx) => (
                <div
                  key={l.id}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl border p-3 transition',
                    l.unlocked
                      ? 'border-white/10 bg-slate-800/40 hover:bg-slate-800/70'
                      : 'border-white/5 bg-slate-900/40 opacity-60'
                  )}
                >
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl border border-white/10"
                    style={{ background: l.unlocked ? `linear-gradient(135deg, ${l.color}35, ${l.color}10)` : '#0f172a' }}
                  >
                    {l.unlocked ? l.icon : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white truncate">{l.name}</p>
                      <span className="text-[10px] text-slate-500">{'⭐'.repeat(l.difficulty)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {l.stars}/3</span>
                      <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3 text-emerald-400" /> 最佳 {l.bestScore}</span>
                    </div>
                  </div>
                  <div className="flex h-2 w-28 flex-shrink-0 overflow-hidden rounded-full bg-slate-700/50">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${l.unlocked ? Math.min(100, (l.bestScore / (l.totalScore || 1)) * 100) : 0}%`, background: l.color }}
                    />
                  </div>
                  {l.unlocked && (
                    <button
                      onClick={() => navigate(`/game/level/${l.id}`)}
                      className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-bold text-white transition"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      {idx === 0 && l.bestScore === 0 ? '开始' : l.completed ? '复习' : '继续'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-indigo-500/10 backdrop-blur p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-black text-white">历史最佳表现</h3>
            </div>
            {bestRecord ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                  <p className="text-xs font-bold text-amber-300 truncate">{bestRecord.levelName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(bestRecord.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-800/40 py-2">
                    <p className="text-xl font-black text-white">{bestRecord.score}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">得分</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 py-2">
                    <p className="text-xl font-black text-emerald-300">{(bestRecord.accuracy * 100).toFixed(0)}%</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">正确率</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 py-2">
                    <p className="text-xl font-black text-amber-300">{bestRecord.stars}★</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">评级</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/records?highlight=${bestRecord.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  <Users className="h-3.5 w-3.5" />查看详细复盘
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-5xl mb-3">🎯</div>
                <p className="text-sm font-bold text-white">还没有训练记录</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px]">完成第一个关卡，解锁你的最佳成绩与能力徽章</p>
                <button
                  onClick={() => navigate('/levels')}
                  className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-500/20"
                >
                  立即开始第一次训练
                </button>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-14 pt-6 border-t border-white/5 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} 跑腿补贴调度训练系统 · 专为城市运营团队打造的沉浸式岗位训练平台
        </footer>
      </div>
    </div>
  );
}
