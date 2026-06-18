import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { InventoryPanel } from './InventoryPanel';
import { UsageRecordsPanel } from './UsageRecordsPanel';
import { DeliveryPanel } from './DeliveryPanel';
import { EventNotifications } from './EventNotifications';
import { ItemBar } from './ItemBar';
import { ScheduleDeliveryModal } from './ScheduleDeliveryModal';
import { formatTime } from '../../utils/gameUtils';

export function GameUI() {
  const currentDay = useGameStore(state => state.currentDay);
  const score = useGameStore(state => state.score);
  const totalScore = useGameStore(state => state.totalScore);
  const isPaused = useGameStore(state => state.isPaused);
  const difficulty = useGameStore(state => state.difficulty);
  const suppliers = useGameStore(state => state.suppliers);
  const nextDay = useGameStore(state => state.nextDay);
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);
  const backToMenu = useGameStore(state => state.backToMenu);
  const statistics = useGameStore(state => state.statistics);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - statistics.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, statistics.startTime]);

  const scorePercentage = Math.round((score / totalScore) * 100);

  const getDifficultyText = () => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <div>
                <div className="text-white font-bold text-lg">第 {currentDay} 天</div>
                <div className="text-blue-300 text-sm">工期进行中</div>
              </div>
            </div>

            <div className="h-10 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-white font-bold">{formatTime(elapsedTime)}</div>
                <div className="text-blue-300 text-sm">已用时间</div>
              </div>
            </div>

            <div className="h-10 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="text-white font-bold">{score} / {totalScore}</div>
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      scorePercentage >= 70 ? 'bg-green-500' :
                      scorePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="h-10 w-px bg-white/20" />

            <div className={`font-bold ${getDifficultyColor()}`}>
              {getDifficultyText()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => isPaused ? resumeGame() : pauseGame()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
            </button>
            <button
              onClick={backToMenu}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-colors"
            >
              🏠 返回菜单
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-24 right-4 w-80 space-y-4 pointer-events-auto">
        <InventoryPanel />
        <EventNotifications />
      </div>

      <div className="absolute top-24 left-4 w-80 space-y-4 pointer-events-auto">
        <DeliveryPanel onSchedule={() => setShowScheduleModal(true)} />
        <UsageRecordsPanel />
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-4 bg-black/70 backdrop-blur-lg rounded-xl p-4">
          <ItemBar />
          <div className="h-12 w-px bg-white/20" />
          <button
            onClick={nextDay}
            disabled={isPaused}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            ⏭️ 下一天
          </button>
        </div>
      </div>

      {suppliers.length > 0 && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-lg rounded-xl p-3">
            <div className="text-white text-sm font-bold mb-2">🏢 供应商快捷下单</div>
            <div className="flex gap-2">
              {suppliers.map(supplier => (
                <button
                  key={supplier.id}
                  onClick={() => {
                    setSelectedSupplier(supplier.id);
                    setShowScheduleModal(true);
                  }}
                  className="px-3 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-lg text-sm transition-colors"
                  title={supplier.name}
                >
                  {supplier.name.substring(0, 4)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <ScheduleDeliveryModal
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedSupplier(null);
          }}
          preselectedSupplier={selectedSupplier}
        />
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⏸️</div>
            <h2 className="text-3xl font-bold text-white mb-4">游戏暂停</h2>
            <p className="text-blue-200 mb-6">点击继续按钮恢复游戏</p>
            <button
              onClick={resumeGame}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl text-xl"
            >
              ▶️ 继续游戏
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
