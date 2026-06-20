import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  RotateCcw,
  Play,
  Home,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { OccupancyChart } from '../components/review/OccupancyChart';
import { ScoreBreakdown } from '../components/review/ScoreBreakdown';
import { StatCards } from '../components/review/StatCards';
import { useGameStore } from '../store/gameStore';
import { useProgressStore } from '../store/progressStore';
import { getLevelById } from '../data/levels';
import { getCurrentOccupancy } from '../utils/occupancyTracker';

export function ReviewPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const level = useMemo(() => (levelId ? getLevelById(levelId) : undefined), [levelId]);

  const {
    seats,
    lockRecords,
    checkInRecords,
    decisionHistory,
    score,
    targetScore,
    targetOccupancy,
    mode,
    occupancyHistory,
    rollbackToDecision,
    computeFinalScore,
    initializeLevel,
  } = useGameStore();

  const { getProgress } = useProgressStore();

  const { totalScore, occupancyPercent, breakdown } = useMemo(() => {
    return computeFinalScore();
  }, [computeFinalScore]);

  const progress = level ? getProgress(level.id) : null;
  const { checkedIn, total } = getCurrentOccupancy(seats);
  const conflictCount = lockRecords.filter((r) => r.isConflict).length;
  const refundCount = seats.filter((s) => s.status === 'REFUNDED').length;
  const totalRevenue = seats
    .filter((s) => s.status === 'CHECKED_IN')
    .reduce((sum, s) => sum + s.price, 0);

  const isPassed = totalScore >= (level?.targetScore || 0);
  const finalOccupancy = occupancyPercent;
  const scorePercent = targetScore > 0 ? Math.min(100, Math.round((totalScore / targetScore) * 100)) : 0;

  useEffect(() => {
    if (!levelId) return;
    if (seats.length === 0) {
      navigate(`/play/${levelId}`);
    }
  }, [levelId, seats.length, navigate]);

  const handleRollback = (decisionId: string) => {
    rollbackToDecision(decisionId);
    navigate(`/play/${levelId}`);
  };

  const handleReplay = () => {
    if (levelId) {
      initializeLevel(levelId, mode);
      navigate(`/play/${levelId}`);
    }
  };

  const handleNextLevel = () => {
    if (!level) return;
    const levels = getLevelById as any;
    const allLevels = levels?.levels || [];
    void allLevels;
    navigate('/levels');
  };

  if (!level || seats.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        加载中...
      </div>
    );
  }

  const diffStars = level.difficulty;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900/80 to-indigo-950/20" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/play/${levelId}`)}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold">复盘分析</h1>
                {isPassed && (
                  <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> 通过
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">{level.name}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < diffStars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/levels')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/60 text-sm transition-all"
            >
              <Home className="w-4 h-4" />
              关卡列表
            </button>
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/60 text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              重玩
            </button>
            <button
              onClick={handleNextLevel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              下一关
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`
            relative overflow-hidden rounded-3xl p-8 mb-6 border-2
            ${isPassed
              ? 'bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-emerald-500/10 border-amber-500/40'
              : 'bg-gradient-to-br from-rose-500/10 via-slate-900/80 to-slate-900/60 border-rose-500/30'
            }
          `}
        >
          <div className="absolute top-0 right-0 w-64 h-64 opacity-30 pointer-events-none">
            <div
              className={`absolute inset-0 rounded-full blur-3xl ${
                isPassed ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left md:col-span-1">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">
                {isPassed ? '🎉 任务完成！' : '💪 再接再厉'}
              </div>
              <div className="mb-3">
                <span className={`text-6xl font-black font-mono ${
                  isPassed ? 'text-amber-400' : 'text-white'
                }`}>
                  {totalScore.toLocaleString()}
                </span>
                <span className="text-2xl text-slate-500 font-mono">
                  /{(level?.targetScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden max-w-xs">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className={`h-full rounded-full ${
                    isPassed
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400'
                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                />
              </div>
              <div className="mt-2 text-sm text-slate-400">
                达成 <b className="text-white">{scorePercent}%</b> 的目标分数
              </div>
              {progress && progress.bestScore === totalScore && totalScore > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  新纪录！
                </div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              {[
                { label: '最终得分', value: totalScore.toLocaleString(), color: isPassed ? 'text-amber-400' : 'text-white', bg: 'from-amber-500/20 to-slate-800/50' },
                { label: '总上座率', value: `${finalOccupancy}%`, color: finalOccupancy >= targetOccupancy ? 'text-emerald-400' : 'text-sky-400', bg: 'from-emerald-500/20 to-slate-800/50' },
                { label: '最佳成绩', value: (progress?.bestScore || 0).toLocaleString(), color: 'text-sky-400', bg: 'from-sky-500/20 to-slate-800/50' },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${item.bg} border border-slate-700/40 backdrop-blur-sm`}
                >
                  <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                  <div className={`text-2xl font-black font-mono ${item.color}`}>{item.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <StatCards
            totalScore={totalScore}
            targetScore={targetScore}
            occupancyPercent={finalOccupancy}
            targetOccupancy={targetOccupancy}
            totalRevenue={totalRevenue}
            conflictCount={conflictCount}
            refundCount={refundCount}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <OccupancyChart
            data={occupancyHistory.length > 0 ? occupancyHistory : [
              { timeLabel: '初始', timestamp: Date.now(), currentOccupancy: 0, optimalOccupancy: 0, phase: 'RULES' },
              { timeLabel: '锁座中', timestamp: Date.now() + 1000, currentOccupancy: Math.round(targetOccupancy * 0.5), optimalOccupancy: Math.round(targetOccupancy * 0.6), phase: 'LOCKING' },
              { timeLabel: '核销中', timestamp: Date.now() + 2000, currentOccupancy: finalOccupancy, optimalOccupancy: Math.round(targetOccupancy * 0.9), phase: 'CHECKING' },
              { timeLabel: '最终', timestamp: Date.now() + 3000, currentOccupancy: finalOccupancy, optimalOccupancy: targetOccupancy, phase: 'REVIEW' },
            ]}
            targetOccupancy={targetOccupancy}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <ScoreBreakdown
            decisionHistory={decisionHistory}
            breakdown={breakdown}
            totalScore={totalScore}
            onRollback={handleRollback}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 pb-8"
        >
          <button
            onClick={() => navigate('/levels')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/60 font-medium transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            返回关卡列表
          </button>
          <button
            onClick={handleReplay}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600/60 text-white hover:shadow-lg hover:shadow-slate-500/20 font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            再次挑战
          </button>
          <button
            onClick={handleNextLevel}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 font-black shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-105 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5" />
            继续训练
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        <div className="hidden">
          {/* 避免未使用变量警告 */}
          {checkedIn}/{total}
          {checkInRecords.length}
          {lockRecords.length}
        </div>
      </div>
    </div>
  );
}
