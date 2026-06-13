import { useEffect } from 'react';
import {
  Trophy,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Home,
  FileBarChart,
  PlayCircle,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { ERROR_TYPE_LABELS, DEFECT_TYPES } from '@/utils/constants';
import { formatTime } from '@/utils/mockData';

interface GameOverModalProps {
  onReplay?: () => void;
  onHome?: () => void;
}

export default function GameOverModal({ onReplay, onHome }: GameOverModalProps) {
  const navigate = useNavigate();
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const correctCount = useGameStore((state) => state.correctCount);
  const wrongCount = useGameStore((state) => state.wrongCount);
  const totalTime = useGameStore((state) => state.totalTime);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const difficulty = useGameStore((state) => state.difficulty);
  const products = useGameStore((state) => state.products);
  const productErrors = useGameStore((state) => state.productErrors);
  const batches = useGameStore((state) => state.batches);
  const settlements = useGameStore((state) => state.settlements);
  const saveRecord = useGameStore((state) => state.saveRecord);
  const resetGame = useGameStore((state) => state.resetGame);

  const onTimeRate = useGameStore((state) => state.onTimeRate);

  const timeUsed = totalTime - timeRemaining;
  const totalProducts = products.length;
  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 0;

  const isWin = onTimeRate >= 70;

  useEffect(() => {
    if (phase === 'finished') {
      saveRecord();
    }
  }, [phase, saveRecord]);

  if (phase !== 'finished') return null;

  const errorDistribution: Record<string, number> = {};
  productErrors.forEach((e) => {
    errorDistribution[e.errorType] = (errorDistribution[e.errorType] || 0) + 1;
  });

  const settlementErrors = settlements.map((s) => {
    const batch = batches.find((b) => b.id === s.batchId);
    const completed = s.productIds.filter((pid) => {
      const err = productErrors.find((e) => e.productId === pid);
      return !err;
    }).length;
    const total = s.productIds.length;
    return {
      id: s.id,
      customerName: s.customerName,
      pickupCode: s.pickupCode,
      batchName: batch?.name,
      batchColor: batch?.color,
      completed,
      total,
      errors: productErrors.filter((e) => s.productIds.includes(e.productId)),
    };
  });

  const handleReplay = () => {
    resetGame();
    onReplay?.();
  };

  const handleHome = () => {
    resetGame();
    navigate('/');
    onHome?.();
  };

  const handleSettlement = () => {
    navigate('/settlement');
  };

  const handleStats = () => {
    navigate('/stats');
  };

  const handleReplayPage = () => {
    navigate('/replay');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div
          className={`p-6 border-b ${
            isWin
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30'
              : 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isWin ? 'bg-green-500/30' : 'bg-orange-500/30'
                }`}
              >
                <Trophy
                  className={`w-10 h-10 ${isWin ? 'text-green-400' : 'text-orange-400'}`}
                />
              </div>
              <div>
                <h2
                  className={`text-3xl font-bold ${
                    isWin ? 'text-green-400' : 'text-orange-400'
                  }`}
                >
                  {isWin ? '训练完成！' : '训练结束'}
                </h2>
                <p className="text-gray-400 mt-1">
                  {isWin
                    ? '恭喜，你的履约准时率达标！'
                    : '继续加油，提升你的核销效率'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">最终得分</div>
              <div className="text-5xl font-bold font-mono text-purple-400">
                {score.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">履约准时率</span>
              </div>
              <div
                className={`text-3xl font-bold font-mono ${
                  onTimeRate >= 70 ? 'text-green-400' : 'text-orange-400'
                }`}
              >
                {onTimeRate}%
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">准确率</span>
              </div>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {accuracy}%
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">用时</span>
              </div>
              <div className="text-3xl font-bold font-mono text-yellow-400">
                {formatTime(timeUsed)}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">难度</span>
              </div>
              <div className="text-3xl font-bold font-mono text-gray-300">
                {difficulty === 'easy' ? '简单' : difficulty === 'normal' ? '普通' : '困难'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">处理统计</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">正确核销</span>
                  <span className="text-green-400 font-bold text-xl font-mono">
                    {correctCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">错误核销</span>
                  <span className="text-red-400 font-bold text-xl font-mono">
                    {wrongCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">应处理商品</span>
                  <span className="text-gray-300 font-bold text-xl font-mono">
                    {totalProducts}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all" style={{ width: `${onTimeRate}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">错因分布</h3>
              </div>
              {Object.keys(errorDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(errorDistribution).map(([type, count]) => {
                    const total = productErrors.length;
                    const percentage = Math.round((count / total) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 text-sm">
                            {ERROR_TYPE_LABELS[type] || type}
                          </span>
                          <span className="text-red-400 font-mono text-sm">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  本次训练无错误，太棒了！
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">到货清单错因概览</h3>
              </div>
              <button
                onClick={handleSettlement}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
              >
                查看详情
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settlementErrors.map((s) => (
                <div
                  key={s.id}
                  className={`bg-gray-900/50 rounded-xl p-3 border ${
                    s.errors.length > 0 ? 'border-red-500/30' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.batchColor }}
                      />
                      <span className="font-medium text-gray-200">
                        {s.customerName}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400">
                        {s.pickupCode}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-mono ${
                        s.completed === s.total
                          ? 'text-green-400'
                          : s.errors.length > 0
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {s.completed}/{s.total}
                    </span>
                  </div>
                  {s.errors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.errors.map((e, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full"
                        >
                          {ERROR_TYPE_LABELS[e.errorType] || e.errorType}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleReplayPage}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
            >
              <PlayCircle className="w-5 h-5" />
              复盘回放
            </button>
            <button
              onClick={handleSettlement}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
            >
              <FileBarChart className="w-5 h-5" />
              结算详情
            </button>
            <button
              onClick={handleStats}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
            >
              <Gauge className="w-5 h-5" />
              统计分析
            </button>
            <button
              onClick={handleReplay}
              className="flex items-center gap-2 px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              再来一局
            </button>
            <button
              onClick={handleHome}
              className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all hover:scale-105 border border-gray-600"
            >
              <Home className="w-5 h-5" />
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
