import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecordStore, useConfigStore } from '@/stores';
import type { TrainingRecord } from '@/types/record';
import {
  Home as HomeIcon, Trophy, Star, Clock, Target, TrendingUp, Search, Filter, ChevronRight,
  Calendar, BarChart3, Eye, Award, Zap, Users, AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function RecordsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlightId = params.get('highlight');

  const { records, loadAll } = useRecordStore();
  const { levels } = useConfigStore();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'level' | 'practice'>('all');
  const [showDetail, setShowDetail] = useState<TrainingRecord | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (highlightId && records?.length) {
      const found = records.find(r => r.id === highlightId);
      if (found) setTimeout(() => setShowDetail(found), 300);
    }
  }, [highlightId, records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    let rs = [...records];
    if (filterMode !== 'all') rs = rs.filter(r => r.mode === filterMode);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rs = rs.filter(r => r.levelName.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q));
    }
    return rs.sort((a, b) => b.createdAt - a.createdAt);
  }, [records, filterMode, search]);

  const summary = useMemo(() => {
    if (!records || records.length === 0) return { total: 0, avgAcc: 0, avgDur: 0, totalStars: 0, totalPoints: 0 };
    return {
      total: records.length,
      avgAcc: records.reduce((s, r) => s + r.accuracy, 0) / records.length,
      avgDur: records.reduce((s, r) => s + r.totalDuration, 0) / records.length,
      totalStars: records.reduce((s, r) => s + r.stars, 0),
      totalPoints: records.reduce((s, r) => s + r.rewardPoints, 0),
    };
  }, [records]);

  const accuracyChartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return [...records]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-14)
      .map((r, i) => ({
        idx: i + 1,
        date: new Date(r.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        正确率: Math.round(r.accuracy * 100),
        得分: r.score,
        level: r.levelName.slice(0, 6),
      }));
  }, [records]);

  const phaseChartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    const phases: Record<string, number> = { rule: 0, evidence: 0, settlement: 0, compensation: 0 };
    records.forEach(r => {
      Object.entries(r.phaseDurations || {}).forEach(([k, v]) => {
        if (k in phases) phases[k] += v as number;
      });
    });
    const labels: Record<string, string> = { rule: '规则识别', evidence: '证据选择', settlement: '结算排序', compensation: '赔付判定' };
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f97316'];
    return Object.entries(phases).map(([k, v], i) => ({
      name: labels[k] || k,
      value: Math.round(v),
      fill: colors[i],
    })).filter(d => d.value > 0);
  }, [records]);

  const durationDistribution = useMemo(() => {
    if (!records || records.length === 0) return [];
    const buckets = [
      { range: '0-2分', min: 0, max: 120, count: 0 },
      { range: '2-5分', min: 120, max: 300, count: 0 },
      { range: '5-10分', min: 300, max: 600, count: 0 },
      { range: '10分+', min: 600, max: Infinity, count: 0 },
    ];
    records.forEach(r => buckets.forEach(b => {
      if (r.totalDuration >= b.min && r.totalDuration < b.max) b.count++;
    }));
    return buckets.map(b => ({ 时长区间: b.range, 训练次数: b.count }));
  }, [records]);

  const fmtDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m > 0 ? `${m}分${sec}秒` : `${sec}秒`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/15 to-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 mb-7 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <HomeIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-400" />训练记录
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Training Records · 复盘你的学习轨迹</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索关卡名称..."
                className="w-48 rounded-xl border border-white/10 bg-slate-900/60 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/40 transition"
              />
            </div>
            {(['all', 'level', 'practice'] as const).map(m => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={clsx(
                  'rounded-xl border px-3 py-2 text-xs font-bold transition',
                  filterMode === m
                    ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                    : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                {m === 'all' ? '全部' : m === 'level' ? '关卡模式' : '自由练习'}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { l: '训练总次数', v: summary.total, u: '次', i: BarChart3, c: 'text-indigo-400', g: 'from-indigo-500/20' },
            { l: '平均正确率', v: `${(summary.avgAcc * 100).toFixed(0)}`, u: '%', i: Target, c: 'text-emerald-400', g: 'from-emerald-500/20' },
            { l: '平均用时', v: Math.floor(summary.avgDur / 60), u: '分', i: Clock, c: 'text-cyan-400', g: 'from-cyan-500/20' },
            { l: '累计星数', v: summary.totalStars, u: '★', i: Star, c: 'text-amber-400', g: 'from-amber-500/20' },
            { l: '奖励积分', v: summary.totalPoints, u: 'pt', i: Zap, c: 'text-rose-400', g: 'from-rose-500/20' },
          ].map(s => {
            const Ic = s.i;
            return (
              <div key={s.l} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${s.g} to-slate-900/50 p-4`}>
                <Ic className={`absolute right-3 top-3 h-6 w-6 opacity-20 ${s.c}`} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.l}</p>
                <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                  {s.v}<span className="ml-0.5 text-xs text-slate-500 font-normal">{s.u}</span>
                </p>
              </div>
            );
          })}
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">正确率与得分趋势 <span className="text-xs text-slate-500 font-normal">(最近 {accuracyChartData.length} 次)</span></h3>
            </div>
            {accuracyChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyChartData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4 }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="正确率" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="得分" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyHint />}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white">阶段耗时分布</h3>
              </div>
              {phaseChartData.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={phaseChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={65} dataKey="value" strokeWidth={2} stroke="#0f172a">
                        {phaseChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyHint small />}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {phaseChartData.map(d => (
                  <span key={d.name} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-white/5">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                    {d.name} {d.value}s
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-black text-white">派单时长分布</h3>
              </div>
              {durationDistribution.some(d => d.训练次数 > 0) ? (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={durationDistribution} margin={{ top: 4, right: 8, bottom: -20, left: -24 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="时长区间" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="训练次数" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyHint small />}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />历史训练列表
              <span className="text-xs text-slate-500 font-normal">({filtered.length} 条记录)</span>
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />按时间倒序
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16">
              <EmptyHint title="暂无训练记录" desc="完成至少一个关卡训练后，训练记录会显示在这里" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(r => {
                const level = levels?.find(l => l.id === r.levelId);
                const hl = highlightId === r.id;
                return (
                  <div
                    key={r.id}
                    className={clsx(
                      'flex items-center gap-3 px-5 py-3.5 transition-all',
                      hl ? 'bg-amber-500/10 ring-1 ring-amber-400/20' : 'hover:bg-white/5'
                    )}
                  >
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl border border-white/10"
                      style={{ background: level ? `linear-gradient(135deg, ${level.color}35, ${level.color}10)` : '#0f172a' }}
                    >
                      {level?.icon || r.mode === 'practice' ? '🎲' : '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{r.levelName}</p>
                        <span className={clsx(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold border',
                          r.mode === 'level'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30'
                        )}>
                          {r.mode === 'level' ? '关卡' : '练习'}
                        </span>
                        {[1, 2, 3].map(n => (
                          <Star
                            key={n}
                            className={clsx(
                              'h-3.5 w-3.5',
                              n <= r.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{r.userName}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.createdAt).toLocaleDateString('zh-CN')} {new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />派单 {fmtDur(r.dispatchDuration)}</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-5">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">得分</p>
                        <p className="text-sm font-black text-white">{r.score}<span className="text-slate-500 text-xs font-normal">/{r.totalScore}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">正确率</p>
                        <p className={clsx(
                          'text-sm font-black',
                          r.accuracy >= 0.8 ? 'text-emerald-300' : r.accuracy >= 0.6 ? 'text-amber-300' : 'text-rose-300'
                        )}>{(r.accuracy * 100).toFixed(0)}%</p>
                      </div>
                      {r.rewardPoints > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">奖励</p>
                          <p className="text-sm font-black text-amber-300">+{r.rewardPoints}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowDetail(r)}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 hover:from-indigo-500/30 hover:to-cyan-500/30 border border-cyan-400/20 px-3 py-2 text-xs font-bold text-cyan-200 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />复盘
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {showDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowDetail(null)}>
            <div
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/98 via-indigo-950/30 to-slate-900/98 shadow-2xl animate-in fade-in zoom-in-95"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-900/95 backdrop-blur px-6 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">训练复盘</p>
                  <h3 className="text-xl font-black text-white mt-0.5">{showDetail.levelName}</h3>
                </div>
                <button onClick={() => setShowDetail(null)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 transition">
                  关闭
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="最终得分" value={`${showDetail.score}/${showDetail.totalScore}`} icon={Trophy} c="text-indigo-300" />
                  <Stat label="正确率" value={`${(showDetail.accuracy * 100).toFixed(0)}%`} icon={Target} c="text-emerald-300" />
                  <Stat label="派单总时长" value={fmtDur(showDetail.dispatchDuration)} icon={Clock} c="text-cyan-300" />
                  <Stat label="奖励积分" value={`+${showDetail.rewardPoints}`} icon={Zap} c="text-amber-300" />
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> 各阶段耗时
                  </h4>
                  <div className="rounded-2xl border border-white/10 bg-slate-800/30 p-3 space-y-2">
                    {Object.entries(showDetail.phaseDurations || {}).map(([p, d]) => {
                      const labels: Record<string, { n: string; c: string }> = {
                        rule: { n: '补贴规则识别', c: 'bg-indigo-500' },
                        evidence: { n: '申诉证据选择', c: 'bg-cyan-500' },
                        settlement: { n: '结算明细排序', c: 'bg-emerald-500' },
                        compensation: { n: '赔付记录处理', c: 'bg-rose-500' },
                        result: { n: '结算阶段', c: 'bg-amber-500' },
                      };
                      const info = labels[p] || { n: p, c: 'bg-slate-500' };
                      const pct = showDetail.totalDuration > 0 ? (((d as number) / showDetail.totalDuration) * 100) : 0;
                      return (
                        <div key={p} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 font-bold">{info.n}</span>
                            <span className="text-slate-400">{fmtDur(d as number)} · {pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
                            <div className={`${info.c} h-full rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" /> 逐题明细
                  </h4>
                  <div className="space-y-2">
                    {showDetail.questionResults.map((qr, i) => (
                      <div key={qr.questionId} className={clsx(
                        'flex items-start gap-3 rounded-xl border p-3',
                        qr.isCorrect ? 'border-emerald-400/20 bg-emerald-500/8' : 'border-rose-400/20 bg-rose-500/8'
                      )}>
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-xs font-black text-white">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-white truncate">{qr.title}</p>
                            <span className={clsx(
                              'rounded-full px-1.5 py-0.5 text-[9px] font-black',
                              qr.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            )}>
                              {qr.isCorrect ? '✓ 正确' : '✗ 错误'} · {qr.scoreEarned}/{qr.maxScore}分
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                            <span>题型: {qr.questionType === 'rule' ? '规则' : qr.questionType === 'evidence' ? '证据' : qr.questionType === 'settlement' ? '排序' : '赔付'}</span>
                            <span>用时: {qr.timeSpent.toFixed(1)}s</span>
                          </div>
                          {qr.errorAnalysis && (
                            <p className="mt-1.5 rounded-md bg-black/20 px-2 py-1 text-[10px] text-rose-300 border border-rose-400/10">
                              💡 失分分析: {qr.errorAnalysis}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyHint({ title = '暂无数据', desc = '完成训练后将显示数据分析图表', small }: { title?: string; desc?: string; small?: boolean }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center', small ? 'py-6' : 'py-10')}>
      <AlertCircle className={clsx(small ? 'h-6 w-6' : 'h-8 w-8', 'text-slate-600 mb-2')} />
      <p className={clsx(small ? 'text-xs' : 'text-sm', 'font-bold text-slate-400')}>{title}</p>
      {!small && <p className="mt-1 text-xs text-slate-500 max-w-xs">{desc}</p>}
    </div>
  );
}

function Stat({ label, value, icon: Ic, c }: { label: string; value: string; icon: any; c: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
        <Ic className={`h-3 w-3 ${c}`} />{label}
      </div>
      <p className={`mt-1 text-lg font-black ${c}`}>{value}</p>
    </div>
  );
}
