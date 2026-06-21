import { useTimer } from '@/hooks/useTimer';
import { useGameStore } from '@/stores/gameStore';
import { Play, Pause, RotateCcw, HelpCircle, ChevronRight, Target, Clock, Award, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Question, GamePhase } from '@/types/game';

const phaseLabelMap: Record<GamePhase, { name: string; icon: string; color: string }> = {
  intro: { name: '关卡介绍', icon: '🎬', color: 'text-slate-400' },
  rule: { name: '补贴规则识别', icon: '📜', color: 'text-indigo-400' },
  evidence: { name: '申诉证据选择', icon: '🔍', color: 'text-cyan-400' },
  settlement: { name: '结算明细排序', icon: '📊', color: 'text-emerald-400' },
  compensation: { name: '赔付记录处理', icon: '💥', color: 'text-rose-400' },
  result: { name: '结算完成', icon: '🏁', color: 'text-amber-400' },
};

interface HudPanelProps {
  onShowHint?: () => void;
  onQuit?: () => void;
  questionTimeLimit?: number;
}

export const HudPanel = ({ onShowHint, onQuit, questionTimeLimit }: HudPanelProps) => {
  const { phase, currentLevel, score, questions, currentQuestionIndex, answers } = useGameStore();
  const [paused, setPaused] = useState(false);

  const currentQuestion: Question | undefined = questions[currentQuestionIndex];
  const effectiveLimit = questionTimeLimit || currentQuestion?.timeLimit || 120;

  const { remaining, formatTime, pause: pauseTimer, resume: resumeTimer, reset: resetTimer } = useTimer({
    initialTime: effectiveLimit,
    autoStart: phase !== 'intro' && phase !== 'result',
    onComplete: () => {
      // 时间到，自动触发下一步
    },
  });

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'result') {
      resetTimer(effectiveLimit);
      setPaused(false);
    }
  }, [phase, currentQuestionIndex, effectiveLimit, resetTimer]);

  useEffect(() => {
    if (paused) pauseTimer();
    else resumeTimer();
  }, [paused, pauseTimer, resumeTimer]);

  const phaseInfo = phaseLabelMap[phase];
  const totalScore = questions.reduce((s, q) => s + q.score, 0);
  const answeredCount = Object.keys(answers).length;
  const timePct = Math.max(0, Math.min(100, (remaining / effectiveLimit) * 100));

  const timeColor =
    timePct > 50 ? 'bg-emerald-500' : timePct > 25 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div className="pointer-events-auto flex items-start justify-between p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-orange-500/20 text-2xl ring-1 ring-white/10">
              {currentLevel?.icon || '🎯'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {currentLevel?.difficulty ? `难度 ${'★'.repeat(currentLevel.difficulty)}` : '自由练习'}
              </span>
              <span className="text-lg font-bold text-white">
                {currentLevel?.name || '跑腿补贴调度训练'}
              </span>
            </div>
            <div className="ml-3 h-10 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className={`text-xs font-semibold ${phaseInfo.color}`}>
                {phaseInfo.icon} 当前阶段
              </span>
              <span className="text-base font-bold text-white">{phaseInfo.name}</span>
            </div>
          </div>

          {currentQuestion && (
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">进度</span>
                <span className="text-xl font-bold text-white">
                  {Math.min(currentQuestionIndex + 1, questions.length)}/{questions.length}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Award className="h-4 w-4" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">得分</span>
                </div>
                <span className="text-xl font-bold text-white">
                  {score}<span className="text-sm text-slate-400">/{totalScore}</span>
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Target className="h-4 w-4" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">答题</span>
                </div>
                <span className="text-xl font-bold text-white">
                  {answeredCount}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">剩余时间</span>
              </div>
              <span className={`font-mono text-2xl font-bold ${timePct > 50 ? 'text-white' : timePct > 25 ? 'text-amber-400' : 'text-rose-400 animate-pulse'}`}>
                {formatTime(remaining)}
              </span>
            </div>
            <div className="flex h-10 w-1.5 overflow-hidden rounded-full bg-slate-700/50">
              <div
                className={`w-full ${timeColor} transition-all duration-300`}
                style={{ height: `${timePct}%` }}
              />
            </div>
            <div className="ml-2 flex flex-col gap-1">
              <button
                onClick={() => setPaused(p => !p)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 transition hover:bg-slate-600/70 hover:text-white"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                onClick={() => resetTimer()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 transition hover:bg-slate-600/70 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentQuestion?.hint && (
              <button
                onClick={onShowHint}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-500/20"
              >
                <HelpCircle className="h-4 w-4" />
                查看提示
              </button>
            )}
            {onQuit && (
              <button
                onClick={onQuit}
                className="flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 shadow-lg shadow-rose-500/10 transition hover:bg-rose-500/20"
              >
                退出训练
              </button>
            )}
          </div>
        </div>
      </div>

      {currentQuestion && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 px-6 py-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${phaseInfo.color} bg-white/5 ring-1 ring-white/10`}>
                {phaseInfo.icon} 题型
              </span>
              <span className="text-xs font-medium text-slate-400">
                {currentQuestion.difficulty}星难度 · {currentQuestion.score}分
              </span>
              <div className="ml-auto flex items-center gap-1">
                {Array.from({ length: currentQuestion.difficulty }).map((_, i) => (
                  <Zap key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">{currentQuestion.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{currentQuestion.description}</p>
          </div>
        </div>
      )}

      {phase !== 'intro' && phase !== 'result' && (
        <div className="pointer-events-auto mt-auto flex items-center justify-center p-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-2 py-2 shadow-2xl backdrop-blur-xl">
            {questions.map((q, idx) => {
              const answered = answers[q.id];
              const isCurrent = idx === currentQuestionIndex;
              return (
                <div
                  key={q.id}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    isCurrent
                      ? 'scale-110 bg-gradient-to-br from-indigo-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-white/30'
                      : answered
                        ? answered.isCorrect
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-rose-500/80 text-white'
                        : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/70'
                  }`}
                >
                  {idx + 1}
                  {answered && (
                    <span className="absolute -right-1 -top-1 text-xs">
                      {answered.isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="mx-2 h-8 w-px bg-white/10" />
            <span className="pr-2 text-xs text-slate-400">
              点击 <ChevronRight className="inline h-4 w-4" /> 前进
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
