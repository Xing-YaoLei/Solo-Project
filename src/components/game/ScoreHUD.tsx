import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, DollarSign, Target } from 'lucide-react';
import { useMemo } from 'react';

interface ScoreHUDProps {
  score: number;
  targetScore: number;
  totalSeats: number;
  checkedInSeats: number;
  expectedRevenue: number;
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const display = useMemo(() => value, [value]);
  return (
    <motion.span
      key={display}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {prefix}{display.toLocaleString()}{suffix}
    </motion.span>
  );
}

export function ScoreHUD({ score, targetScore, totalSeats, checkedInSeats, expectedRevenue }: ScoreHUDProps) {
  const occupancy = totalSeats > 0 ? Math.round((checkedInSeats / totalSeats) * 100) : 0;
  const scorePercent = targetScore > 0 ? Math.min(100, Math.round((score / targetScore) * 100)) : 0;
  const isTargetMet = score >= targetScore;
  const isOccupancyGood = occupancy >= 85;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 z-20 w-64"
      >
        <div
          className={`
            backdrop-blur-xl rounded-2xl border p-4 shadow-2xl
            ${isTargetMet
              ? 'bg-emerald-900/40 border-emerald-500/50'
              : 'bg-slate-900/60 border-slate-700/50'
            }
          `}
        >
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium">当前得分</span>
                </div>
                <span className={`text-xs font-bold ${isTargetMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {scorePercent}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">
                  <AnimatedNumber value={score} />
                </span>
                <span className="text-xs text-slate-500">/ {targetScore.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isTargetMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
              <div>
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">上座率</span>
                </div>
                <div className={`text-lg font-bold font-mono ${isOccupancyGood ? 'text-emerald-400' : 'text-slate-200'}`}>
                  <AnimatedNumber value={occupancy} suffix="%" />
                </div>
                <div className="text-[10px] text-slate-500">{checkedInSeats}/{totalSeats}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">预计收益</span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  <AnimatedNumber value={expectedRevenue} prefix="¥" />
                </div>
              </div>
            </div>
          </div>

          {isTargetMet && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
            >
              <Trophy className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </div>

        <div className="mt-2 text-center">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            <DollarSign className="w-3 h-3" />
            目标达成奖励加成
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
