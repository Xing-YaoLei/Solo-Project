import { motion } from 'framer-motion';
import { Trophy, BarChart3, Play, RotateCcw, HelpCircle, Dumbbell, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function MainMenu() {
  const { setView, getPlayer, resetGame, resetTutorial, chapters } = useGameStore();
  const player = getPlayer();

  const totalProgress = chapters.reduce((sum, c) => sum + c.progress, 0) / chapters.length;
  const completedChapters = chapters.filter(c => c.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8"
    >
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl"
        >
          <Dumbbell className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-bold text-white mb-4 text-shadow"
        >
          健身私教课程
          <span className="block gradient-text">消耗调度解谜</span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-400 max-w-md mx-auto"
        >
          通过解谜游戏学习私教课程消耗管理，成为优秀的健身教练！
        </motion.p>
      </div>

      {player && player.totalScore > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-6 mb-8"
        >
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">{player.avatar}</div>
            <div className="text-gray-400 text-sm">{player.name}</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{player.totalScore}</div>
            <div className="text-gray-400 text-sm">总积分</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{completedChapters}/{chapters.length}</div>
            <div className="text-gray-400 text-sm">已完成章节</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{Math.round(totalProgress)}%</div>
            <div className="text-gray-400 text-sm">总体进度</div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid gap-4 w-full max-w-md"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setView('menu')}
          className="flex items-center justify-center gap-3 w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
        >
          <Play className="w-6 h-6" />
          开始游戏
        </motion.button>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('leaderboard')}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl glass text-white font-semibold hover:bg-white/10 transition-colors"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            排行榜
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('stats')}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl glass text-white font-semibold hover:bg-white/10 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-blue-400" />
            训练统计
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetTutorial}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl glass text-white font-semibold hover:bg-white/10 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-purple-400" />
            新手引导
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetGame}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl glass text-white font-semibold hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-red-400" />
            重置游戏
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center text-gray-500 text-sm"
      >
        <p>💡 提示：在3D场景中可以旋转视角查看课程章节卡片</p>
        <p className="mt-1">点击已解锁的章节卡片开始学习</p>
      </motion.div>
    </motion.div>
  );
}
