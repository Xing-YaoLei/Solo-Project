import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/mock/levels';
import { ConfigStorage } from '@/utils/storage';
import type { Level, QuestionType } from '@/types/game';
import type { Question } from '@/types/game';
import { QUESTIONS } from '@/mock/levels';
import {
  Play, Home as HomeIcon, Star, Trophy, Lock, Unlock, ChevronRight, Zap, Clock,
  Target, Layers, BookOpen, Filter
} from 'lucide-react';
import { clsx } from 'clsx';

type FilterType = 'all' | 'unlocked' | 'completed' | 'locked';

export default function LevelSelect() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>(LEVELS);
  const [filter, setFilter] = useState<FilterType>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const sl = ConfigStorage.getLevels<Level[] | null>(null);
    if (sl && sl.length > 0) setLevels(sl);
  }, []);

  const typeLabel: Record<QuestionType, { n: string; i: string; c: string }> = {
    rule: { n: '规则识别', i: '📜', c: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' },
    evidence: { n: '证据选择', i: '🔍', c: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' },
    settlement: { n: '结算排序', i: '📊', c: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
    compensation: { n: '赔付判定', i: '💥', c: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
  };

  const getLevelQuestions = (l: Level): Question[] => {
    return l.questionIds.map(id => QUESTIONS.find(q => q.id === id)).filter(Boolean) as Question[];
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return levels;
    if (filter === 'unlocked') return levels.filter(l => l.unlocked);
    if (filter === 'completed') return levels.filter(l => l.completed);
    if (filter === 'locked') return levels.filter(l => !l.unlocked);
    return levels;
  }, [levels, filter]);

  const stats = useMemo(() => ({
    total: levels.length,
    unlocked: levels.filter(l => l.unlocked).length,
    completed: levels.filter(l => l.completed).length,
    stars: levels.reduce((s, l) => s + l.stars, 0),
    maxStars: levels.length * 3,
  }), [levels]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <HomeIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white">关卡选择</h1>
              <p className="text-xs text-slate-400 mt-0.5">Level Training Center · 循序渐进式能力训练</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { k: 'all', n: '全部' },
              { k: 'unlocked', n: '已解锁' },
              { k: 'completed', n: '已通关' },
              { k: 'locked', n: '未解锁' },
            ] as { k: FilterType; n: string }[]).map(f => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={clsx(
                  'rounded-xl border px-3.5 py-1.5 text-xs font-bold transition',
                  filter === f.k
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                {f.n}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '总关卡', v: stats.total, i: Layers, c: 'from-indigo-500/20' },
            { label: '已解锁', v: `${stats.unlocked}/${stats.total}`, i: Unlock, c: 'from-cyan-500/20' },
            { label: '已通关', v: stats.completed, i: Trophy, c: 'from-emerald-500/20' },
            { label: '总星数', v: `${stats.stars}/${stats.maxStars}`, i: Star, c: 'from-amber-500/20' },
          ].map(s => {
            const Icon = s.i;
            return (
              <div key={s.label} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${s.c} to-slate-900/50 p-4`}>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Icon className="h-3.5 w-3.5" />{s.label}
                </div>
                <p className="mt-2 text-2xl font-black text-white">{s.v}</p>
              </div>
            );
          })}
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 py-16 text-center">
            <Filter className="mx-auto h-10 w-10 text-slate-500 mb-3" />
            <p className="text-sm text-slate-400">当前筛选条件下暂无关卡</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((l, idx) => {
              const locked = !l.unlocked;
              const qs = getLevelQuestions(l);
              const typeCounts = qs.reduce<Record<string, number>>((acc, q) => {
                acc[q.type] = (acc[q.type] || 0) + 1;
                return acc;
              }, {});
              const progressPct = l.totalScore ? Math.min(100, (l.bestScore / l.totalScore) * 100) : 0;
              return (
                <div
                  key={l.id}
                  onMouseEnter={() => setHoveredId(l.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={clsx(
                    'group relative overflow-hidden rounded-3xl border p-6 transition-all',
                    locked
                      ? 'border-white/5 bg-slate-900/40 opacity-75'
                      : 'border-white/10 bg-slate-900/70 backdrop-blur hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20'
                  )}
                >
                  {!locked && (
                    <div
                      className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-30"
                      style={{ background: l.color }}
                    />
                  )}
                  {locked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent backdrop-blur-[2px] pointer-events-none" />
                  )}

                  <div className="relative flex items-start gap-4">
                    <div
                      className={clsx(
                        'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg border',
                        locked ? 'border-white/5 bg-slate-800/60' : 'border-white/10'
                      )}
                      style={{ background: locked ? undefined : `linear-gradient(135deg, ${l.color}45, ${l.color}15)` }}
                    >
                      {locked ? <Lock className="h-7 w-7 text-slate-500" /> : l.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">LEVEL {idx + 1}</p>
                          <h3 className="text-lg font-black text-white leading-tight mt-0.5">{l.name}</h3>
                        </div>
                        <span className="flex-shrink-0 text-xs text-amber-400">{'⭐'.repeat(l.difficulty)}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2">{l.description}</p>
                    </div>
                  </div>

                  <div className="relative mt-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">历史最佳</span>
                      <span className="text-xs font-bold text-white">
                        {l.bestScore}<span className="text-slate-500"> / {l.totalScore}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
                      <div
                        className="h-full transition-all duration-700 rounded-full"
                        style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${l.color}, #fff3)` }}
                      />
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center gap-1">
                    {[1, 2, 3].map(n => (
                      <Star
                        key={n}
                        className={clsx(
                          'h-6 w-6 transition-all',
                          n <= l.stars
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            : 'text-slate-700'
                        )}
                      />
                    ))}
                    <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{qs.length}题</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />
                        {Math.round(qs.reduce((s, q) => s + q.timeLimit, 0) / 60)}分
                      </span>
                      <span className="inline-flex items-center gap-1"><Target className="h-3 w-3" />满分{l.totalScore}</span>
                    </div>
                  </div>

                  {!locked && (
                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {Object.entries(typeCounts).map(([t, n]) => {
                        const info = typeLabel[t as QuestionType];
                        return (
                          <span key={t} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${info.c}`}>
                            <span>{info.i}</span>{info.n} ×{n}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {locked && idx > 0 ? (
                    <p className="relative mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-200 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                      完成「{levels[idx - 1]?.name}」并获得 1 星以上即可解锁
                    </p>
                  ) : locked ? (
                    <p className="relative mt-5 rounded-xl border border-slate-500/20 bg-slate-800/40 px-3 py-2.5 text-[11px] text-slate-400 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                      请联系管理员或城市经理开通权限
                    </p>
                  ) : (
                    <button
                      onClick={() => navigate(`/game/level/${l.id}`)}
                      className="relative mt-5 w-full flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                      style={{
                        background: `linear-gradient(135deg, ${l.color}, ${l.color}cc)`,
                        boxShadow: `0 10px 30px -10px ${l.color}70`,
                      }}
                    >
                      <Play className="h-4 w-4 fill-white" />
                      {l.completed ? '再次挑战' : l.bestScore > 0 ? '继续训练' : '开始训练'}
                      <ChevronRight className={`h-4 w-4 transition-transform ${hoveredId === l.id ? 'translate-x-0.5' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
