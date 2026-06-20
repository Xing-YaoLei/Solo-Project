import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, RotateCcw, Play, CheckCircle2 } from 'lucide-react';
import { VenueScene } from '../components/scene/VenueScene';
import { PhaseStepper } from '../components/game/PhaseStepper';
import { ScoreHUD } from '../components/game/ScoreHUD';
import { RulesPanel } from '../components/game/RulesPanel';
import { LockListPanel } from '../components/game/LockListPanel';
import { CheckInPanel } from '../components/game/CheckInPanel';
import { DisputeModal } from '../components/game/DisputeModal';
import { LoadingScreen } from '../components/game/LoadingScreen';
import { useGameStore } from '../store/gameStore';
import { useProgressStore } from '../store/progressStore';
import { useSceneLoader } from '../hooks/useSceneLoader';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { getLevelById } from '../data/levels';
import type { GamePhase, TicketType, RefundDispute } from '../types';
import { getCurrentOccupancy } from '../utils/occupancyTracker';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export function GamePlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const level = useMemo(() => (levelId ? getLevelById(levelId) : undefined), [levelId]);

  const {
    phase,
    score,
    targetScore,
    targetOccupancy,
    seats,
    lockRecords,
    checkInRecords,
    activeLockRecordId,
    activeCheckInId,
    selectedSeatIds,
    hoveredSeatId,
    currentDispute,
    mode,
    currentLevelId,
    decisionHistory,
    setPhase,
    initializeLevel,
    selectSeat,
    deselectSeat,
    clearSelectedSeats,
    setActiveLockRecord,
    setActiveCheckIn,
    assignSeatsToLockRecord,
    unassignLockRecord,
    processCheckIn,
    resolveDispute,
    setHoveredSeat,
    snapshotOccupancy,
    computeFinalScore,
    resetGame,
  } = useGameStore();

  const { updateScore, isLevelUnlocked } = useProgressStore();

  const loaderResources = [
    { id: 'venue', name: '场馆结构', loaded: false },
    { id: 'seats', name: '座位几何体', loaded: false },
    { id: 'materials', name: '材质与纹理', loaded: false },
    { id: 'lights', name: '光照系统', loaded: false },
    { id: 'physics', name: '碰撞体', loaded: false },
  ];
  const { progress, resources, isLoading } = useSceneLoader(true);
  void loaderResources;

  const showRightList = phase === 'LOCKING' || phase === 'CHECKING';
  const rightPanelTitle = phase === 'LOCKING' ? '锁座分配' : '核销评分';

  const { checkedIn, total } = getCurrentOccupancy(seats);

  const expectedRevenue = useMemo(() => {
    return seats
      .filter((s) => s.status === 'CHECKED_IN' || s.status === 'SOLD' || s.status === 'LOCKED')
      .reduce((sum, s) => sum + s.price, 0);
  }, [seats]);

  const totalSeatsByType = useMemo(() => {
    const result: Record<string, { assigned: number; total: number }> = {};
    const types: TicketType[] = ['VIP', 'PREMIUM', 'STANDARD', 'ECONOMY'];
    types.forEach((t) => {
      const typeSeats = seats.filter((s) => s.ticketType === t);
      const assigned = typeSeats.filter((s) =>
        ['LOCKED', 'SOLD', 'CHECKED_IN'].includes(s.status)
      ).length;
      result[t] = { assigned, total: typeSeats.length };
    });
    return result;
  }, [seats]);

  useEffect(() => {
    if (levelId && isLevelUnlocked(levelId)) {
      const pmode = useProgressStore.getState().selectedMode || 'FORMAL';
      initializeLevel(levelId, pmode);
    } else if (levelId) {
      navigate('/levels');
    }
    return () => {
      resetGame();
    };
  }, [levelId, initializeLevel, resetGame, navigate, isLevelUnlocked]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const handleSeatClick = useCallback(
    (seatId: string) => {
      if (phase !== 'LOCKING' && phase !== 'CHECKING') return;

      if (selectedSeatIds.includes(seatId)) {
        deselectSeat(seatId);
      } else {
        selectSeat(seatId);
      }
    },
    [phase, selectedSeatIds, selectSeat, deselectSeat]
  );

  (window as any).__simulateSeatClick = handleSeatClick;

  const handleAssign = useCallback(() => {
    const result = assignSeatsToLockRecord();
    if (result.success) {
      addToast('success', `分配成功！得分 +${result.scoreDelta}`);
      snapshotOccupancy(`分配 #${activeLockRecordId?.slice(-4) || ''}`);
    } else {
      addToast('error', result.message || '分配失败');
    }
    return result;
  }, [assignSeatsToLockRecord, addToast, snapshotOccupancy, activeLockRecordId]);

  const handleProcessCheckIn = useCallback(
    (recordId: string, seatIds: string[]) => {
      const result = processCheckIn(recordId, seatIds);
      if (result.success) {
        addToast('success', `核销完成！奖励 +${result.scoreDelta} 分`);
        snapshotOccupancy(`核销 #${recordId.slice(-4)}`);
        if (result.dispute) {
          setTimeout(() => addToast('warning', '触发退票争议，请选择处理方案'), 500);
        }
      }
      return result;
    },
    [processCheckIn, addToast, snapshotOccupancy]
  );

  const handleResolveDispute = useCallback(
    (optionId: string) => {
      const result = resolveDispute(optionId);
      if (result.scoreDelta > 0) {
        addToast('success', `争议处理完成 +${result.scoreDelta} 分`);
      } else if (result.scoreDelta < 0) {
        addToast('warning', `争议处理完成 ${result.scoreDelta} 分`);
      } else {
        addToast('info', '争议已处理');
      }
    },
    [resolveDispute, addToast]
  );

  const canAdvancePhase = useCallback((): boolean => {
    switch (phase) {
      case 'RULES':
        return true;
      case 'LOCKING':
        return lockRecords.every((r) => r.processed);
      case 'CHECKING':
        return checkInRecords.filter((r) => {
          const matched = lockRecords.find((l) => l.orderId === r.orderId);
          return matched && matched.processed;
        }).every((r) => r.processed) && !currentDispute;
      default:
        return true;
    }
  }, [phase, lockRecords, checkInRecords, currentDispute]);

  const handlePhaseChange = useCallback(
    (newPhase: GamePhase) => {
      if (newPhase === phase) return;

      if (newPhase === 'LOCKING' && phase === 'RULES') {
        setRulesOpen(false);
        snapshotOccupancy('锁座开始');
      }
      if (newPhase === 'CHECKING' && phase === 'LOCKING') {
        if (!canAdvancePhase()) {
          addToast('warning', '请先完成所有锁座分配');
          return;
        }
        clearSelectedSeats();
        setActiveLockRecord(null);
        snapshotOccupancy('核销开始');
      }
      if (newPhase === 'REVIEW' && phase === 'CHECKING') {
        if (!canAdvancePhase()) {
          addToast('warning', '请先完成所有核销记录');
          return;
        }
        clearSelectedSeats();
        setActiveCheckIn(null);
        snapshotOccupancy('最终状态');

        if (mode === 'FORMAL' && currentLevelId) {
          const { totalScore, occupancyPercent } = computeFinalScore();
          updateScore(currentLevelId, totalScore, occupancyPercent);
        }

        setTimeout(() => navigate(`/play/${levelId}/review`), 300);
      }

      setPhase(newPhase);
    },
    [
      phase,
      canAdvancePhase,
      snapshotOccupancy,
      clearSelectedSeats,
      setActiveLockRecord,
      setActiveCheckIn,
      mode,
      currentLevelId,
      computeFinalScore,
      updateScore,
      navigate,
      levelId,
      addToast,
      setPhase,
    ]
  );

  useKeyboardControls(
    {
      onPhaseJump: (p) => {
        if (p === 'RULES' || p === 'LOCKING' || p === 'CHECKING') {
          handlePhaseChange(p);
        }
      },
      onConfirm: () => {
        if (phase === 'LOCKING' && activeLockRecordId && selectedSeatIds.length > 0) {
          handleAssign();
        }
      },
      onCancel: () => {
        clearSelectedSeats();
        setActiveLockRecord(null);
        setActiveCheckIn(null);
      },
      onTabPanel: () => {
        if (phase === 'LOCKING' || phase === 'CHECKING') {
          setRightPanelOpen((o) => !o);
        }
      },
      onResetView: () => {},
    },
    !isLoading
  );

  if (!level) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        未找到关卡
      </div>
    );
  }

  const allLocksProcessed = lockRecords.every((r) => r.processed);

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <LoadingScreen
        progress={progress}
        resources={resources.length > 0 ? resources : loaderResources}
        isLoading={isLoading || seats.length === 0}
        levelName={level.name}
      />

      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => navigate('/levels')}
              className="p-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
              title="返回关卡选择"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 rounded-xl px-4 py-2">
              <div className="text-xs text-slate-400">当前关卡</div>
              <div className="text-sm font-bold text-white">{level.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowHelp((s) => !s)}
              className={`p-2 rounded-xl backdrop-blur-xl border transition-all ${
                showHelp
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-slate-900/70 border-slate-700/50 text-slate-300 hover:text-white'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (levelId) {
                  initializeLevel(levelId, mode);
                  addToast('info', '关卡已重置');
                }
              }}
              className="p-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
              title="重置关卡"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="pointer-events-auto bg-slate-950/40 backdrop-blur-xl border-b border-slate-800/50 mt-3">
          <PhaseStepper
            currentPhase={phase}
            onPhaseChange={handlePhaseChange}
            canAdvance={canAdvancePhase()}
          />
        </div>
      </div>

      <ScoreHUD
        score={score}
        targetScore={targetScore}
        totalSeats={total}
        checkedInSeats={checkedIn}
        expectedRevenue={expectedRevenue}
      />

      <div className="absolute inset-0">
        <VenueScene
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          hoveredSeatId={hoveredSeatId}
          onSeatClick={handleSeatClick}
          onSeatHover={setHoveredSeat}
          stagePosition={[
            level.venueConfig.stagePosition.x,
            level.venueConfig.stagePosition.y,
            level.venueConfig.stagePosition.z,
          ]}
          interactive={phase === 'LOCKING' || phase === 'CHECKING'}
        />
      </div>

      <AnimatePresence>
        {phase === 'RULES' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-25 pointer-events-auto"
          >
            <div className="text-center mb-3">
              <p className="text-sm text-slate-400 mb-1">
                仔细查看左侧的票种规则与分区，熟悉场馆布局
              </p>
              <p className="text-xs text-slate-500">
                共 {seats.length} 个座位 · {level.ticketRules.length} 种票型
              </p>
            </div>
            <button
              onClick={() => handlePhaseChange('LOCKING')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 font-bold shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-105 active:scale-98 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              开始分配座位
            </button>
          </motion.div>
        )}

        {phase === 'LOCKING' && allLocksProcessed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-25 pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-3 justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">所有锁座记录已完成分配</span>
            </div>
            <button
              onClick={() => handlePhaseChange('CHECKING')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-98 transition-all flex items-center gap-2"
            >
              进入核销阶段
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <RulesPanel
        rules={level.ticketRules}
        totalSeatsByType={totalSeatsByType}
        isOpen={rulesOpen || phase === 'RULES'}
        onToggle={() => setRulesOpen((o) => !o)}
      />

      {showRightList && rightPanelTitle === '锁座分配' && (
        <LockListPanel
          records={lockRecords}
          seats={seats}
          activeRecordId={activeLockRecordId}
          selectedSeatIds={selectedSeatIds}
          onSelectRecord={setActiveLockRecord}
          onClearSelection={clearSelectedSeats}
          onAssign={handleAssign}
          onUnassign={(id) => {
            unassignLockRecord(id);
            addToast('info', '已撤销分配');
          }}
          isOpen={rightPanelOpen || phase === 'LOCKING'}
          onToggle={() => setRightPanelOpen((o) => !o)}
        />
      )}

      {showRightList && rightPanelTitle === '核销评分' && (
        <CheckInPanel
          records={checkInRecords}
          lockRecords={lockRecords}
          seats={seats}
          activeCheckInId={activeCheckInId}
          selectedSeatIds={selectedSeatIds}
          onSelectCheckIn={(id) => {
            clearSelectedSeats();
            setActiveCheckIn(id);
          }}
          onClearSelection={() => {
            clearSelectedSeats();
          }}
          onProcess={handleProcessCheckIn}
          isOpen={rightPanelOpen}
          onToggle={() => setRightPanelOpen((o) => !o)}
        />
      )}

      <DisputeModal
        dispute={currentDispute as RefundDispute | null}
        onResolve={handleResolveDispute}
      />

      <AnimatePresence>
        {toasts.map((toast, idx) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ delay: idx * 0.05 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
            style={{ marginBottom: idx * 56 }}
          >
            <div
              className={`
                px-4 py-3 rounded-xl backdrop-blur-xl border shadow-2xl text-sm font-medium flex items-start gap-2.5
                ${toast.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/80 border-slate-600/50 text-slate-200'
                }
              `}
            >
              <span className="flex-1">{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">操作帮助</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-amber-400 font-bold mb-1">🎯 游戏目标</div>
                  <p className="text-slate-400">合理分配座位，最大化上座率与收益，处理锁座冲突与退票争议。</p>
                </div>
                <div>
                  <div className="text-amber-400 font-bold mb-1">🖱️ 视角控制</div>
                  <p className="text-slate-400">拖动旋转 · 滚轮缩放 · 右键平移 · R键重置</p>
                </div>
                <div>
                  <div className="text-amber-400 font-bold mb-1">⌨️ 快捷键</div>
                  <div className="text-slate-400 space-y-1">
                    <div>1-4: 切换阶段 · Space: 确认 · Esc: 取消选择</div>
                    <div>Tab: 切换右侧面板 · 点击座位: 选中/取消</div>
                  </div>
                </div>
                <div>
                  <div className="text-amber-400 font-bold mb-1">💡 小提示</div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>票种区域不可错配，否则扣分</li>
                    <li>同一座位不可重复分配</li>
                    <li>争议处理影响最终得分与上座率</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold hover:bg-amber-500/30 transition-all"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none bg-gradient-to-t from-slate-950 to-transparent z-10" />

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <AnimatePresence>
          {hoveredSeatId && (() => {
            const seat = seats.find((s) => s.id === hoveredSeatId);
            if (!seat) return null;
            const statusLabels: Record<string, string> = {
              AVAILABLE: '空闲',
              LOCKED: '已锁定',
              SOLD: '已售出',
              CHECKED_IN: '已核销',
              REFUNDED: '已退票',
              CONFLICT: '冲突',
            };
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-4 py-2 rounded-xl backdrop-blur-xl bg-slate-900/90 border border-slate-700/60 text-xs flex items-center gap-4 shadow-xl"
              >
                <span className="text-white font-bold">{seat.row}排 {seat.number}座</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{seat.ticketType}</span>
                <span className="text-amber-400 font-mono font-bold">¥{seat.price.toLocaleString()}</span>
                <span className="text-slate-400">{statusLabels[seat.status] || '-'}</span>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      <div className="hidden">{decisionHistory.length}</div>
    </div>
  );
}
