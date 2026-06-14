import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, BarChart3, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import AssignmentPanel from './AssignmentPanel';
import QuestionPanel from './QuestionPanel';

export default function GameView() {
  const { setView, getCurrentChapter, getPlayer } = useGameStore();
  const chapter = getCurrentChapter();
  const player = getPlayer();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800 glass-dark">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('menu')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回主场景
          </button>
          
          {chapter && (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${chapter.color}30` }}
              >
                <span className="text-lg font-bold" style={{ color: chapter.color }}>
                  {chapter.order}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-white">{chapter.title}</h2>
                <p className="text-xs text-gray-400">{chapter.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {player && (
            <>
              <div className="flex items-center gap-2 text-yellow-400">
                <Star className="w-5 h-5" />
                <span className="font-bold">{player.totalScore}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Trophy className="w-5 h-5" />
                <span>Lv.{player.level}</span>
              </div>
            </>
          )}
          
          <button
            onClick={() => setView('leaderboard')}
            className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <Trophy className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('stats')}
            className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          <AssignmentPanel key="assignment" />
          <QuestionPanel key="question" />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
