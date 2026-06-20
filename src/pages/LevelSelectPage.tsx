import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Lock,
  Trophy,
  Users,
  Target,
  Play,
  Search,
  Filter,
  CheckCircle2,
  Gamepad2,
  BookOpen,
} from 'lucide-react';
import { LEVELS } from '../data/levels';
import { useProgressStore } from '../store/progressStore';
import { useGameStore } from '../store/gameStore';
import type { PlayMode, DifficultyLevel } from '../types';

type FilterType = 'all' | 'unlocked' | 'completed';

export function LevelSelectPage() {
  const navigate = useNavigate();
  const { selectedMode, getProgress, isLevelUnlocked } = useProgressStore();
  const { setMode } = useGameStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [minDifficulty, setMinDifficulty] = useState<number>(0);

  const filteredLevels = useMemo(() => {
    return LEVELS.filter((level) => {
      if (search && !level.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (level.difficulty < minDifficulty) return false;
      const progress = getProgress(level.id);
      if (filter === 'unlocked' && !progress.isUnlocked) return false;
      if (filter === 'completed' && progress.completedCount === 0) return false;
      return true;
    });
  }, [filter, search, minDifficulty, getProgress]);

  const handleStartLevel = (levelId: string) => {
    if (!isLevelUnlocked(levelId)) return;
    const mode: PlayMode = selectedMode;
    setMode(mode);
    navigate(`/play/${levelId}`);
  };

  const renderStars = (difficulty: DifficultyLevel) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < difficulty ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
          }`}
        />
      ))}
    </div>
  );

  const FilterButton = ({
    label,
    value,
    current,
    onClick,
  }: {
    label: string;
    value: FilterType;
    current: FilterType;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`
        px-4 py-1.5 rounded-full text-xs font-medium transition-all
        ${current === value
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600'
        }
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900/60 to-indigo-950/30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">选择关卡</h1>
                <div
                  className={`
                    px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1
                    ${selectedMode === 'FORMAL'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }
                  `}
                >
                  {selectedMode === 'FORMAL' ? (
                    <><Trophy className="w-3 h-3" /> 正式训练</>
                  ) : (
                    <><Gamepad2 className="w-3 h-3" /> 自由练习</>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                共 {LEVELS.length} 个关卡 · 已解锁 {LEVELS.filter((l) => isLevelUnlocked(l.id)).length} 个
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400 font-mono">
                {LEVELS.reduce((sum, l) => sum + getProgress(l.id).bestScore, 0).toLocaleString()}
              </div>
              <div className="text-slate-500">累计得分</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索关卡名称..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <FilterButton label="全部" value="all" current={filter} onClick={() => setFilter('all')} />
              <FilterButton label="已解锁" value="unlocked" current={filter} onClick={() => setFilter('unlocked')} />
              <FilterButton label="已完成" value="completed" current={filter} onClick={() => setFilter('completed')} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">难度:</span>
            {[0, 1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setMinDifficulty(d)}
                className={`
                  px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                  ${minDifficulty === d
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800/40 text-slate-500 border border-transparent hover:text-slate-300'
                  }
                `}
              >
                {d === 0 ? '全部' : `${d}星+`}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredLevels.map((level, idx) => {
              const progress = getProgress(level.id);
              const unlocked = progress.isUnlocked;
              const completed = progress.completedCount > 0;
              const scorePercent = level.targetScore > 0
                ? Math.min(100, Math.round((progress.bestScore / level.targetScore) * 100))
                : 0;
              const isRecord = progress.bestScore >= level.targetScore;

              return (
                <motion.div
                  key={level.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`
                    relative group rounded-3xl overflow-hidden transition-all
                    ${unlocked
                      ? 'bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-900/70 border-2 border-slate-700/60 hover:border-amber-500/50 cursor-pointer'
                      : 'bg-slate-900/40 border-2 border-slate-800/60 opacity-70 cursor-not-allowed'
                    }
                  `}
                  onClick={() => handleStartLevel(level.id)}
                >
                  {!unlocked && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 backdrop-blur-[1px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
                          <Lock className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">通关前一关解锁</p>
                      </div>
                    </div>
                  )}

                  {isRecord && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40"
                    >
                      <Trophy className="w-4 h-4 text-slate-900" />
                    </motion.div>
                  )}

                  {completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 left-4 z-10"
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
                    </motion.div>
                  )}

                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute inset-0 opacity-60">
                      <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                        <g fill="none" stroke={unlocked ? '#F59E0B' : '#334155'} strokeWidth="1" opacity="0.5">
                          {Array.from({ length: 8 }).map((_, r) => (
                            <g key={r}>
                              {Array.from({ length: 16 }).map((_, c) => (
                                <rect
                                  key={c}
                                  x={20 + c * 10}
                                  y={8 + r * 8}
                                  width={7}
                                  height={5}
                                  rx={1}
                                  fill={
                                    level.difficulty >= 4 && (r < 2 || c < 2 || c > 13)
                                      ? '#F59E0B'
                                      : level.difficulty >= 2 && r < 5
                                      ? '#8B5CF6'
                                      : r < 7
                                      ? '#10B981'
                                      : '#64748B'
                                  }
                                  fillOpacity="0.8"
                                />
                              ))}
                            </g>
                          ))}
                        </g>
                        <rect x="80" y="65" width="40" height="12" rx="2" fill="#78350F" opacity="0.8" />
                      </svg>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">第 {idx + 1} 关</div>
                        <h3 className="text-lg font-bold text-white leading-tight">{level.name}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {renderStars(level.difficulty)}
                        {completed && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            {progress.completedCount} 次通关
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2 min-h-[32px]">
                      {level.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/50 border border-slate-700/40">
                        <Target className="w-3.5 h-3.5 text-amber-500" />
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase">目标分</div>
                          <div className="text-xs font-bold font-mono text-amber-400">
                            {level.targetScore.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/50 border border-slate-700/40">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase">上座率</div>
                          <div className="text-xs font-bold font-mono text-emerald-400">
                            {level.targetOccupancy}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {completed && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-slate-500">最佳成绩</span>
                          <span className={`text-[10px] font-mono font-bold ${isRecord ? 'text-amber-400' : 'text-slate-300'}`}>
                            {progress.bestScore.toLocaleString()} / {level.targetScore.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scorePercent}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + idx * 0.05 }}
                            className={`h-full rounded-full ${
                              isRecord ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        {progress.bestOccupancy > 0 && (
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">最佳上座率</span>
                            <span className="font-mono text-emerald-400">{progress.bestOccupancy}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {unlocked && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                          ${completed
                            ? 'bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 text-white hover:shadow-lg hover:shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 hover:shadow-lg hover:shadow-amber-500/30'
                          }
                        `}
                      >
                        {completed ? (
                          <><BookOpen className="w-4 h-4" /> 再来一次</>
                        ) : (
                          <><Play className="w-4 h-4" /> 开始挑战</>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredLevels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center border border-slate-700/50">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-400 mb-1">没有匹配的关卡</h3>
            <p className="text-sm text-slate-600">请调整筛选条件</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
