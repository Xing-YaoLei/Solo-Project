import { motion } from 'framer-motion';
import { 
  BarChart3, ArrowLeft, TrendingUp, Clock, Target, 
  Award, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

export default function StatsPage() {
  const { setView, getStats, chapters } = useGameStore();
  const stats = getStats();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatForChapter = (chapterId: string) => {
    return stats.find(s => s.chapterId === chapterId);
  };

  const getChapterColor = (chapterId: string) => {
    return chapters.find(c => c.id === chapterId)?.color || '#3b82f6';
  };

  const maxCompletionRate = Math.max(...stats.map(s => s.completionRate), 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col p-8 overflow-y-auto"
    >
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView('menu')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回主菜单
          </button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-blue-400" />
            训练统计
          </h1>
          <div className="w-32" />
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl glass"
          >
            <Target className="w-8 h-8 text-green-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {stats.length > 0
                ? Math.round(stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length)
                : 0}%
            </div>
            <div className="text-gray-400 text-sm">平均完成率</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl glass"
          >
            <Award className="w-8 h-8 text-yellow-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {stats.reduce((sum, s) => sum + s.correctAnswers, 0)}
            </div>
            <div className="text-gray-400 text-sm">正确答题数</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl glass"
          >
            <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {stats.reduce((sum, s) => sum + s.attempts, 0)}
            </div>
            <div className="text-gray-400 text-sm">总尝试次数</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl glass"
          >
            <Clock className="w-8 h-8 text-purple-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">
              {formatTime(stats.reduce((sum, s) => sum + s.timeSpent, 0))}
            </div>
            <div className="text-gray-400 text-sm">总学习时间</div>
          </motion.div>
        </div>

        <div className="p-6 rounded-2xl glass mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            各章节完成率对比
          </h2>
          <div className="space-y-4">
            {chapters.map((chapter, index) => {
              const stat = getStatForChapter(chapter.id);
              const completionRate = stat?.completionRate || 0;
              const color = getChapterColor(chapter.id);

              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{chapter.title}</span>
                    <span className="font-bold" style={{ color }}>{completionRate}%</span>
                  </div>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(completionRate / maxCompletionRate) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-400" />
          章节详细统计
        </h2>

        <div className="space-y-4">
          {chapters.map((chapter, index) => {
            const stat = getStatForChapter(chapter.id);
            const color = getChapterColor(chapter.id);
            const isExpanded = expandedChapter === chapter.id;

            if (!stat) {
              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-2xl border-2 border-gray-700 bg-gray-800/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-500">{chapter.title}</h3>
                      <p className="text-gray-600 text-sm">尚未开始学习</p>
                    </div>
                    <span className="text-gray-600">--</span>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border-2 overflow-hidden"
                style={{ borderColor: `${color}50` }}
              >
                <div
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                  className="p-6 cursor-pointer transition-all"
                  style={{ backgroundColor: `${color}10` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}30` }}
                      >
                        <span className="text-2xl">{chapter.order}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{chapter.title}</h3>
                        <p className="text-gray-400 text-sm">
                          上次学习: {formatDate(stat.lastPlayedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color }}>
                          {stat.completionRate}%
                        </div>
                        <div className="text-gray-400 text-xs">完成率</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-800/50 p-6"
                  >
                    <div className="grid md:grid-cols-4 gap-6">
                      <div className="text-center p-4 rounded-xl bg-gray-700/30">
                        <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {stat.correctAnswers}/{stat.totalQuestions}
                        </div>
                        <div className="text-gray-400 text-sm">正确/总题数</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gray-700/30">
                        <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {formatTime(stat.timeSpent)}
                        </div>
                        <div className="text-gray-400 text-sm">总用时</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gray-700/30">
                        <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {stat.attempts}
                        </div>
                        <div className="text-gray-400 text-sm">尝试次数</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gray-700/30">
                        <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {stat.averageScore}%
                        </div>
                        <div className="text-gray-400 text-sm">平均得分</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 p-6 rounded-2xl glass">
          <h3 className="text-xl font-bold text-white mb-4">📊 训练差异分析</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-400 font-semibold mb-2">优势领域</h4>
              {stats
                .filter(s => s.completionRate >= 70)
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 3)
                .map(stat => (
                  <div key={stat.chapterId} className="flex items-center gap-2 text-gray-300 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    {stat.chapterTitle}: {stat.completionRate}%
                  </div>
                ))}
              {stats.filter(s => s.completionRate >= 70).length === 0 && (
                <p className="text-gray-500">继续努力，完成更多章节！</p>
              )}
            </div>
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2">待提升领域</h4>
              {stats
                .filter(s => s.completionRate < 70)
                .sort((a, b) => a.completionRate - b.completionRate)
                .slice(0, 3)
                .map(stat => (
                  <div key={stat.chapterId} className="flex items-center gap-2 text-gray-300 mb-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    {stat.chapterTitle}: {stat.completionRate}%
                  </div>
                ))}
              {stats.filter(s => s.completionRate < 70).length === 0 && (
                <p className="text-gray-500">太棒了！所有章节表现优秀！</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
