import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Target, ArrowLeft, Medal, Crown } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LeaderboardType } from '../types';

export default function Leaderboard() {
  const { setView, getLeaderboard, chapters } = useGameStore();
  const [type, setType] = useState<LeaderboardType>('completionRate');
  const [selectedChapter, setSelectedChapter] = useState<string | undefined>();

  const leaderboardData = getLeaderboard(type, selectedChapter);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{rank}</span>;
    }
  };

  const formatValue = (value: number, type: LeaderboardType) => {
    if (type === 'completionRate') {
      return `${value}%`;
    }
    const minutes = Math.floor(value / 60000);
    const seconds = Math.floor((value % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col p-8 overflow-y-auto"
    >
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView('menu')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回主菜单
          </button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            排行榜
          </h1>
          <div className="w-32" />
        </div>

        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="flex gap-2 p-1 rounded-xl glass">
            <button
              onClick={() => setType('completionRate')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                type === 'completionRate'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Target className="w-5 h-5" />
              完成率排行
            </button>
            <button
              onClick={() => setType('time')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                type === 'time'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              完成时间排行
            </button>
          </div>

          <select
            value={selectedChapter || ''}
            onChange={(e) => setSelectedChapter(e.target.value || undefined)}
            className="px-4 py-3 rounded-xl glass bg-transparent text-white border-none outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-800">全部章节</option>
            {chapters.map(chapter => (
              <option key={chapter.id} value={chapter.id} className="bg-slate-800">
                {chapter.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4">
          {leaderboardData.map((entry, index) => (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                entry.playerId === 'player'
                  ? 'border-primary bg-primary/10'
                  : entry.rank <= 3
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="text-4xl">{entry.avatar}</div>

                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${
                    entry.playerId === 'player' ? 'text-primary' : 'text-white'
                  }`}>
                    {entry.playerName}
                    {entry.playerId === 'player' && (
                      <span className="ml-2 text-sm font-normal text-primary">(你)</span>
                    )}
                  </h3>
                </div>

                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    type === 'completionRate'
                      ? 'text-green-400'
                      : 'text-blue-400'
                  }`}>
                    {formatValue(entry.value, type)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {type === 'completionRate' ? '完成率' : '总用时'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-2xl glass">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            排行规则说明
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">完成率排行</h4>
                <p className="text-sm">按照正确答题数占总题数的百分比排名，鼓励准确性。</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">完成时间排行</h4>
                <p className="text-sm">按照完成所有题目所用的总时间排名，奖励速度。</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-yellow-400 text-sm">
            💡 提示：我们不只奖励速度，完成率同样重要！保持高正确率可以在完成率排行榜上获得好名次。
          </p>
        </div>
      </div>
    </motion.div>
  );
}
