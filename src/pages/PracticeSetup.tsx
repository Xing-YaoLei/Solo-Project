import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import type { QuestionType } from '@/types/game';
import { QUESTIONS } from '@/mock/levels';
import {
  Home as HomeIcon, Play, Shuffle, Target, Clock, Layers, Zap, ChevronRight,
  BookOpen, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';

export default function PracticeSetup() {
  const navigate = useNavigate();
  const { startPractice } = useGameStore();

  const [types, setTypes] = useState<QuestionType[]>(['rule', 'evidence', 'settlement', 'compensation']);
  const [difficulty, setDifficulty] = useState<[number, number]>([1, 5]);
  const [maxQuestions, setMaxQuestions] = useState(6);

  const typeInfo: { k: QuestionType; n: string; i: string; c: string; desc: string }[] = [
    { k: 'rule', n: '补贴规则识别', i: '📜', c: 'from-indigo-500 to-purple-500', desc: '根据订单属性匹配适用的补贴规则' },
    { k: 'evidence', n: '申诉证据选择', i: '🔍', c: 'from-cyan-500 to-blue-500', desc: '从证据池中甄别有效的申诉材料' },
    { k: 'settlement', n: '结算明细排序', i: '📊', c: 'from-emerald-500 to-teal-500', desc: '按时间或逻辑顺序排列结算流水' },
    { k: 'compensation', n: '赔付记录处理', i: '💥', c: 'from-rose-500 to-orange-500', desc: '判定损坏原因并计算赔付金额' },
  ];

  const filtered = useMemo(() => {
    return QUESTIONS.filter(q =>
      types.includes(q.type) &&
      q.difficulty >= difficulty[0] &&
      q.difficulty <= difficulty[1]
    );
  }, [types, difficulty]);

  const typeDistribution = useMemo(() => {
    return types.map(t => ({
      type: t,
      count: filtered.filter(q => q.type === t).length,
      info: typeInfo.find(x => x.k === t)!,
    }));
  }, [types, filtered]);

  const expectedTime = Math.round(
    filtered.slice(0, Math.min(maxQuestions, filtered.length)).reduce((s, q) => s + q.timeLimit, 0) / 60
  );
  const expectedScore = filtered.slice(0, Math.min(maxQuestions, filtered.length)).reduce((s, q) => s + q.score, 0);

  const toggleType = (t: QuestionType) => {
    setTypes(prev => {
      if (prev.includes(t)) return prev.length === 1 ? prev : prev.filter(x => x !== t);
      return [...prev, t];
    });
  };

  const start = () => {
    startPractice({ types, difficulty });
    navigate('/game/practice');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <HomeIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Zap className="h-6 w-6 text-cyan-400 fill-cyan-400/20" />
                自由练习
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Free Practice Mode · 自定义题型与难度组合</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTypes(['rule', 'evidence', 'settlement', 'compensation']); setDifficulty([1, 5]); setMaxQuestions(6); }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 重置
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <h2 className="text-base font-black text-white">选择题型模块 <span className="text-xs text-slate-500 font-normal ml-1">（至少选一项）</span></h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {typeInfo.map(t => {
                  const active = types.includes(t.k);
                  const n = QUESTIONS.filter(q => q.type === t.k).length;
                  return (
                    <button
                      key={t.k}
                      onClick={() => toggleType(t.k)}
                      className={clsx(
                        'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all',
                        active
                          ? 'border-white/20 bg-slate-800/60 shadow-lg'
                          : 'border-white/5 bg-slate-900/40 hover:bg-slate-800/40 opacity-70'
                      )}
                    >
                      {active && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${t.c} opacity-10 transition-opacity`} />
                      )}
                      <div className="relative flex items-start gap-3">
                        <div className={clsx(
                          'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl border transition-all',
                          active ? `border-white/20 bg-gradient-to-br ${t.c} shadow-lg` : 'border-white/5 bg-slate-800/60'
                        )}>
                          {t.i}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-black text-white">{t.n}</h3>
                            <span className={clsx(
                              'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                              active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-700/60 text-slate-400 border border-white/5'
                            )}>
                              {active ? '✓ 已选' : '未选'} · {n}题
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                <h2 className="text-base font-black text-white">练习参数设置</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-400" />
                      难度范围
                    </label>
                    <span className="text-xs font-bold text-amber-300">
                      {'⭐'.repeat(difficulty[0])} ~ {'⭐'.repeat(difficulty[1])}
                      <span className="ml-2 text-slate-500 font-normal">({difficulty[0]} - {difficulty[1]})</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">最低难度</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={`min-${n}`}
                            onClick={() => setDifficulty([Math.min(n, difficulty[1]), difficulty[1]])}
                            className={clsx(
                              'flex-1 h-9 rounded-lg border text-xs font-black transition',
                              n === difficulty[0]
                                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                : n <= difficulty[1]
                                  ? 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                                  : 'border-white/5 bg-slate-900/40 text-slate-600 cursor-not-allowed'
                            )}
                          >
                            {'⭐'.repeat(n)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">最高难度</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={`max-${n}`}
                            onClick={() => setDifficulty([difficulty[0], Math.max(n, difficulty[0])])}
                            className={clsx(
                              'flex-1 h-9 rounded-lg border text-xs font-black transition',
                              n === difficulty[1]
                                ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                                : n >= difficulty[0]
                                  ? 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                                  : 'border-white/5 bg-slate-900/40 text-slate-600 cursor-not-allowed'
                            )}
                          >
                            {'⭐'.repeat(n)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-400" />
                      最大题目数量
                    </label>
                    <span className="text-xs font-bold text-indigo-300">最多 {maxQuestions} 题 · 题库 {filtered.length} 题可用</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[2, 3, 4, 5, 6, 8].map(n => (
                      <button
                        key={n}
                        onClick={() => setMaxQuestions(n)}
                        className={clsx(
                          'rounded-xl border px-4 py-2 text-sm font-black transition',
                          maxQuestions === n
                            ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/10'
                            : 'border-white/10 bg-slate-800/40 text-slate-300 hover:bg-slate-700/60'
                        )}
                      >
                        {n} 题
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:sticky lg:top-6 h-fit space-y-4">
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-slate-900/70 to-indigo-500/15 backdrop-blur p-6 shadow-2xl shadow-cyan-500/5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 mb-4">
                <Shuffle className="h-3.5 w-3.5 text-cyan-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-200">练习预览</span>
              </div>

              <h3 className="text-xl font-black text-white mb-4 leading-tight">本次练习配置</h3>

              <div className="space-y-2.5 mb-5">
                {typeDistribution.map(d => (
                  <div key={d.type} className="flex items-center gap-2">
                    <span className="text-lg">{d.info.i}</span>
                    <span className="flex-1 text-sm text-slate-300">{d.info.n}</span>
                    <span className="text-xs font-black text-white">
                      {Math.min(d.count, Math.max(1, Math.round(maxQuestions * (d.count / Math.max(1, filtered.length)))))}
                      <span className="text-slate-500 font-normal"> / {d.count}题</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> 题目总数</span>
                  <span className="text-lg font-black text-white">{Math.min(maxQuestions, filtered.length)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 预计时长</span>
                  <span className="text-lg font-black text-cyan-300">{Math.max(1, expectedTime)} <span className="text-xs font-normal text-slate-400">分钟</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Target className="h-3.5 w-3.5" /> 满分总分</span>
                  <span className="text-lg font-black text-amber-300">{expectedScore}<span className="text-xs font-normal text-slate-400"> 分</span></span>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
                <span className="text-cyan-300 font-bold">温馨提示：</span>
                自由练习模式题目会随机打乱顺序，成绩不会计入训练记录和徽章系统。
              </p>

              <button
                onClick={start}
                disabled={filtered.length === 0 || types.length === 0}
                className={clsx(
                  'mt-5 w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white shadow-xl transition-all',
                  filtered.length === 0 || types.length === 0
                    ? 'cursor-not-allowed bg-slate-700/60 text-slate-500'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 active:translate-y-0'
                )}
              >
                <Shuffle className="h-4 w-4" />
                开始随机练习
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5 text-xs text-slate-400 leading-relaxed">
              <p className="font-bold text-slate-300 mb-2">💡 自由练习使用技巧</p>
              <ul className="space-y-1.5 list-disc list-inside opacity-80">
                <li>单项集中突破：只选择薄弱题型</li>
                <li>由易到难进阶：先将难度调到1-2热身</li>
                <li>模拟真实考核：开启全部题型和全难度</li>
                <li>练习时可随时查看正确答案解析</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
