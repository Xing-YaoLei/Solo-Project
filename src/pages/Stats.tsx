import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Gauge,
  Target,
  Award,
  Clock,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Zap,
  Trash2,
} from 'lucide-react';
import { useStatsStore } from '@/store/useStatsStore';
import { ERROR_TYPE_LABELS, DEFECT_TYPES } from '@/utils/constants';
import { formatTime } from '@/utils/mockData';
import { clsx } from 'clsx';

export default function StatsPage() {
  const navigate = useNavigate();
  const loadStats = useStatsStore((state) => state.loadStats);
  const clearRecords = useStatsStore((state) => state.clearRecords);
  const totalGames = useStatsStore((state) => state.totalGames);
  const averageScore = useStatsStore((state) => state.averageScore);
  const averageOnTimeRate = useStatsStore((state) => state.averageOnTimeRate);
  const totalCorrect = useStatsStore((state) => state.totalCorrect);
  const totalWrong = useStatsStore((state) => state.totalWrong);
  const errorDistribution = useStatsStore((state) => state.errorDistribution);
  const recentRecords = useStatsStore((state) => state.recentRecords);
  const isLoaded = useStatsStore((state) => state.isLoaded);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalActions = totalCorrect + totalWrong;
  const accuracy = totalActions > 0 ? Math.round((totalCorrect / totalActions) * 100) : 0;

  const sortedErrors = useMemo(() => {
    return Object.entries(errorDistribution).sort((a, b) => b[1] - a[1]);
  }, [errorDistribution]);

  const totalErrors = Object.values(errorDistribution).reduce((a, b) => a + b, 0);

  const onTimeTrend = useMemo(() => {
    return recentRecords.slice(0, 10).map((r) => r.onTimeRate);
  }, [recentRecords]);

  const maxOnTimeTrend = Math.max(...onTimeTrend, 100);
  const minOnTimeTrend = Math.min(...onTimeTrend, 0);
  const trendRange = maxOnTimeTrend - minOnTimeTrend || 1;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearRecords = () => {
    if (window.confirm('确定要清空所有训练记录吗？此操作不可恢复。')) {
      clearRecords();
      loadStats();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all hover:scale-105 border border-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-cyan-400" />
                统计分析
              </h1>
              <p className="text-gray-500 mt-1">履约准时率跟踪与训练效果分析</p>
            </div>
          </div>
          {totalGames > 0 && (
            <button
              onClick={handleClearRecords}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              清空记录
            </button>
          )}
        </div>

        {!isLoaded || totalGames === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-16 text-center">
            <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">暂无统计数据</div>
            <div className="text-gray-600 text-sm mb-6">完成至少一局训练后即可查看统计分析</div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all hover:scale-105"
            >
              开始训练
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-purple-400 text-sm">
                  <Award className="w-4 h-4" />
                  训练总场次
                </div>
                <div className="text-4xl font-bold font-mono text-purple-400">
                  {totalGames}
                </div>
                <div className="text-xs text-gray-500 mt-2">累计训练次数</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-blue-400 text-sm">
                  <Target className="w-4 h-4" />
                  平均得分
                </div>
                <div className="text-4xl font-bold font-mono text-blue-400">
                  {averageScore.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">每场平均分</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-green-400 text-sm">
                  <Gauge className="w-4 h-4" />
                  履约准时率
                </div>
                <div
                  className={clsx(
                    'text-4xl font-bold font-mono',
                    averageOnTimeRate >= 70 ? 'text-green-400' : 'text-orange-400'
                  )}
                >
                  {averageOnTimeRate}%
                </div>
                <div className="flex items-center gap-1 text-xs mt-2">
                  {averageOnTimeRate >= 70 ? (
                    <><TrendingUp className="w-3 h-3 text-green-500" /> 达标</>
                  ) : (
                    <><TrendingDown className="w-3 h-3 text-orange-500" /> 待提升</>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-cyan-400 text-sm">
                  <Zap className="w-4 h-4" />
                  整体准确率
                </div>
                <div className="text-4xl font-bold font-mono text-cyan-400">
                  {accuracy}%
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {totalCorrect} 对 / {totalWrong} 错
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  履约率趋势
                </h2>
                <div className="h-48 flex items-end justify-between gap-2">
                  {onTimeTrend.reverse().map((rate, idx) => {
                    const height =
                      ((rate - minOnTimeTrend) / trendRange) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className={clsx(
                            'w-full rounded-t-lg transition-all',
                            rate >= 70
                              ? 'bg-gradient-to-t from-green-600 to-green-400'
                              : 'bg-gradient-to-t from-orange-600 to-orange-400'
                          )}
                          style={{
                            height: `${Math.max(height, 8)}%`,
                            minHeight: '8px',
                          }}
                        />
                        <span className="text-xs text-gray-500">#{onTimeTrend.length - idx}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
                  <span>最早</span>
                  <span>训练场次 (近{onTimeTrend.length}场)</span>
                  <span>最近</span>
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  错因分布统计
                  {totalErrors > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      （共 {totalErrors} 项）
                    </span>
                  )}
                </h2>
                {totalErrors === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                    <div className="text-green-400">暂未记录任何错误</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedErrors.map(([type, count]) => {
                      const percentage = Math.round((count / totalErrors) * 100);
                      const isShortage = type === 'shortage';
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isShortage && (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              )}
                              <span
                                className={clsx(
                                  'font-medium',
                                  isShortage ? 'text-red-400' : 'text-gray-300'
                                )}
                              >
                                {ERROR_TYPE_LABELS[type] || type}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span
                                className={clsx(
                                  'font-bold font-mono',
                                  isShortage ? 'text-red-400' : 'text-gray-200'
                                )}
                              >
                                {count}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full transition-all duration-500',
                                isShortage
                                  ? 'bg-gradient-to-r from-red-600 to-orange-500'
                                  : 'bg-gradient-to-r from-gray-600 to-gray-400'
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                训练记录明细
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-800">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">时间</th>
                      <th className="pb-3 font-medium">难度</th>
                      <th className="pb-3 font-medium">得分</th>
                      <th className="pb-3 font-medium">履约率</th>
                      <th className="pb-3 font-medium">正确</th>
                      <th className="pb-3 font-medium">错误</th>
                      <th className="pb-3 font-medium">用时</th>
                      <th className="pb-3 font-medium">主要错因</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentRecords.map((record, idx) => {
                      const topError = Object.entries(
                        record.errors.reduce(
                          (acc: Record<string, number>, e) => {
                            acc[e] = (acc[e] || 0) + 1;
                            return acc;
                          },
                          {}
                        )
                      ).sort((a, b) => b[1] - a[1])[0];
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-gray-800/50 hover:bg-gray-800/30"
                        >
                          <td className="py-4 text-gray-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-4 text-gray-400">
                            {formatDate(record.timestamp)}
                          </td>
                          <td className="py-4">
                            <span
                              className={clsx(
                                'px-2 py-1 rounded-lg text-xs',
                                record.difficulty === 'easy'
                                  ? 'bg-green-500/10 text-green-400'
                                  : record.difficulty === 'normal'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-orange-500/10 text-orange-400'
                              )}
                            >
                              {record.difficulty === 'easy'
                                ? '简单'
                                : record.difficulty === 'normal'
                                ? '普通'
                                : '困难'}
                            </span>
                          </td>
                          <td className="py-4 text-purple-400 font-bold font-mono">
                            {record.score.toLocaleString()}
                          </td>
                          <td className="py-4">
                            <span
                              className={clsx(
                                'font-bold font-mono',
                                record.onTimeRate >= 70
                                  ? 'text-green-400'
                                  : 'text-orange-400'
                              )}
                            >
                              {record.onTimeRate}%
                            </span>
                          </td>
                          <td className="py-4 text-green-400 font-mono">
                            {record.correctCount}
                          </td>
                          <td className="py-4 text-red-400 font-mono">
                            {record.wrongCount}
                          </td>
                          <td className="py-4 text-gray-400 font-mono">
                            {formatTime(record.timeUsed)}
                          </td>
                          <td className="py-4">
                            {topError ? (
                              <span
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor:
                                    DEFECT_TYPES[
                                      topError[0] as keyof typeof DEFECT_TYPES
                                    ]?.color + '20' || '#F53F3F20',
                                  color:
                                    DEFECT_TYPES[
                                      topError[0] as keyof typeof DEFECT_TYPES
                                    ]?.color || '#F53F3F',
                                }}
                              >
                                {ERROR_TYPE_LABELS[topError[0]] || topError[0]}
                              </span>
                            ) : (
                              <span className="text-green-500 text-xs">无错误</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
