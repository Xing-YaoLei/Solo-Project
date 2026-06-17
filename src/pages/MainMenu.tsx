import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Trophy, Settings, RotateCcw, Star, Clock, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DIFFICULTY_CONFIGS } from '@/config/difficulty';
import { useAchievements } from '@/hooks/useAchievements';
import { loadReplays, loadStats } from '@/utils/storage';
import type { DifficultyId, ReplayData, GameStats } from '@/types';

export const MainMenu = () => {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('normal');
  const [showReplays, setShowReplays] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [replays, setReplays] = useState<ReplayData[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  
  const { achievements, unlockedAchievements, progress } = useAchievements();

  useEffect(() => {
    setReplays(loadReplays());
    setStats(loadStats());
  }, []);

  const startGame = () => {
    navigate(`/game?difficulty=${selectedDifficulty}`);
  };

  const startReplay = (replayId: string) => {
    navigate(`/review/${replayId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 font-orbitron">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              物业园区
            </span>
          </h1>
          <h2 className="text-4xl font-bold mb-4 font-orbitron bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            停车缴费调度
          </h2>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            沉浸式3D互动体验，掌握物业园区停车管理完整流程
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Target className="text-blue-400" size={20} />
              选择难度
            </h3>
            <div className="space-y-3">
              {(Object.values(DIFFICULTY_CONFIGS) as typeof DIFFICULTY_CONFIGS[DifficultyId][]).map((config) => (
                <motion.button
                  key={config.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDifficulty(config.id as DifficultyId)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedDifficulty === config.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-2 border-blue-400 text-white'
                      : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{config.name}</div>
                      <div className="text-sm opacity-80">{config.description}</div>
                    </div>
                    {selectedDifficulty === config.id && (
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                        <Star className="text-blue-600" size={14} />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full py-5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow font-orbitron flex items-center justify-center gap-3"
          >
            <Play size={28} />
            开始游戏
          </motion.button>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAchievements(true)}
              className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 text-white hover:bg-slate-700/50 transition-colors"
            >
              <Trophy className="mx-auto mb-2 text-yellow-400" size={28} />
              <div className="text-sm font-medium">成就</div>
              <div className="text-xs text-slate-400">{unlockedAchievements.length}/{achievements.length}</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReplays(true)}
              className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 text-white hover:bg-slate-700/50 transition-colors"
            >
              <RotateCcw className="mx-auto mb-2 text-blue-400" size={28} />
              <div className="text-sm font-medium">历史回放</div>
              <div className="text-xs text-slate-400">{replays.length} 条记录</div>
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="w-full p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 text-white hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
          >
            <Settings size={20} />
            <span>游戏设置</span>
          </motion.button>
        </motion.div>

        {stats && stats.totalGames > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-4 gap-4 text-center"
          >
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
              <div className="text-xs text-slate-400">总场次</div>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
              <div className="text-xs text-slate-400">胜利</div>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-yellow-400">{stats.bestScore}</div>
              <div className="text-xs text-slate-400">最高分</div>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-orange-400">{stats.currentStreak}</div>
              <div className="text-xs text-slate-400">连胜</div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center gap-6 text-slate-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" />
            <span>WASD 移动</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <span>Shift 加速</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-green-500" />
            <span>鼠标 交互</span>
          </div>
        </motion.div>
      </div>

      {showReplays && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <RotateCcw className="text-blue-400" />
              历史回放
            </h3>
            {replays.length === 0 ? (
                <p className="text-slate-400 text-center py-8">暂无回放记录</p>
              ) : (
                <div className="space-y-3">
                  {replays.map((replay, index) => (
                    <motion.div
                      key={replay.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 cursor-pointer hover:bg-slate-700"
                      onClick={() => startReplay(replay.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">失败记录 #{index + 1}</div>
                          <div className="text-sm text-slate-400">
                            {DIFFICULTY_CONFIGS[replay.difficulty]?.name || '普通模式'} · {replay.finalScore} 分
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            失败原因: {replay.failureReason}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-400 text-sm">
                            卡顿 {replay.lagPoints.length} 处</div>
                          <div className="text-xs text-slate-500">
                            {new Date(replay.startTime).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <Play className="text-blue-400" size={24} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            <button
              onClick={() => setShowReplays(false)}
              className="mt-4 w-full py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-500 transition-colors"
            >
              关闭
            </button>
          </motion.div>
        </div>
      )}

      {showAchievements && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-400" />
              成就系统
            </h3>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>解锁进度</span>
                <span>{progress.unlocked}/{progress.total} ({progress.percentage.toFixed(0)}%)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border ${
                    achievement.isUnlocked
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-slate-700/30 border-slate-600/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{achievement.icon}</span>
                    <div>
                      <div className={`font-medium ${achievement.isUnlocked ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {achievement.description}
                      </div>
                      {achievement.isUnlocked && achievement.unlockedAt && (
                        <div className="text-xs text-yellow-500/70 mt-1">
                          {new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAchievements(false)}
              className="mt-4 w-full py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-500 transition-colors"
            >
              关闭
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
