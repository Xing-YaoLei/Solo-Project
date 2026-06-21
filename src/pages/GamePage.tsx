import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { HudPanel } from '@/components/game/HudPanel';
import { RuleMatcher } from '@/components/game/RuleMatcher';
import { EvidenceSelector } from '@/components/game/EvidenceSelector';
import { SettlementSorter } from '@/components/game/SettlementSorter';
import { CompensationHandler } from '@/components/game/CompensationHandler';
import { CityScene } from '@/three/CityScene';
import { useGameStore } from '@/stores/gameStore';
import { RecordStorage } from '@/utils/storage';
import type { TrainingRecord } from '@/types/record';
import type { Question, RuleQuestion, EvidenceQuestion, SettlementQuestion, CompensationQuestion, GamePhase, UserAnswer } from '@/types/game';
import {
  Play, Trophy, Star, Home as HomeIcon, ChevronRight, Sparkle, Clock, Target, Award, TrendingUp,
  AlertCircle, CheckCircle2, XCircle, RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';

type GamePageMode = 'level' | 'practice';

export default function GamePage() {
  const navigate = useNavigate();
  const params = useParams();
  const mode = (params.mode as GamePageMode) || 'level';
  const levelId = params.levelId;

  const {
    phase, currentLevel, score, questions, currentQuestionIndex, answers, mode: storeMode,
    startLevel, startPractice, submitAnswer, nextPhase, finishGame, resetGame,
  } = useGameStore();

  const [resultRecord, setResultRecord] = useState<TrainingRecord | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<{ qid: string; correct: boolean; earned: number; max: number } | null>(null);

  useEffect(() => {
    if (mode === 'level' && levelId) {
      startLevel(levelId);
    } else if (mode === 'practice') {
      startPractice({ types: ['rule', 'evidence', 'settlement', 'compensation'], difficulty: [1, 5] });
    }
    return () => {
      resetGame();
    };
  }, [mode, levelId, startLevel, startPractice, resetGame]);

  const currentQuestion: Question | undefined = questions[currentQuestionIndex];
  const totalScore = useMemo(() => questions.reduce((s, q) => s + q.score, 0), [questions]);
  const answeredKeys = Object.keys(answers);
  const correctCount = answeredKeys.filter(k => answers[k]?.isCorrect).length;

  const handleSubmit = (payload: string[] | string | { causeId: string; amount: string }) => {
    if (!currentQuestion) return;

    let answer: UserAnswer['answer'];
    if (currentQuestion.type === 'compensation' && typeof payload === 'object' && !Array.isArray(payload)) {
      answer = [payload.causeId, payload.amount];
    } else {
      answer = payload as UserAnswer['answer'];
    }

    submitAnswer(answer);

    const ans = answers[currentQuestion.id] || useGameStore.getState().answers[currentQuestion.id];
    if (ans) {
      setJustSubmitted({ qid: currentQuestion.id, correct: ans.isCorrect, earned: ans.scoreEarned, max: currentQuestion.score });
    }
    setTimeout(() => setJustSubmitted(null), 1500);

    setTimeout(() => {
      if (currentQuestionIndex + 1 >= questions.length) {
        const rec = finishGame();
        if (rec) setResultRecord(rec);
      } else {
        nextPhase();
      }
    }, 1200);
  };

  const isAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950 text-slate-100">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [30, 28, 32], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0b1120']} />
        <fog attach="fog" args={['#0b1120', 40, 110]} />

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <pointLight position={[-15, 15, -10]} intensity={0.6} color="#6366f1" distance={60} />
        <pointLight position={[15, 12, 15]} intensity={0.5} color="#f97316" distance={50} />

        <Stars radius={150} depth={60} count={2500} factor={3.5} saturation={0.3} fade speed={0.5} />

        <Physics gravity={[0, -9.81, 0]} paused debug={false}>
          <CityScene />
        </Physics>

        <Sparkles count={40} scale={[80, 30, 80]} size={2} speed={0.3} opacity={0.4} color="#818cf8" />

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={18}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>

      <HudPanel
        questionTimeLimit={currentQuestion?.timeLimit}
        onQuit={() => navigate('/levels')}
      />

      {phase !== 'intro' && phase !== 'result' && currentQuestion && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center p-4 pb-20 sm:p-6 sm:pb-24">
          <div className="pointer-events-auto relative w-full max-w-7xl h-[72vh] max-h-[780px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/75 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/5 pointer-events-none" />

            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-slate-900/50 to-cyan-500/10 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 border border-white/10">
                    <span className="text-lg">
                      {phase === 'rule' ? '📜' : phase === 'evidence' ? '🔍' : phase === 'settlement' ? '📊' : '💥'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{currentQuestion.title}</p>
                    <p className="text-[11px] text-slate-400">
                      第 <span className="text-white font-bold">{currentQuestionIndex + 1}</span> / {questions.length} 题 · 满分 <span className="text-amber-300 font-bold">{currentQuestion.score}</span> 分
                      {currentQuestion.hint && !justSubmitted && (
                        <span className="ml-3 text-cyan-300/80">💡 {currentQuestion.hint}</span>
                      )}
                    </p>
                  </div>
                </div>
                {justSubmitted && justSubmitted.qid === currentQuestion.id && (
                  <div className={clsx(
                    'flex items-center gap-2 rounded-xl border px-4 py-2 animate-in fade-in slide-in-from-right-4',
                    justSubmitted.correct
                      ? 'border-emerald-400/40 bg-emerald-500/15'
                      : 'border-rose-400/40 bg-rose-500/15'
                  )}>
                    {justSubmitted.correct
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <XCircle className="h-4 w-4 text-rose-400" />}
                    <span className={clsx(
                      'text-sm font-bold',
                      justSubmitted.correct ? 'text-emerald-300' : 'text-rose-300'
                    )}>
                      {justSubmitted.correct ? '回答正确！' : '回答有误'}
                      <span className="ml-2 text-white">+{justSubmitted.earned}</span>
                      <span className="text-slate-500">/{justSubmitted.max}分</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {phase === 'rule' && (
                  <RuleMatcher
                    question={currentQuestion as RuleQuestion}
                    onSubmit={(ids) => handleSubmit(ids)}
                    disabled={isAnswered}
                    preSelected={answers[currentQuestion.id]?.answer as string[]}
                  />
                )}
                {phase === 'evidence' && (
                  <EvidenceSelector
                    question={currentQuestion as EvidenceQuestion}
                    onSubmit={(ids) => handleSubmit(ids)}
                    disabled={isAnswered}
                    preSelected={answers[currentQuestion.id]?.answer as string[]}
                  />
                )}
                {phase === 'settlement' && (
                  <SettlementSorter
                    question={currentQuestion as SettlementQuestion}
                    onSubmit={(ids) => handleSubmit(ids)}
                    disabled={isAnswered}
                    preOrdered={answers[currentQuestion.id]?.answer as string[]}
                  />
                )}
                {phase === 'compensation' && (
                  <CompensationHandler
                    question={currentQuestion as CompensationQuestion}
                    onSubmit={(data) => handleSubmit(data)}
                    disabled={isAnswered}
                    preCauseId={(answers[currentQuestion.id]?.answer as string[])?.[0]}
                    preAmount={(answers[currentQuestion.id]?.answer as string[])?.[1]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'intro' && currentLevel && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-indigo-950/50 to-slate-900/95 p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-5">
              <div
                className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-4xl shadow-lg border border-white/10"
                style={{ background: `linear-gradient(135deg, ${currentLevel.color}40, ${currentLevel.color}15)` }}
              >
                {currentLevel.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-300/70 font-bold">
                  {storeMode === 'practice' ? '🎲 自由练习模式' : `第 ${questions.length} 关 · 难度 ${'⭐'.repeat(currentLevel.difficulty)}`}
                </p>
                <h1 className="mt-1 text-3xl font-black text-white leading-tight">
                  {currentLevel.name}
                </h1>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{currentLevel.description}</p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 text-center">
                <Target className="mx-auto mb-2 h-5 w-5 text-indigo-400" />
                <p className="text-2xl font-black text-white">{questions.length}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">题目总数</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 text-center">
                <Trophy className="mx-auto mb-2 h-5 w-5 text-amber-400" />
                <p className="text-2xl font-black text-white">{totalScore}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">满分总分</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 text-center">
                <Clock className="mx-auto mb-2 h-5 w-5 text-cyan-400" />
                <p className="text-2xl font-black text-white">
                  {Math.round(questions.reduce((s, q) => s + q.timeLimit, 0) / 60)}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">预计分钟</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-800/30 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">本题型分布</p>
              <div className="flex flex-wrap gap-2">
                {(['rule', 'evidence', 'settlement', 'compensation'] as GamePhase[]).map(p => {
                  const labels: Record<string, { n: string; i: string; c: string }> = {
                    rule: { n: '补贴规则识别', i: '📜', c: 'from-indigo-500/30' },
                    evidence: { n: '申诉证据选择', i: '🔍', c: 'from-cyan-500/30' },
                    settlement: { n: '结算明细排序', i: '📊', c: 'from-emerald-500/30' },
                    compensation: { n: '赔付记录处理', i: '💥', c: 'from-rose-500/30' },
                  };
                  const n = questions.filter(q => q.type === p).length;
                  if (n === 0) return null;
                  const l = labels[p];
                  return (
                    <span key={p} className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-gradient-to-r ${l.c} px-3 py-1.5 text-xs font-bold text-white`}>
                      <span>{l.i}</span>{l.n}<span className="ml-1 opacity-70">×{n}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                onClick={() => navigate('/levels')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-6 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                <HomeIcon className="h-4 w-4" />返回关卡
              </button>
              <button
                onClick={nextPhase}
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 px-6 py-3.5 text-base font-black text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="h-5 w-5 fill-white" />开始训练
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/98 via-indigo-950/40 to-slate-900/98 p-7 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-6">
            {resultRecord ? (
              <>
                <div className="text-center">
                  <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-4 py-1.5">
                    <Sparkle className="h-4 w-4 text-amber-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">训练完成</span>
                  </div>
                  <h1 className="mt-4 text-3xl sm:text-4xl font-black text-white">
                    {currentLevel?.icon} {currentLevel?.name}
                  </h1>

                  <div className="mt-6 flex items-center justify-center gap-2 text-4xl sm:text-5xl">
                    {[1, 2, 3].map(n => (
                      <Star
                        key={n}
                        className={clsx(
                          'h-14 w-14 sm:h-16 sm:w-16 drop-shadow-lg transition-all',
                          n <= resultRecord.stars
                            ? 'text-amber-400 fill-amber-400 animate-in zoom-in-50'
                            : 'text-slate-700'
                        )}
                        style={{ animationDelay: `${n * 80}ms` }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {resultRecord.stars === 3 ? '🎉 完美通关！' : resultRecord.stars === 2 ? '👍 表现不错！' : resultRecord.stars === 1 ? '💪 刚刚及格，继续努力！' : '📝 未达及格线，再接再厉'}
                  </p>
                </div>

                <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-slate-800/40 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-indigo-300/70 font-bold">获得得分</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-white">{resultRecord.score}</p>
                    <p className="text-[11px] text-slate-400">/ {resultRecord.totalScore}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/15 to-slate-800/40 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-emerald-300/70 font-bold">正确率</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-white">{(resultRecord.accuracy * 100).toFixed(0)}%</p>
                    <p className="text-[11px] text-slate-400">{correctCount} / {answeredKeys.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-slate-800/40 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-cyan-300/70 font-bold">派单总时长</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-white">
                      {Math.floor(resultRecord.dispatchDuration / 60)}:{String(Math.floor(resultRecord.dispatchDuration % 60)).padStart(2, '0')}
                    </p>
                    <p className="text-[11px] text-slate-400">分 : 秒</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/15 to-slate-800/40 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-amber-300/70 font-bold">奖励积分</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-white">+{resultRecord.rewardPoints}</p>
                    <p className="text-[11px] text-slate-400">points</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-800/30 p-4 max-h-64 overflow-y-auto">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" /> 详细答题情况
                  </p>
                  <div className="space-y-2">
                    {resultRecord.questionResults.map((r, idx) => (
                      <div
                        key={r.questionId}
                        className={clsx(
                          'flex items-center gap-3 rounded-xl border px-3 py-2',
                          r.isCorrect
                            ? 'border-emerald-400/20 bg-emerald-500/8'
                            : 'border-rose-400/20 bg-rose-500/8'
                        )}
                      >
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-[11px] font-black text-slate-300">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{r.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {r.questionType === 'rule' ? '补贴规则' : r.questionType === 'evidence' ? '申诉证据' : r.questionType === 'settlement' ? '结算排序' : '赔付判定'}
                            <span className="mx-1.5">·</span>
                            用时 {r.timeSpent.toFixed(1)}s
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={clsx('text-xs font-black', r.isCorrect ? 'text-emerald-300' : 'text-rose-300')}>
                            {r.isCorrect ? '✓' : '✗'} {r.scoreEarned}/{r.maxScore}
                          </p>
                          {!r.isCorrect && r.errorAnalysis && (
                            <p className="text-[10px] text-rose-300/70 mt-0.5 max-w-40 truncate">{r.errorAnalysis}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => navigate('/records')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    <Award className="h-4 w-4" />训练记录
                  </button>
                  <button
                    onClick={() => {
                      if (mode === 'level' && levelId) { resetGame(); startLevel(levelId); }
                      else { resetGame(); startPractice({ types: ['rule', 'evidence', 'settlement', 'compensation'], difficulty: [1, 5] }); }
                      setResultRecord(null);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />重新挑战
                  </button>
                  <button
                    onClick={() => navigate('/levels')}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 hover:-translate-y-0.5"
                  >
                    <Trophy className="h-4 w-4" />下一关
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="mx-auto h-10 w-10 text-amber-400 mb-3" />
                <p className="text-sm text-slate-300">正在生成训练结果...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
