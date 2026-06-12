import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Star, Trophy, Clock, Target, Coffee } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Level, UnlockedLevel } from '@/types/game';

import level1Config from '@/config/levels/level-1.json';
import level2Config from '@/config/levels/level-2.json';
import level3Config from '@/config/levels/level-3.json';

const levels: Level[] = [level1Config as Level, level2Config as Level, level3Config as Level];

const difficultyConfig: Record<number, { label: string; color: string; bgColor: string }> = {
  1: { label: '简单', color: 'text-[#66BB6A]', bgColor: 'bg-[#66BB6A]/20' },
  2: { label: '中等', color: 'text-[#FFA726]', bgColor: 'bg-[#FFA726]/20' },
  3: { label: '困难', color: 'text-[#EF5350]', bgColor: 'bg-[#EF5350]/20' },
};

export default function LevelSelect() {
  const navigate = useNavigate();
  const { player, loadPlayer, unlockedLevels } = usePlayerStore();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  const getUnlockedInfo = (levelId: string): UnlockedLevel | undefined => {
    return unlockedLevels.find((u) => u.levelId === levelId);
  };

  const isLevelUnlocked = (levelId: string): boolean => {
    const info = getUnlockedInfo(levelId);
    return info?.isUnlocked ?? false;
  };

  const handleLevelClick = (level: Level) => {
    if (isLevelUnlocked(level.id)) {
      setSelectedLevel(level);
    }
  };

  const handleStartLevel = () => {
    if (selectedLevel && player) {
      navigate(`/game/${selectedLevel.id}`);
    }
  };

  const renderStars = (count: number, maxStars: number = 3) => {
    return (
      <div className="flex gap-1">
        {[...Array(maxStars)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < count ? 'text-[#FFB300] fill-[#FFB300]' : 'text-[#5D4037]'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#3E2723]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#FF8F00]/10"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light hover:bg-[#FFF8E1]/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </motion.button>

          <h1 className="text-3xl font-bold text-gradient">选择关卡</h1>

          <div className="w-24" />
        </div>

        {player && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 mb-8 flex items-center justify-around"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FF8F00]">{player.totalScore}</p>
              <p className="text-xs text-[#8D6E63]">总积分</p>
            </div>
            <div className="w-px h-10 bg-[#FFF8E1]/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-[#66BB6A]">
                {unlockedLevels.filter((u) => u.stars > 0).length}
              </p>
              <p className="text-xs text-[#8D6E63]">已通关</p>
            </div>
            <div className="w-px h-10 bg-[#FFF8E1]/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FFB300]">
                {unlockedLevels.reduce((sum, u) => sum + u.stars, 0)}
              </p>
              <p className="text-xs text-[#8D6E63]">星星</p>
            </div>
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {levels.map((level, index) => {
              const unlocked = isLevelUnlocked(level.id);
              const levelInfo = getUnlockedInfo(level.id);
              const difficulty = difficultyConfig[level.difficulty];

              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={unlocked ? { scale: 1.02, y: -5 } : {}}
                  onClick={() => handleLevelClick(level)}
                  className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                    !unlocked ? 'opacity-60 cursor-not-allowed' : ''
                  } ${selectedLevel?.id === level.id ? 'ring-2 ring-[#FF8F00]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${difficulty.bgColor} ${difficulty.color}`}
                    >
                      {difficulty.label}
                    </div>
                    {!unlocked && <Lock className="w-6 h-6 text-[#8D6E63]" />}
                    {unlocked && levelInfo && renderStars(levelInfo.stars)}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF8F00] to-[#FFB300] flex items-center justify-center">
                      <Coffee className="w-7 h-7 text-[#3E2723]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#FFF8E1]">{level.name}</h3>
                      <p className="text-sm text-[#8D6E63]">第 {level.difficulty} 关</p>
                    </div>
                  </div>

                  <p className="text-[#8D6E63] text-sm mb-4 line-clamp-2">{level.description}</p>

                  <div className="flex items-center gap-4 text-sm text-[#8D6E63]">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{level.taskIds.length} 个任务</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span>{level.minScore} 分及格</span>
                    </div>
                  </div>

                  {unlocked && levelInfo && levelInfo.bestScore > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#FFF8E1]/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#8D6E63]">最高分</span>
                        <span className="text-lg font-bold text-[#FF8F00]">{levelInfo.bestScore}</span>
                      </div>
                    </div>
                  )}

                  {!unlocked && (
                    <div className="mt-4 pt-4 border-t border-[#FFF8E1]/10">
                      <p className="text-sm text-[#8D6E63] italic">{level.unlockHint}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {selectedLevel && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 mt-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#FFF8E1] mb-1">{selectedLevel.name}</h3>
                <p className="text-[#8D6E63] text-sm">{selectedLevel.backgroundStory}</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLevel(null)}
                  className="btn-secondary"
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartLevel}
                  className="btn-primary flex items-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  开始挑战
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
