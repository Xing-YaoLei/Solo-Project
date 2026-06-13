import { useEffect, useState } from 'react';
import {
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  Tag,
  FileText,
  Package,
  Zap,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { COLORS, ERROR_TYPE_LABELS, DEFECT_TYPES } from '@/utils/constants';
import { formatTime } from '@/utils/mockData';
import { clsx } from 'clsx';

interface GameHUDProps {
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onFinish?: () => void;
}

export default function GameHUD({
  onPause,
  onResume,
  onRestart,
  onFinish,
}: GameHUDProps) {
  const score = useGameStore((state) => state.score);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const totalTime = useGameStore((state) => state.totalTime);
  const correctCount = useGameStore((state) => state.correctCount);
  const wrongCount = useGameStore((state) => state.wrongCount);
  const phase = useGameStore((state) => state.phase);
  const difficulty = useGameStore((state) => state.difficulty);
  const warning = useGameStore((state) => state.warning);
  const batches = useGameStore((state) => state.batches);
  const settlements = useGameStore((state) => state.settlements);
  const products = useGameStore((state) => state.products);
  const processedProductIds = useGameStore((state) => state.processedProductIds);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const selectedProductId = useGameStore((state) => state.selectedProductId);
  const markDefective = useGameStore((state) => state.markDefective);

  const [showWarningFlash, setShowWarningFlash] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalProducts = products.length;
  const progress = totalProducts > 0
    ? Math.round(((correctCount + wrongCount) / totalProducts) * 100)
    : 0;

  useEffect(() => {
    if (warning.active) {
      setShowWarningFlash(true);
      const timer = setTimeout(() => setShowWarningFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [warning.active, warning.productIds.length]);

  const handlePauseToggle = () => {
    if (phase === 'playing') {
      pauseGame();
      onPause?.();
    } else if (phase === 'paused') {
      resumeGame();
      onResume?.();
    }
  };

  const handleRestart = () => {
    resetGame();
    onRestart?.();
  };

  const handleMarkDefective = () => {
    if (selectedProduct?.isDefective) {
      markDefective(selectedProduct.id);
    }
  };

  const timePercentage = (timeRemaining / totalTime) * 100;
  const timeColor = timePercentage > 50
    ? 'text-green-400'
    : timePercentage > 25
    ? 'text-yellow-400'
    : 'text-red-400';

  const defectiveUnprocessed = products.filter(
    (p) => p.isDefective && !processedProductIds.includes(p.id)
  ).length;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div
        className={clsx(
          'absolute inset-0 transition-opacity duration-300',
          showWarningFlash ? 'bg-red-500/10' : 'bg-transparent'
        )}
      />

      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="pointer-events-auto flex gap-3">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">剩余时间</span>
              </div>
              <div className={clsx('text-3xl font-bold font-mono', timeColor)}>
                {formatTime(timeRemaining)}
              </div>
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden w-32">
                <div
                  className={clsx(
                    'h-full transition-all duration-500',
                    timePercentage > 50
                      ? 'bg-green-500'
                      : timePercentage > 25
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-900/90 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">得分</span>
              </div>
              <div className="text-3xl font-bold text-purple-400 font-mono">
                {score.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                难度: {difficulty === 'easy' ? '简单' : difficulty === 'normal' ? '普通' : '困难'}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex gap-3">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">正确</span>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">
                {correctCount}
              </div>
            </div>

            <div className="bg-gray-900/90 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">错误</span>
              </div>
              <div className="text-2xl font-bold text-red-400 font-mono">
                {wrongCount}
              </div>
            </div>

            <div className="bg-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">进度</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {progress}%
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex flex-col gap-2">
            <button
              onClick={handlePauseToggle}
              className="bg-gray-900/90 backdrop-blur-sm border border-gray-600 hover:border-blue-500 rounded-xl p-3 transition-all hover:scale-105"
            >
              {phase === 'playing' ? (
                <Pause className="w-5 h-5 text-gray-300" />
              ) : (
                <Play className="w-5 h-5 text-gray-300" />
              )}
            </button>
            <button
              onClick={handleRestart}
              className="bg-gray-900/90 backdrop-blur-sm border border-gray-600 hover:border-yellow-500 rounded-xl p-3 transition-all hover:scale-105"
            >
              <RotateCcw className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-36 left-4 pointer-events-auto">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-600 rounded-xl p-4 shadow-lg w-56">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-gray-200">团购批次</span>
          </div>
          <div className="space-y-2">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: batch.color }}
                />
                <span className="text-gray-300 flex-1">{batch.name}</span>
                <span className="text-gray-500">
                  {settlements.filter((s) => s.batchId === batch.id).length}单
                </span>
              </div>
            ))}
          </div>
          {defectiveUnprocessed > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{defectiveUnprocessed} 个异常待处理</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-36 right-4 pointer-events-auto">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-600 rounded-xl p-4 shadow-lg w-64">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-gray-200">结算单列表</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {settlements.map((s) => {
              const batch = batches.find((b) => b.id === s.batchId);
              const completed = s.productIds.filter((pid) =>
                processedProductIds.includes(pid)
              ).length;
              const total = s.productIds.length;
              return (
                <div
                  key={s.id}
                  className="bg-gray-800/50 rounded-lg p-2 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-200">
                      {s.customerName}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px]"
                      style={{
                        backgroundColor: (batch?.color || '#888') + '40',
                        color: batch?.color,
                      }}
                    >
                      {s.pickupCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>{completed}/{total} 件</span>
                    <span>¥{s.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(completed / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {warning.active && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="bg-orange-500/90 backdrop-blur-sm border-2 border-orange-300 rounded-2xl px-8 py-4 shadow-2xl animate-pulse"
            style={{ opacity: 0.5 + warning.intensity * 0.5 }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
              <div>
                <div className="text-white font-bold text-lg">
                  {warning.message}
                </div>
                <div className="text-orange-100 text-sm">
                  请及时处理异常商品，避免失败
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-blue-500/50 rounded-2xl p-4 shadow-2xl max-w-lg">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: selectedProduct.tagColor + '30' }}
              >
                <Tag
                  className="w-8 h-8"
                  style={{ color: selectedProduct.tagColor }}
                />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-white mb-1">
                  {selectedProduct.name}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                  <div>SKU: {selectedProduct.sku}</div>
                  <div>分类: {selectedProduct.category}</div>
                  <div>价格: ¥{selectedProduct.price.toFixed(2)}</div>
                  <div>数量: x{selectedProduct.quantity}</div>
                  <div>
                    批次:{' '}
                    <span style={{ color: selectedProduct.tagColor }}>
                      {batches.find((b) => b.id === selectedProduct.batchId)?.name}
                    </span>
                  </div>
                </div>
                {selectedProduct.isDefective && (
                  <div
                    className="text-xs px-2 py-1 rounded inline-flex items-center gap-1 mb-2"
                    style={{
                      backgroundColor:
                        DEFECT_TYPES[
                          selectedProduct.defectType as keyof typeof DEFECT_TYPES
                        ]?.color + '30',
                      color:
                        DEFECT_TYPES[
                          selectedProduct.defectType as keyof typeof DEFECT_TYPES
                        ]?.color,
                    }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    异常:{' '}
                    {
                      DEFECT_TYPES[
                        selectedProduct.defectType as keyof typeof DEFECT_TYPES
                      ]?.label
                    }
                  </div>
                )}
              </div>
              {selectedProduct.isDefective && (
                <button
                  onClick={handleMarkDefective}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all hover:scale-105 shrink-0 self-center"
                >
                  标记异常
                </button>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700 text-center text-xs text-gray-500">
              点击对应的结算柜台投放商品
              {selectedProduct.isDefective && '，或点击上方按钮标记异常'}
            </div>
          </div>
        </div>
      )}

      {phase === 'paused' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-3xl p-8 shadow-2xl text-center">
            <Pause className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-2">游戏暂停</div>
            <div className="text-gray-400 mb-6">点击继续按钮恢复游戏</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handlePauseToggle}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              >
                继续游戏
              </button>
              <button
                onClick={handleRestart}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              >
                重新开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
