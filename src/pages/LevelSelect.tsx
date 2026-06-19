import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Lock,
  Clock,
  Target,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { levels as defaultLevels } from '@/data/levels';
import type { Level } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 90,
      damping: 16,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

function renderStars(count: number, max: number = 3, keyPrefix: string = '') {
  return Array.from({ length: max }, (_, i) => (
    <Star
      key={`${keyPrefix}-star-${i}`}
      className={`h-4 w-4 sm:h-5 sm:w-5 ${
        i < count
          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
          : 'fill-slate-700/60 text-slate-600'
      } transition-all`}
      strokeWidth={2}
    />
  ));
}

function renderDifficultyStars(difficulty: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={`diff-${i}`}
      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
        i < difficulty
          ? 'fill-orange-500 text-orange-500'
          : 'fill-transparent text-slate-600'
      }`}
      strokeWidth={i < difficulty ? 1.5 : 2}
    />
  ));
}

function getDifficultyLabel(difficulty: number): string {
  const map: Record<number, string> = {
    1: '入门',
    2: '初级',
    3: '中级',
    4: '高级',
    5: '大师',
  };
  return map[difficulty] ?? '';
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 1) return 'text-emerald-400';
  if (difficulty === 2) return 'text-sky-400';
  if (difficulty === 3) return 'text-amber-400';
  if (difficulty === 4) return 'text-orange-400';
  return 'text-rose-400';
}

function getCardGradientBorder(difficulty: number, unlocked: boolean): string {
  if (!unlocked) return 'border-slate-700/60';
  if (difficulty <= 1) return 'border-emerald-500/30';
  if (difficulty === 2) return 'border-sky-500/30';
  if (difficulty === 3) return 'border-amber-500/30';
  if (difficulty === 4) return 'border-orange-500/30';
  return 'border-rose-500/30';
}

export default function LevelSelect() {
  const navigate = useNavigate();
  const { levels, loadLevelData, startLevel } = useGameStore();

  useEffect(() => {
    if (levels.length === 0) {
      defaultLevels.forEach((l: Level) => {
        loadLevelData(l, [], [], [], []);
      });
    }
  }, [levels.length, loadLevelData]);

  const displayLevels: Level[] =
    levels.length > 0 ? levels : defaultLevels;

  const handleLevelClick = (level: Level) => {
    if (!level.unlocked) return;
    startLevel(level.id);
    navigate(`/game/${level.id}`);
  };

  const totalStars = displayLevels.reduce((s, l) => s + l.bestStars, 0);
  const maxStars = displayLevels.length * 3;
  const perfectCount = displayLevels.filter((l) => l.bestStars >= 3).length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A]">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(249,115,22,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-orange-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 -left-32 h-[460px] w-[460px] rounded-full bg-sky-500/12 blur-[150px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 flex items-center justify-between sm:mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-xl transition-all hover:border-orange-500/40 hover:bg-slate-800/80 hover:text-orange-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>返回主菜单</span>
          </button>

          <div className="hidden items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-800/60 px-5 py-2.5 backdrop-blur-xl sm:flex">
            <div className="flex items-center gap-2">
              <Star
                className="h-4 w-4 fill-amber-400 text-amber-400"
                strokeWidth={1.5}
              />
              <span className="text-sm font-bold text-amber-300">
                {totalStars}
              </span>
              <span className="text-xs text-slate-500">/ {maxStars}</span>
            </div>
            <div className="h-5 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-slate-300">
                完美通关 <span className="font-bold text-emerald-400">{perfectCount}</span>
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 sm:mb-8"
        >
          <h2 className="mb-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              关卡选择
            </span>
          </h2>
          <p className="text-sm text-slate-400 sm:text-base">
            共 {displayLevels.length} 个关卡 · 从实习生到首席调度官的进阶之路
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        >
          {displayLevels.map((level, index) => {
            const isUnlocked = level.unlocked;
            const isPerfect = level.bestStars >= 3;
            const borderClass = getCardGradientBorder(
              level.difficulty,
              isUnlocked
            );

            return (
              <motion.button
                key={level.id}
                variants={cardVariants}
                onClick={() => handleLevelClick(level)}
                disabled={!isUnlocked}
                className={`group relative overflow-hidden rounded-2xl border ${borderClass} backdrop-blur-xl transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-slate-800/50 hover:bg-slate-800/75 hover:shadow-2xl hover:shadow-orange-500/10'
                    : 'cursor-not-allowed bg-slate-900/60 opacity-80'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute -top-1/2 -right-1/2 h-full w-full bg-gradient-to-br from-orange-500/10 via-transparent to-sky-500/10 blur-3xl" />
                  </div>
                )}

                {isPerfect && isUnlocked && (
                  <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-amber-500/30">
                    PERFECT
                  </div>
                )}

                {!isUnlocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800/90">
                        <Lock className="h-6 w-6 text-slate-400" />
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        通过前一关解锁
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative flex flex-col gap-4 p-5 text-left sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-orange-400 ring-1 ring-white/10'
                            : 'bg-slate-800/70 text-slate-500'
                        }`}
                      >
                        {index + 1}
                        {isUnlocked && (
                          <div className="absolute -inset-px -z-10 rounded-xl bg-gradient-to-br from-orange-500/40 to-transparent opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col">
                        <h3
                          className={`truncate text-base font-bold sm:text-lg ${
                            isUnlocked ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          {level.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5">
                          {renderDifficultyStars(level.difficulty)}
                          <span
                            className={`ml-1 text-xs font-semibold ${
                              isUnlocked
                                ? getDifficultyColor(level.difficulty)
                                : 'text-slate-600'
                            }`}
                          >
                            {getDifficultyLabel(level.difficulty)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isUnlocked && (
                      <ChevronRight className="h-5 w-5 shrink-0 translate-x-2 text-slate-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-orange-400" />
                    )}
                  </div>

                  <p
                    className={`line-clamp-2 text-xs leading-relaxed sm:text-sm ${
                      isUnlocked ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {level.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-700/40 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Target
                        className={`h-3.5 w-3.5 ${
                          isUnlocked ? 'text-sky-400' : 'text-slate-600'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isUnlocked ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {level.targetVehicleCount} 辆
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock
                        className={`h-3.5 w-3.5 ${
                          isUnlocked ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isUnlocked ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {Math.floor(level.timeLimitSeconds / 60)} 分钟
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      isUnlocked
                        ? 'border-slate-700/50 bg-slate-900/50'
                        : 'border-slate-800/60 bg-slate-900/30'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-[10px] uppercase tracking-wider ${
                          isUnlocked ? 'text-slate-500' : 'text-slate-700'
                        }`}
                      >
                        最佳记录
                      </span>
                      <span
                        className={`text-lg font-black ${
                          isUnlocked ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {level.bestScore.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {renderStars(
                        level.bestStars,
                        3,
                        `${level.id}-${level.bestStars}`
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-8 flex justify-center text-xs text-slate-600"
        >
          提示：每关获得 1 星以上即可解锁下一关
        </motion.div>
      </div>
    </div>
  );
}
