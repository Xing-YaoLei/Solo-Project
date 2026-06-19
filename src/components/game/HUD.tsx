import { useGameStore } from '@/store/useGameStore';
import { formatSeconds, formatPercent, formatNumber } from '@/utils/format';
import { calculateReworkRate } from '@/utils/rework';
import { Timer, Target, AlertTriangle, Trophy, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function HUD() {
  const {
    timeRemaining,
    score,
    completedCount,
    reworkCount,
    diagnoses,
    workOrders,
    isPaused,
    pauseGame,
    resumeGame,
  } = useGameStore();

  const totalDiagnoses = diagnoses.length;
  const progress = totalDiagnoses > 0 ? completedCount / totalDiagnoses : 0;
  const reworkRate = calculateReworkRate(workOrders);
  const isTimeCritical = timeRemaining > 0 && timeRemaining <= 60;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 pt-4"
    >
      <div className="mx-auto max-w-6xl">
        <div className={cn(
          'flex items-center justify-between gap-6 rounded-2xl px-6 py-3',
          'bg-white/10 backdrop-blur-xl border border-white/20',
          'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
        )}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                isTimeCritical ? 'bg-red-500/20' : 'bg-blue-500/20'
              )}>
                <Timer className={cn(
                  'h-5 w-5',
                  isTimeCritical ? 'text-red-400' : 'text-blue-400'
                )} />
              </div>
              <div>
                <div className="text-xs text-white/50">剩余时间</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={timeRemaining}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      'text-lg font-bold tabular-nums',
                      isTimeCritical && 'text-red-400 animate-pulse'
                    )}
                    style={{ color: isTimeCritical ? '#f87171' : '#ffffff' }}
                  >
                    {formatSeconds(timeRemaining, { showHours: false })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-white/50">完成进度</div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="text-lg font-bold text-white tabular-nums"
                    style={{ color: '#ffffff' }}
                  >
                    {formatPercent(progress)}
                  </motion.div>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress * 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                reworkRate > 0.3 ? 'bg-red-500/20' : reworkRate > 0.15 ? 'bg-orange-500/20' : 'bg-amber-500/20'
              )}>
                <AlertTriangle className={cn(
                  'h-5 w-5',
                  reworkRate > 0.3 ? 'text-red-400' : reworkRate > 0.15 ? 'text-orange-400' : 'text-amber-400'
                )} />
              </div>
              <div>
                <div className="text-xs text-white/50">返修率</div>
                <motion.div
                  key={reworkRate}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    reworkRate > 0.3 && 'text-red-400',
                    reworkRate > 0.15 && reworkRate <= 0.3 && 'text-orange-400'
                  )}
                  style={{
                    color: reworkRate > 0.3 ? '#f87171' : reworkRate > 0.15 ? '#fb923c' : '#ffffff'
                  }}
                >
                  {formatPercent(reworkRate)}
                </motion.div>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-xs text-white/50">实时分数</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={score}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className="text-lg font-bold text-white tabular-nums"
                    style={{ color: '#ffffff' }}
                  >
                    {formatNumber(score)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <button
              onClick={isPaused ? resumeGame : pauseGame}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                'bg-white/10 hover:bg-white/20 border border-white/10',
                'active:scale-95'
              )}
            >
              {isPaused ? (
                <Play className="h-5 w-5 text-white" />
              ) : (
                <Pause className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
