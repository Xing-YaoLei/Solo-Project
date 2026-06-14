import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, BarChart3, Home, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function MenuOverlay() {
  const { currentView, setView, getPlayer, chapters } = useGameStore();
  const player = getPlayer();

  if (currentView !== 'menu') return null;

  const totalProgress = chapters.reduce((sum, c) => sum + c.progress, 0) / chapters.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-0 left-0 right-0 z-30 p-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="text-2xl">{player?.avatar || '🏋️'}</div>
              <div>
                <div className="text-white font-semibold">{player?.name || '教练'}</div>
                <div className="text-xs text-gray-400">Lv.{player?.level || 1}</div>
              </div>
            </div>
            
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-bold">{player?.totalScore || 0}</span>
              <span className="text-gray-400 text-sm">积分</span>
            </div>

            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                />
              </div>
              <span className="text-green-400 font-bold">{Math.round(totalProgress)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('menu')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                currentView === 'menu'
                  ? 'bg-primary text-white'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-5 h-5" />
              主场景
            </button>
            <button
              onClick={() => setView('leaderboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-gray-400 hover:text-white transition-colors"
            >
              <Trophy className="w-5 h-5" />
              排行榜
            </button>
            <button
              onClick={() => setView('stats')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-gray-400 hover:text-white transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              统计
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
