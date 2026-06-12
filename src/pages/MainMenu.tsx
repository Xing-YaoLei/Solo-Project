import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, BookOpen, BarChart3, Users, Trophy, HelpCircle, Play, RotateCcw, Settings } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { storage } from '@/utils/storage';
import type { GameRecord } from '@/types/game';

export default function MainMenu() {
  const navigate = useNavigate();
  const { player, loadPlayer, initPlayer, resetPlayer, unlockedLevels, isTutorialCompleted } = usePlayerStore();
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [records, setRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    loadPlayer();
    const savedRecords = storage.loadRecords<GameRecord[]>([]);
    setRecords(savedRecords);
  }, [loadPlayer]);

  useEffect(() => {
    if (!player) {
      setShowNameInput(true);
    }
  }, [player]);

  const handleStartGame = () => {
    if (!player) {
      setShowNameInput(true);
      return;
    }
    if (!isTutorialCompleted) {
      navigate('/tutorial');
    } else {
      navigate('/levels');
    }
  };

  const handleInitPlayer = () => {
    if (playerName.trim()) {
      initPlayer(playerName.trim());
      setShowNameInput(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有进度吗？此操作不可撤销。')) {
      resetPlayer();
      setShowNameInput(true);
      setRecords([]);
    }
  };

  const totalStars = unlockedLevels.reduce((sum, u) => sum + u.stars, 0);
  const totalScore = player?.totalScore || 0;
  const completedLevels = unlockedLevels.filter(u => u.stars > 0).length;
  const bestRecord = records.length > 0 ? Math.max(...records.map(r => r.score)) : 0;

  const menuItems = [
    { icon: Play, label: '开始游戏', onClick: handleStartGame, primary: true },
    { icon: BookOpen, label: '关卡选择', onClick: () => navigate('/levels') },
    { icon: Users, label: '会员档案', onClick: () => navigate('/members') },
    { icon: BarChart3, label: '复盘中心', onClick: () => navigate('/review') },
    { icon: Trophy, label: '排行榜', onClick: () => navigate('/leaderboard') },
    { icon: HelpCircle, label: '游戏教程', onClick: () => navigate('/tutorial') },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#3E2723]">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#FF8F00]"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Coffee className="w-16 h-16 text-[#FF8F00]" />
            </motion.div>
            <h1 className="text-5xl font-bold text-gradient">咖啡连锁</h1>
          </div>
          <h2 className="text-3xl font-semibold text-[#FFF8E1] mb-2">会员储值调度</h2>
          <p className="text-[#8D6E63] text-lg">沉浸式解谜训练 · 提升续费率</p>
        </motion.div>

        {player && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-2xl p-6 mb-8 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8F00] to-[#FFB300] flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#3E2723]">
                    {player.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#FFF8E1]">{player.name}</h3>
                  <p className="text-[#8D6E63] text-sm">咖啡店长</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-[#FFF8E1]/10 transition-colors"
                title="重置进度"
              >
                <RotateCcw className="w-5 h-5 text-[#8D6E63]" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#FF8F00]">{totalScore}</p>
                <p className="text-xs text-[#8D6E63]">总积分</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#66BB6A]">{completedLevels}</p>
                <p className="text-xs text-[#8D6E63]">已通关</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FFB300]">{totalStars}</p>
                <p className="text-xs text-[#8D6E63]">星星</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#42A5F5]">{bestRecord}</p>
                <p className="text-xs text-[#8D6E63]">最高分</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 gap-4 w-full max-w-md"
        >
          {menuItems.map((item, index) => (
            <motion.button
              key={item.label}
              onClick={item.onClick}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`${
                item.primary ? 'btn-primary col-span-2' : 'btn-secondary'
              } flex items-center justify-center gap-3 py-4`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-[#8D6E63] text-sm"
        >
          <p>版本 1.0.0 · 专注会员运营能力提升</p>
        </motion.div>
      </div>

      {showNameInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-8 w-full max-w-md mx-4"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF8F00] to-[#FFB300] flex items-center justify-center">
                <Coffee className="w-10 h-10 text-[#3E2723]" />
              </div>
              <h2 className="text-2xl font-bold text-[#FFF8E1] mb-2">欢迎来到咖啡小镇</h2>
              <p className="text-[#8D6E63]">请输入你的名字开始店长生涯</p>
            </div>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的名字..."
              maxLength={10}
              className="w-full px-4 py-3 rounded-xl bg-[#FFF8E1]/10 border border-[#FFF8E1]/20 text-[#FFF8E1] placeholder-[#8D6E63] focus:outline-none focus:border-[#FF8F00] mb-6 text-center text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleInitPlayer()}
              autoFocus
            />

            <button
              onClick={handleInitPlayer}
              disabled={!playerName.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始冒险
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
