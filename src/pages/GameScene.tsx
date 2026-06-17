import { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ParkingScene } from '@/components/three/ParkingScene';
import { GameHUD } from '@/components/hud/GameHUD';
import { BillPanel } from '@/components/hud/BillPanel';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useAchievements } from '@/hooks/useAchievements';
import { loadSettings, saveStats, loadStats } from '@/utils/storage';
import type { DifficultyId, GameStats } from '@/types';
import { AlertTriangle, CheckCircle, Home, RotateCcw, Trophy } from 'lucide-react';
import { DIFFICULTY_CONFIGS } from '@/config/difficulty';

interface BillPanelContextType {
  activeBillId: string | null;
  openBillPanel: (billId: string) => void;
  closeBillPanel: () => void;
}

export const BillPanelContext = createContext<BillPanelContextType>({
  activeBillId: null,
  openBillPanel: () => {},
  closeBillPanel: () => {},
});

export const useBillPanel = () => useContext(BillPanelContext);

export const GameScene = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<{
    success: boolean;
    score: number;
    accuracy: number;
    efficiency: number;
    emergencyHandling: number;
  } | null>(null);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);

  const difficulty = (searchParams.get('difficulty') as DifficultyId) || 'normal';
  const initGame = useGameStore(state => state.initGame);
  const gameState = useGameStore(state => ({
    phase: state.phase,
    isFailed: state.isFailed,
    failureReason: state.failureReason,
    score: state.score,
    sessionId: state.sessionId,
  }));
  const endGame = useGameStore(state => state.endGame);

  const startRecording = useReplayStore(state => state.startRecording);
  const stopRecording = useReplayStore(state => state.stopRecording);
  const { checkAndUnlockAchievements } = useAchievements();
  const trackEvent = useAnalyticsStore(state => state.trackEvent);

  useEffect(() => {
    initGame(difficulty);
    startRecording(gameState.sessionId, difficulty);
    trackEvent('game_start', { difficulty, sessionId: gameState.sessionId });
    loadSettings();
  }, [difficulty, initGame, startRecording, gameState.sessionId, trackEvent]);

  useEffect(() => {
    if (gameState.phase === 'ended' && !showResult) {
      const result = endGame(!gameState.isFailed);
      setGameResult({
        success: !gameState.isFailed,
        ...result,
      });

      const replay = stopRecording(!gameState.isFailed, result.score, gameState.failureReason);
      const currentStats = loadStats();
      const gameTime = (Date.now() - useGameStore.getState().realStartTime) / 1000;
      const lagPoints = useReplayStore.getState().lagPoints;
      
      checkAndUnlockAchievements({
        score: result.score,
        time: gameTime,
        accuracy: result.accuracy,
        streak: !gameState.isFailed ? currentStats.currentStreak + 1 : 0,
        difficulty,
        noLagPoints: lagPoints.length === 0,
      });

      const gameStateFull = useGameStore.getState();
      const resolvedEmergencies = gameStateFull.emergencies.filter(e => e.isResolved).length;
      
      const updatedStats: GameStats = {
        totalGames: currentStats.totalGames + 1,
        wins: currentStats.wins + (!gameState.isFailed ? 1 : 0),
        bestScore: Math.max(currentStats.bestScore, result.score),
        bestTime: !gameState.isFailed ? Math.min(currentStats.bestTime, gameTime) : currentStats.bestTime,
        currentStreak: !gameState.isFailed ? currentStats.currentStreak + 1 : 0,
        bestStreak: Math.max(currentStats.bestStreak, !gameState.isFailed ? currentStats.currentStreak + 1 : 0),
        totalEmergenciesHandled: currentStats.totalEmergenciesHandled + resolvedEmergencies,
        totalPlayTime: currentStats.totalPlayTime + Math.floor(gameTime),
      };
      saveStats(updatedStats);

      trackEvent('game_end', {
        success: !gameState.isFailed,
        score: result.score,
        accuracy: result.accuracy,
        efficiency: result.efficiency,
        emergencyHandling: result.emergencyHandling,
        failureReason: gameState.failureReason,
        replayId: replay?.id,
      });

      setShowResult(true);
    }
  }, [gameState.phase, gameState.isFailed, gameState.failureReason, showResult, endGame, stopRecording, checkAndUnlockAchievements, trackEvent, difficulty]);

  const handleGoToMenu = () => {
    navigate('/');
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setGameResult(null);
    initGame(difficulty);
    startRecording(useGameStore.getState().sessionId, difficulty);
  };

  const handleGoToReview = () => {
    if (gameResult?.success) {
      navigate('/review/success', {
        state: {
          result: gameResult,
          difficulty,
        },
      });
    } else {
      const replays = useReplayStore.getState().replays;
      const latestReplay = replays[replays.length - 1];
      if (latestReplay) {
        navigate(`/review/${latestReplay.id}`);
      }
    }
  };

  const openBillPanel = (billId: string) => {
    setActiveBillId(billId);
  };

  const closeBillPanel = () => {
    setActiveBillId(null);
  };

  return (
    <BillPanelContext.Provider value={{ activeBillId, openBillPanel, closeBillPanel }}>
      <div className="w-screen h-screen bg-slate-900 relative overflow-hidden">
        <ParkingScene />
        <GameHUD />
        {activeBillId && (
          <BillPanel billId={activeBillId} onClose={closeBillPanel} />
        )}

      <AnimatePresence>
        {showResult && gameResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-slate-800 rounded-3xl p-8 w-full max-w-lg border border-slate-700 shadow-2xl"
            >
              <div className="text-center mb-8">
                {gameResult.success ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="text-white" size={48} />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-orbitron">任务完成!</h2>
                    <p className="text-slate-400">恭喜你成功完成了物业园区停车管理任务</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center"
                    >
                      <AlertTriangle className="text-white" size={48} />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-orbitron">任务失败</h2>
                    <p className="text-slate-400">失败原因: {gameState.failureReason || '未知原因'}</p>
                  </>
                )}
              </div>

              <div className="bg-slate-700/50 rounded-2xl p-5 mb-6">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold font-orbitron bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {gameResult.score}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">最终得分</div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-2xl font-bold ${gameResult.accuracy >= 80 ? 'text-green-400' : gameResult.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {gameResult.accuracy}%
                    </div>
                    <div className="text-xs text-slate-400">准确率</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${gameResult.efficiency >= 80 ? 'text-green-400' : gameResult.efficiency >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {gameResult.efficiency}%
                    </div>
                    <div className="text-xs text-slate-400">效率</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${gameResult.emergencyHandling >= 80 ? 'text-green-400' : gameResult.emergencyHandling >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {gameResult.emergencyHandling}%
                    </div>
                    <div className="text-xs text-slate-400">应急处理</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">难度模式</span>
                    <span className="text-white font-medium">
                      {DIFFICULTY_CONFIGS[difficulty]?.name || '普通模式'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoToReview}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-shadow flex items-center justify-center gap-2"
                >
                  <Trophy size={20} />
                  {gameResult.success ? '查看复盘报告' : '查看失败回放'}
                </motion.button>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlayAgain}
                    className="py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    再来一局
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToMenu}
                    className="py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Home size={18} />
                    返回菜单
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </BillPanelContext.Provider>
  );
};
