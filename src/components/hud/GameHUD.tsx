import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, AlertTriangle, CheckCircle, XCircle, Pause, Play, Home, Settings, Zap } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { usePatrol } from '@/hooks/usePatrol';
import { useBilling } from '@/hooks/useBilling';
import { useEmergency } from '@/hooks/useEmergency';
import { useAccessControl } from '@/hooks/useAccessControl';
import { formatTime, formatCurrency, formatGameTime } from '@/utils/math';
import { DIFFICULTY_CONFIGS } from '@/config/difficulty';
import { ITEMS } from '@/config/items';

const phaseNames: Record<string, string> = {
  access_control: '门禁登记',
  billing: '账单管理',
  patrol: '巡检路线',
  emergency: '应急处理',
  settlement: '费用结算',
  ended: '游戏结束',
};

export const GameHUD = () => {
  const gameState = useGameStore(state => ({
    phase: state.phase,
    gameTime: state.gameTime,
    score: state.score,
    accuracy: state.accuracy,
    difficulty: state.difficulty,
    isPaused: state.isPaused,
    isFailed: state.isFailed,
    failureReason: state.failureReason,
    playerPosition: state.playerPosition,
    accessRecords: state.accessRecords,
    itemCooldowns: state.itemCooldowns,
    itemUsedAt: state.itemUsedAt,
    activeHint: state.activeHint,
  }));
  
  const { progress: patrolProgress, currentTarget, distanceToTarget } = usePatrol();
  const { unpaidBills, paidAmount, pendingAmount, totalAmount } = useBilling();
  const { hasActiveEmergency, timeRemaining, activeEmergency, getEmergencyIcon, isTimeRunningOut } = useEmergency();
  const { unprocessedRecords } = useAccessControl();
  
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);
  const useItem = useGameStore(state => state.useItem);
  const getItemCooldown = useGameStore(state => state.getItemCooldown);
  
  const realTime = Math.floor((Date.now() - useGameStore.getState().realStartTime) / 1000);
  const difficultyConfig = DIFFICULTY_CONFIGS[gameState.difficulty];

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl font-bold text-white font-orbitron">
              {formatTime(realTime)}
            </div>
            <div className="text-sm text-slate-400">
              <div>游戏时间: {formatGameTime(gameState.gameTime)}</div>
              <div className="text-xs mt-1">{difficultyConfig.name}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              gameState.phase === 'emergency' ? 'bg-red-500 text-white animate-pulse' :
              gameState.phase === 'ended' ? 'bg-slate-600 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {phaseNames[gameState.phase]}
            </span>
            <span className="text-yellow-400 font-bold text-lg">
              {gameState.score} 分
            </span>
          </div>
          
          <div className="text-xs text-slate-400">
            准确率: <span className={gameState.accuracy >= 80 ? 'text-green-400' : 'text-red-400'}>
              {gameState.accuracy}%
            </span>
          </div>
        </motion.div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl border border-slate-700 text-white hover:bg-slate-700 transition-colors"
          >
            <Home size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/settings'}
            className="bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl border border-slate-700 text-white hover:bg-slate-700 transition-colors"
          >
            <Settings size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={gameState.isPaused ? resumeGame : pauseGame}
            className="bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl border border-slate-700 text-white hover:bg-slate-700 transition-colors"
          >
            {gameState.isPaused ? <Play size={20} /> : <Pause size={20} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {hasActiveEmergency && activeEmergency && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto ${
              isTimeRunningOut ? 'animate-pulse' : ''
            }`}
          >
            <div className={`bg-gradient-to-r ${
              isTimeRunningOut 
                ? 'from-red-600 to-red-500' 
                : 'from-orange-500 to-yellow-500'
            } rounded-2xl p-4 shadow-2xl border-2 border-white/20`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getEmergencyIcon(activeEmergency.type)}</span>
                <div>
                  <div className="text-white font-bold text-lg">
                    {activeEmergency.description}
                  </div>
                  <div className="text-white/80 text-sm flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>位置: {activeEmergency.location}</span>
                    <span className="mx-2">|</span>
                    <Clock size={14} />
                    <span className={isTimeRunningOut ? 'text-white font-bold' : ''}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeRemaining / activeEmergency.timeLimit) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${
                    isTimeRunningOut ? 'bg-red-300' : 'bg-white'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.activeHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-auto z-30"
          >
            <div className="bg-blue-500/90 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-400/50 shadow-lg shadow-blue-500/25 max-w-md text-center">
              <div className="flex items-center gap-2">
                <Zap className="text-blue-200" size={16} />
                <span className="text-white font-medium text-sm">{gameState.activeHint}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 w-48 pointer-events-auto"
      >
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">园区地图</div>
          <div className="relative w-full h-36 bg-slate-800 rounded-lg overflow-hidden">
            <div className="absolute inset-2 border border-slate-600 rounded">
              <div 
                className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{
                  left: `${((gameState.playerPosition[0] + 15) / 30) * 100}%`,
                  top: `${((gameState.playerPosition[2] + 15) / 30) * 100}%`,
                }}
              />
              {currentTarget && (
                <div 
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    left: `${((currentTarget.position[0] + 15) / 30) * 100}%`,
                    top: `${((currentTarget.position[2] + 15) / 30) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700 mt-3">
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Zap size={12} />
            道具栏
          </div>
          <div className="space-y-1.5">
            {ITEMS.map(item => {
              const remaining = getItemCooldown(item.id);
              const isReady = remaining <= 0 && gameState.phase !== 'ended';
              return (
                <motion.button
                  key={item.id}
                  whileHover={isReady ? { scale: 1.02 } : {}}
                  whileTap={isReady ? { scale: 0.98 } : {}}
                  onClick={() => isReady && useItem(item.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    isReady
                      ? 'bg-slate-700/80 hover:bg-slate-600 cursor-pointer'
                      : 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-slate-200 truncate">{item.name}</div>
                    {!isReady && (
                      <div className="text-slate-500 text-[10px]">{remaining.toFixed(0)}s</div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 right-4 pointer-events-auto"
      >
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-slate-300">已处理: {gameState.accessRecords.length - unprocessedRecords.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="text-orange-400" size={16} />
                <span className="text-slate-300">待处理: {unprocessedRecords.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="text-blue-400" size={16} />
                <span className="text-slate-300">巡检: {patrolProgress.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-slate-400">待缴费: </span>
                <span className="text-yellow-400 font-bold">{formatCurrency(pendingAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400">已缴费: </span>
                <span className="text-green-400 font-bold">{formatCurrency(paidAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400">总计: </span>
                <span className="text-white font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${patrolProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {currentTarget && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="text-yellow-400" size={14} />
                <span className="text-slate-300">当前目标: {currentTarget.name}</span>
              </div>
              <div className="text-slate-400">
                距离: {distanceToTarget.toFixed(1)}m
                {currentTarget.task && (
                  <span className="ml-2 text-blue-400">
                    [{currentTarget.task.description}]
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span>WASD - 移动</span>
            <span>Shift - 加速</span>
            <span>鼠标左键 - 旋转视角</span>
            <span>点击 - 交互</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {gameState.isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-8 text-center border border-slate-600"
            >
              <h2 className="text-3xl font-bold text-white mb-4 font-orbitron">游戏暂停</h2>
              <p className="text-slate-400 mb-6">按 ESC 或点击继续按钮恢复游戏</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resumeGame}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  继续游戏
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-500 transition-colors"
                >
                  返回菜单
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
