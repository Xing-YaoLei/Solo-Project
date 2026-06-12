import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pause, Play, Home, Star, Trophy, X, User } from 'lucide-react';
import { CoffeeShopScene } from '@/scenes/CoffeeShop';
import { TaskPanel } from '@/components/game/TaskPanel';
import { CluePanel } from '@/components/game/CluePanel';
import { DecisionPanel } from '@/components/game/DecisionPanel';
import { MemberProfileCard } from '@/components/member/MemberProfileCard';
import { TransactionList } from '@/components/member/TransactionList';
import { useGameStore } from '@/store/useGameStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { getMemberById } from '@/data/mockMembers';
import level1Config from '@/config/levels/level-1.json';
import level2Config from '@/config/levels/level-2.json';
import level3Config from '@/config/levels/level-3.json';
import type { Level, Decision } from '@/types/game';

const levelConfigs: Record<string, Level> = {
  'level-1': level1Config as Level,
  'level-2': level2Config as Level,
  'level-3': level3Config as Level,
};

export default function GameScene() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const {
    currentTask,
    currentTaskClues,
    currentTaskDecisions,
    score,
    timeRemaining,
    comboCount,
    viewedClues,
    isPaused,
    isGameOver,
    decisionHistory,
    loadLevel,
    startTask,
    viewClue,
    startDecision,
    makeDecision,
    nextTask,
    pauseGame,
    resumeGame,
    resetGame,
    tasks,
  } = useGameStore();

  const { player, unlockLevel, updateTotalScore } = usePlayerStore();

  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = useState(false);
  const [decisionResult, setDecisionResult] = useState<{
    isCorrect: boolean;
    points: number;
    reason?: string;
  } | null>(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [isSpilling, setIsSpilling] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showGameResult, setShowGameResult] = useState(false);
  const [hasNextTask, setHasNextTask] = useState(true);

  useGameLoop({
    autoTick: true,
  });

  useEffect(() => {
    if (levelId && player) {
      const levelConfig = levelConfigs[levelId];
      if (levelConfig) {
        loadLevel(levelId, levelConfig.taskIds);
      }
    }
    return () => {
      resetGame();
    };
  }, [levelId, player, loadLevel, resetGame]);

  useEffect(() => {
    if (tasks.length > 0 && !currentTask) {
      startTask(tasks[0].id);
    }
  }, [tasks, currentTask, startTask]);

  useEffect(() => {
    if (isGameOver) {
      const correctCount = decisionHistory.filter((d) => d.isCorrect).length;
      const totalCount = decisionHistory.length;
      const passRate = totalCount > 0 ? correctCount / totalCount : 0;
      const levelConfig = levelId ? levelConfigs[levelId] : null;
      const minScore = levelConfig?.minScore || 300;
      const isWin = score >= minScore && passRate >= 0.6;

      if (levelConfig && player) {
        const stars = isWin ? (passRate >= 0.9 ? 3 : passRate >= 0.75 ? 2 : 1) : 0;
        unlockLevel(levelId, score, stars);
        if (score > 0) {
          updateTotalScore(score);
        }

        const nextLevelNum = parseInt(levelId.split('-')[1]) + 1;
        const nextLevelId = `level-${nextLevelNum}`;
        if (isWin && levelConfigs[nextLevelId]) {
          unlockLevel(nextLevelId, 0, 0);
        }
      }

      setTimeout(() => setShowGameResult(true), 500);
    }
  }, [isGameOver, decisionHistory, score, levelId, player, unlockLevel, updateTotalScore]);

  const handleClueClick = useCallback(
    (clueId: string) => {
      viewClue(clueId);
      setSelectedClueId(clueId);
    },
    [viewClue]
  );

  const handleStartDecision = useCallback(() => {
    startDecision();
    setShowDecisionPanel(true);
    setSelectedClueId(null);
  }, [startDecision]);

  const handleDecision = useCallback(
    (decisionId: string) => {
      const result = makeDecision(decisionId);
      const decision = currentTaskDecisions.find((d) => d.id === decisionId);
      const correctDecision = currentTaskDecisions.find((d) => d.isCorrect);

      if (!result.isCorrect) {
        setIsSpilling(true);
      }

      setDecisionResult({
        ...result,
        reason: result.isCorrect ? undefined : correctDecision?.consequence,
      });
    },
    [makeDecision, currentTaskDecisions]
  );

  const handleNext = useCallback(() => {
    setDecisionResult(null);
    setShowDecisionPanel(false);
    setSelectedClueId(null);
    setIsSpilling(false);

    const hasMore = nextTask();
    setHasNextTask(hasMore);
  }, [nextTask]);

  const handleSpillComplete = useCallback(() => {
    setIsSpilling(false);
  }, []);

  const handleBackToMenu = useCallback(() => {
    resetGame();
    navigate('/');
  }, [resetGame, navigate]);

  const handleRetry = useCallback(() => {
    setShowGameResult(false);
    resetGame();
    if (levelId) {
      const levelConfig = levelConfigs[levelId];
      if (levelConfig) {
        loadLevel(levelId, levelConfig.taskIds);
      }
    }
  }, [levelId, resetGame, loadLevel]);

  const correctCount = decisionHistory.filter((d) => d.isCorrect).length;
  const wrongCount = decisionHistory.filter((d) => !d.isCorrect).length;
  const levelConfig = levelId ? levelConfigs[levelId] : null;
  const member = currentTask ? getMemberById(currentTask.memberId) : null;

  const renderStars = (count: number) => (
    <div className="flex gap-2 justify-center">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.2, type: 'spring' }}
        >
          <Star
            className={`w-12 h-12 ${
              i < count ? 'text-[#FFB300] fill-[#FFB300]' : 'text-[#5D4037]'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full h-full bg-[#3E2723]">
      <div className="absolute inset-0">
        {currentTask && (
          <CoffeeShopScene
            clues={currentTaskClues}
            viewedClues={viewedClues}
            selectedClueId={selectedClueId}
            onClueClick={handleClueClick}
            onCabinetOpen={() => setIsCabinetOpen(true)}
            onCabinetClose={() => setIsCabinetOpen(false)}
            isCabinetOpen={isCabinetOpen}
            isSpilling={isSpilling}
            onSpillComplete={handleSpillComplete}
          />
        )}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToMenu}
          className="glass-light rounded-xl p-2 hover:bg-[#FFF8E1]/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        <div className="glass-light rounded-xl px-4 py-2">
          <span className="text-[#FF8F00] font-semibold">{levelConfig?.name}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isPaused) resumeGame();
            else pauseGame();
            setShowPauseMenu(!isPaused);
          }}
          className="glass-light rounded-xl p-2 hover:bg-[#FFF8E1]/20 transition-colors"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {currentTask && !showDecisionPanel && !decisionResult && (
          <TaskPanel
            task={currentTask}
            score={score}
            timeRemaining={timeRemaining}
            comboCount={comboCount}
            onViewMember={() => setShowMemberDetail(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentTask && !showDecisionPanel && !decisionResult && (
          <CluePanel
            clues={currentTaskClues}
            viewedClues={viewedClues}
            selectedClueId={selectedClueId}
            onClueClick={handleClueClick}
            onClose={() => setSelectedClueId(null)}
          />
        )}
      </AnimatePresence>

      {currentTask && !showDecisionPanel && !decisionResult && viewedClues.length >= 2 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartDecision}
          className="absolute bottom-4 right-4 z-20 btn-primary flex items-center gap-2"
        >
          我已分析完毕，开始决策
        </motion.button>
      )}

      <AnimatePresence>
        {showDecisionPanel && currentTask && (
          <DecisionPanel
            decisions={currentTaskDecisions}
            onDecision={handleDecision}
            result={decisionResult}
            onNext={handleNext}
            onClose={() => {
              setShowDecisionPanel(false);
              setDecisionResult(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMemberDetail && member && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-[#FF8F00]" />
                  <h2 className="text-2xl font-bold text-[#FFF8E1]">会员详情</h2>
                </div>
                <button
                  onClick={() => setShowMemberDetail(false)}
                  className="p-2 rounded-lg hover:bg-[#FFF8E1]/10 transition-colors"
                >
                  <X className="w-5 h-5 text-[#8D6E63]" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MemberProfileCard member={member} />
                <TransactionList member={member} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPauseMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 w-full max-w-md text-center"
            >
              <h2 className="text-3xl font-bold text-[#FFF8E1] mb-8">游戏暂停</h2>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    resumeGame();
                    setShowPauseMenu(false);
                  }}
                  className="w-full btn-primary"
                >
                  继续游戏
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="w-full btn-secondary"
                >
                  重新开始
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBackToMenu}
                  className="w-full btn-secondary"
                >
                  返回主菜单
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGameResult && levelConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="glass-card rounded-3xl p-8 w-full max-w-lg text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF8F00] to-[#FFB300] flex items-center justify-center"
              >
                <Trophy className="w-12 h-12 text-[#3E2723]" />
              </motion.div>

              <h2 className="text-3xl font-bold text-gradient mb-2">
                {score >= levelConfig.minScore ? '挑战成功！' : '挑战失败'}
              </h2>
              <p className="text-[#8D6E63] mb-6">
                {score >= levelConfig.minScore
                  ? `恭喜你完成了「${levelConfig.name}」！`
                  : `未达到及格分数 ${levelConfig.minScore} 分`}
              </p>

              {score >= levelConfig.minScore && (
                <div className="mb-6">
                  {renderStars(
                    correctCount / (correctCount + wrongCount) >= 0.9
                      ? 3
                      : correctCount / (correctCount + wrongCount) >= 0.75
                      ? 2
                      : 1
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-light rounded-xl p-4">
                  <p className="text-3xl font-bold text-[#FF8F00]">{score}</p>
                  <p className="text-xs text-[#8D6E63]">总得分</p>
                </div>
                <div className="glass-light rounded-xl p-4">
                  <p className="text-3xl font-bold text-[#66BB6A]">{correctCount}</p>
                  <p className="text-xs text-[#8D6E63]">正确</p>
                </div>
                <div className="glass-light rounded-xl p-4">
                  <p className="text-3xl font-bold text-[#EF5350]">{wrongCount}</p>
                  <p className="text-xs text-[#8D6E63]">错误</p>
                </div>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="w-full btn-primary"
                >
                  再次挑战
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/levels')}
                  className="w-full btn-secondary"
                >
                  选择关卡
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBackToMenu}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  返回主菜单
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
