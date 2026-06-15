import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play as PlayIcon, RotateCcw, Home, Trophy, Target, Zap, Clock, CheckCircle, XCircle, Flame } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getLevelById, getSubjectInfo, getGradeLabel, getDifficultyLabel, getDifficultyColor } from '@/data/levels';
import { generateLevel, checkMatch, calculateScore, formatTime, getGradeColor } from '@/utils/gameEngine';
import AudioManager from '@/utils/audio';
import type { TextbookItem, Slot, GameStats, LevelConfig } from '@/types/game';

type GamePhase = 'ready' | 'countdown' | 'playing' | 'paused' | 'finished';

export default function Game() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { settings, currentLevel, setCurrentLevel, setCurrentStats, recordLevelResult, setLastCompletedStats } = useGameStore();

  const [level, setLevel] = useState<LevelConfig | null>(null);
  const [textbooks, setTextbooks] = useState<TextbookItem[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [countdown, setCountdown] = useState(3);
  const [stats, setStats] = useState<GameStats>({
    totalAttempts: 0,
    correctCount: 0,
    wrongCount: 0,
    currentCombo: 0,
    maxCombo: 0,
    totalTime: 0,
    timeRemaining: 0,
    score: 0,
    timeBonus: 0,
    accuracyBonus: 0,
    comboBonus: 0,
    completionRate: 0,
    completed: false,
    passed: false,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; key: number } | null>(null);
  const [comboPopup, setComboPopup] = useState<{ count: number; key: number } | null>(null);
  const [justPlacedSlot, setJustPlacedSlot] = useState<{ id: number; key: number } | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const audioRef = useRef<AudioManager | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new AudioManager(settings);
    } else {
      audioRef.current.updateSettings(settings);
    }
  }, [settings]);

  const initLevel = useCallback((cfg: LevelConfig) => {
    const generated = generateLevel(cfg);
    setTextbooks(generated.textbooks);
    setSlots(generated.slots);
    setProcessedCount(0);
    setSelectedId(null);
    setStats({
      totalAttempts: 0,
      correctCount: 0,
      wrongCount: 0,
      currentCombo: 0,
      maxCombo: 0,
      totalTime: cfg.duration,
      timeRemaining: cfg.duration,
      score: 0,
      timeBonus: 0,
      accuracyBonus: 0,
      comboBonus: 0,
      completionRate: 0,
      completed: false,
      passed: false,
    });
    setPhase('ready');
    setCountdown(3);
    setFeedback(null);
    setComboPopup(null);
  }, []);

  useEffect(() => {
    let activeLevel = currentLevel;
    if (!activeLevel && levelId) {
      const found = getLevelById(levelId);
      if (found) {
        activeLevel = found;
        setCurrentLevel(found);
      }
    }
    if (activeLevel) {
      setLevel(activeLevel);
      initLevel(activeLevel);
    }
  }, [levelId, currentLevel, setCurrentLevel, initLevel]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    if (!audioRef.current) return;
    setPhase('countdown');
    setCountdown(3);
    audioRef.current.playCountdown();
    let cd = 3;
    const id = window.setInterval(() => {
      cd -= 1;
      if (cd > 0) {
        setCountdown(cd);
        audioRef.current?.playCountdown();
      } else {
        window.clearInterval(id);
        audioRef.current?.playStart();
        setPhase('playing');
      }
    }, 1000);
  }, []);

  const finishGame = useCallback((finalStats: GameStats) => {
    stopTimer();
    if (!level) return;
    const calculated = calculateScore(finalStats, level, textbooks.length + processedCount, processedCount);
    setStats(calculated);
    setPhase('finished');
    setCurrentStats(calculated);
    setLastCompletedStats(calculated);
    recordLevelResult(level.id, level.name, level.mode, calculated);
    if (calculated.passed) {
      audioRef.current?.playWin();
    } else {
      audioRef.current?.playLose();
    }
  }, [level, textbooks.length, processedCount, stopTimer, setCurrentStats, setLastCompletedStats, recordLevelResult]);

  useEffect(() => {
    if (phase === 'playing' && level) {
      stopTimer();
      timerRef.current = window.setInterval(() => {
        setStats((prev) => {
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 5 && newTime > 0 && audioRef.current) {
            audioRef.current.playTick();
          }
          if (newTime <= 0) {
            const finalStats = { ...prev, timeRemaining: 0 };
            setTimeout(() => finishGame(finalStats), 0);
            return finalStats;
          }
          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);
    }
    return () => stopTimer();
  }, [phase, level, stopTimer, finishGame]);

  useEffect(() => {
    if (phase === 'playing' && textbooks.length === 0 && processedCount > 0) {
      finishGame(stats);
    }
  }, [textbooks.length, processedCount, phase, stats, finishGame]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    const key = Date.now();
    setFeedback({ type, message, key });
    setTimeout(() => {
      setFeedback((f) => (f && f.key === key ? null : f));
    }, 1200);
  };

  const showCombo = (count: number) => {
    if (count < 3) return;
    const key = Date.now();
    setComboPopup({ count, key });
    setTimeout(() => {
      setComboPopup((c) => (c && c.key === key ? null : c));
    }, 900);
  };

  const handleSelectTextbook = (id: string) => {
    if (phase !== 'playing') return;
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      audioRef.current?.playSelect();
    }
  };

  const handleClickSlot = (slot: Slot) => {
    if (phase !== 'playing') return;
    if (!selectedId) return;

    const textbook = textbooks.find((t) => t.id === selectedId);
    if (!textbook) return;

    const result = checkMatch(textbook, slot);
    const newAttempts = stats.totalAttempts + 1;

    if (result.correct) {
      audioRef.current?.playCorrect();
      audioRef.current?.vibrateCorrect();

      const newCorrect = stats.correctCount + 1;
      const newCombo = stats.currentCombo + 1;
      const newMaxCombo = Math.max(stats.maxCombo, newCombo);

      if (newCombo >= 3 && newCombo % 3 === 0) {
        audioRef.current?.playCombo(newCombo);
        audioRef.current?.vibrateCombo();
        showCombo(newCombo);
      }

      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id ? { ...s, current: s.current + textbook.quantity } : s,
        ),
      );
      setTextbooks((prev) => prev.filter((t) => t.id !== selectedId));
      setProcessedCount((c) => c + 1);

      const key = Date.now();
      setJustPlacedSlot({ id: slot.id, key });
      setTimeout(() => setJustPlacedSlot((p) => (p && p.key === key ? null : p)), 400);

      setStats((prev) => ({
        ...prev,
        totalAttempts: newAttempts,
        correctCount: newCorrect,
        currentCombo: newCombo,
        maxCombo: newMaxCombo,
      }));
      showFeedback('success', `正确！${textbook.label}`);
    } else {
      audioRef.current?.playWrong();
      audioRef.current?.vibrateWrong();

      const key = Date.now();
      setShakeId(selectedId);
      setTimeout(() => setShakeId(null), 400);

      setStats((prev) => ({
        ...prev,
        totalAttempts: newAttempts,
        wrongCount: prev.wrongCount + 1,
        currentCombo: 0,
      }));
      showFeedback('error', `错误 - ${result.reason}`);
    }

    setSelectedId(null);
  };

  const handleRestart = () => {
    if (level) initLevel(level);
  };

  const togglePause = () => {
    if (phase === 'playing') {
      setPhase('paused');
      stopTimer();
    } else if (phase === 'paused') {
      setPhase('playing');
    }
  };

  const accuracy = useMemo(() => {
    if (stats.totalAttempts === 0) return 0;
    return Math.round((stats.correctCount / stats.totalAttempts) * 100);
  }, [stats.totalAttempts, stats.correctCount]);

  const totalTextbooks = textbooks.length + processedCount;
  const progressPct = totalTextbooks > 0 ? (processedCount / totalTextbooks) * 100 : 0;
  const timePct = stats.totalTime > 0 ? (stats.timeRemaining / stats.totalTime) * 100 : 0;
  const timeColor = timePct > 50 ? 'bg-green-500' : timePct > 20 ? 'bg-yellow-500' : 'bg-red-500';

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载关卡中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{level.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getDifficultyColor(level.difficulty)}`}>
                {getDifficultyLabel(level.difficulty)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              title="重新开始"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {(phase === 'playing' || phase === 'paused') && (
              <button
                onClick={togglePause}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                {phase === 'paused' ? <PlayIcon className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>剩余时间</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all duration-500 ${timeColor}`} style={{ width: `${timePct}%` }} />
              </div>
              <p className={`text-lg font-bold font-mono ${
                timePct > 50 ? 'text-gray-800' : timePct > 20 ? 'text-yellow-600' : 'text-red-600 animate-pulse'
              }`}>
                {formatTime(stats.timeRemaining)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Target className="w-3.5 h-3.5" />
                <span>准确率</span>
              </div>
              <p className="text-lg font-bold text-blue-600">{accuracy}%</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>连击</span>
              </div>
              <p className={`text-lg font-bold ${stats.currentCombo >= 5 ? 'text-orange-500' : stats.currentCombo >= 3 ? 'text-yellow-600' : 'text-gray-800'}`}>
                {stats.currentCombo}
                {stats.maxCombo > 0 && <span className="text-xs text-gray-400 font-normal ml-1">/ max {stats.maxCombo}</span>}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>分数</span>
              </div>
              <p className="text-lg font-bold text-purple-600">{stats.score.toLocaleString()}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>进度 {processedCount}/{totalTextbooks}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {phase === 'ready' && (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">{level.name}</h2>
              <p className="text-gray-500 mb-6">{level.description}</p>
              <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">时长</p>
                  <p className="font-bold text-gray-800">{level.duration}秒</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">教材</p>
                  <p className="font-bold text-gray-800">{level.textbookCount}本</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">及格</p>
                  <p className="font-bold text-gray-800">{Math.round(level.minAccuracy * 100)}%</p>
                </div>
              </div>
              <button
                onClick={startCountdown}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-98"
              >
                开始挑战
              </button>
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="relative">
              <div
                className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl"
                style={{ animation: 'countdown-pop 1s ease-out infinite' }}
              >
                <span className="text-8xl font-bold">{countdown}</span>
              </div>
            </div>
          </div>
        )}

        {(phase === 'playing' || phase === 'paused') && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                待分发教材 ({textbooks.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {textbooks.slice(0, 20).map((tb) => {
                  const info = getSubjectInfo(tb.subject);
                  const selected = selectedId === tb.id;
                  const gradeColor = getGradeColor(tb.grade);
                  return (
                    <button
                      key={tb.id}
                      onClick={() => handleSelectTextbook(tb.id)}
                      className={`relative p-3 rounded-2xl text-left transition-all border-2 ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105 z-10'
                          : 'border-transparent bg-white shadow-sm hover:shadow-md hover:scale-[1.02]'
                      } ${shakeId === tb.id ? 'animate-shake' : ''}`}
                      style={{ animationDuration: '0.4s' }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${info.color}15`, color: info.color }}
                        >
                          {info.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 text-sm truncate">{info.name}</p>
                          <p className="text-xs font-medium" style={{ color: gradeColor }}>
                            {getGradeLabel(tb.grade)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">数量</span>
                        <span className="font-bold text-gray-700">×{tb.quantity}</span>
                      </div>
                      {selected && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {textbooks.length > 20 && (
                  <div className="p-3 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    +{textbooks.length - 20} 更多
                  </div>
                )}
                {textbooks.length === 0 && (
                  <div className="col-span-full py-10 text-center text-gray-400">
                    🎉 全部教材已处理完毕！
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                分类格子 (点击选中教材后，点击对应格子放置)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {slots.map((slot) => {
                  const info = getSubjectInfo(slot.subject);
                  const fillPct = (slot.current / slot.capacity) * 100;
                  const placed = justPlacedSlot?.id === slot.id;
                  const gradeColor = getGradeColor(slot.grade);
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleClickSlot(slot)}
                      className={`p-3 rounded-2xl border-2 transition-all text-left ${
                        selectedId
                          ? 'border-dashed border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer active:scale-95'
                          : 'border-gray-100 bg-white cursor-default'
                      } ${placed ? 'animate-pop ring-2 ring-green-400 ring-offset-2' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${info.color}20`, color: info.color }}
                        >
                          {info.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{info.name}</p>
                          <p className="text-xs font-medium" style={{ color: gradeColor }}>
                            {getGradeLabel(slot.grade)}
                          </p>
                        </div>
                      </div>
                      <div className="mb-1.5">
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(fillPct, 100)}%`, backgroundColor: info.color }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">库存</span>
                        <span className={`font-mono font-bold ${fillPct > 90 ? 'text-red-500' : 'text-gray-700'}`}>
                          {slot.current}/{slot.capacity}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {phase === 'finished' && (
          <div className="min-h-[500px] flex items-center justify-center py-6">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-lg">
              <div className={`p-8 text-center ${
                stats.passed
                  ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800'
              }`}>
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  stats.passed ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {stats.passed
                    ? <Trophy className="w-12 h-12 text-yellow-300" />
                    : <Target className="w-12 h-12 text-white/70" />}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {stats.passed ? '挑战成功！' : '挑战结束'}
                </h2>
                <p className="text-white/80 text-lg">
                  {stats.passed
                    ? '干得漂亮，教学主管很满意！'
                    : level.mode === 'free' ? '没关系，继续练习！' : '再接再厉，下次一定行！'}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="text-center py-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-1">最终得分</p>
                  <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {stats.score.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-blue-50 rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1.5 text-blue-600 text-sm font-medium mb-1">
                      <Target className="w-4 h-4" />
                      <span>准确率</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{accuracy}%</p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      {stats.correctCount}对 / {stats.wrongCount}错
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1.5 text-orange-600 text-sm font-medium mb-1">
                      <Flame className="w-4 h-4" />
                      <span>最大连击</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">{stats.maxCombo}</p>
                    <p className="text-xs text-orange-500 mt-0.5">
                      要求 ≥ {level.minCombo}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1.5 text-green-600 text-sm font-medium mb-1">
                      <Zap className="w-4 h-4" />
                      <span>完成率</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {Math.round(stats.completionRate * 100)}%
                    </p>
                    <p className="text-xs text-green-500 mt-0.5">
                      {processedCount} / {totalTextbooks}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1.5 text-purple-600 text-sm font-medium mb-1">
                      <Clock className="w-4 h-4" />
                      <span>用时</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatTime(stats.totalTime - stats.timeRemaining)}
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5">时间奖励 +{stats.timeBonus}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>首页</span>
                  </button>
                  <button
                    onClick={() => navigate(`/levels/${level.mode}`)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-colors"
                  >
                    选关
                  </button>
                  <button
                    onClick={handleRestart}
                    className={`flex-1 py-3 ${
                      stats.passed
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    } text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-98`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>再来一次</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'paused' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
              <Pause className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">游戏已暂停</h3>
              <p className="text-gray-500 mb-6">休息一下，调整好状态再继续</p>
              <div className="space-y-3">
                <button
                  onClick={togglePause}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
                >
                  继续游戏
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-colors"
                >
                  重新开始
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 font-semibold transition-colors"
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl font-semibold ${
              feedback.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
            style={{ animation: 'feedback-pop 0.8s ease-out forwards' }}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {comboPopup && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div
            className="flex items-center gap-2 text-6xl font-black"
            style={{
              animation: 'combo-pop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              color: comboPopup.count >= 10 ? '#EF4444' : comboPopup.count >= 5 ? '#F97316' : '#EAB308',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <Flame className="w-12 h-12" />
            <span>{comboPopup.count} COMBO!</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes countdown-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes feedback-pop {
          0% { transform: translate(-50%, 20px); opacity: 0; }
          20% { transform: translate(-50%, 0); opacity: 1; }
          80% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -20px); opacity: 0; }
        }
        @keyframes combo-pop {
          0% { transform: translate(-50%, -50%) scale(0.3) rotate(-15deg); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.2) rotate(3deg); opacity: 1; }
          60% { transform: translate(-50%, -50%) scale(1) rotate(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.3) rotate(0); opacity: 0; }
        }
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: pop 0.4s ease-out; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
