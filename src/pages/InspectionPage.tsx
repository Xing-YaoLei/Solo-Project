import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MapPin, RotateCcw, ArrowRight, AlertTriangle } from 'lucide-react';
import { GameContainer } from '@/components/layout/GameContainer';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { gameInstance } from '@/game/gameInstance';
import { useGameStore } from '@/store/useGameStore';
import { levelManager } from '@/data/levelManager';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useWorkOrder } from '@/hooks/useWorkOrder';
import { WorkOrderPanel } from '@/components/game/WorkOrderPanel';
import type { WorkOrderResult, WorkOrder as WorkOrderType } from '@/types';

const InspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { currentLevelId, setPhase, setInspectionRoute, addScore } = useGameStore();
  
  const [isObserving, setIsObserving] = useState(true);
  const [observeTime, setObserveTime] = useState(0);
  const [playerRoute, setPlayerRoute] = useState<number[]>([]);
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<WorkOrderType | null>(null);
  
  const level = currentLevelId ? levelManager.getLevelById(currentLevelId) : null;
  const observeTimeLimit = level?.inspection.observeTime || 15;

  const {
    activeOrders,
    completedOrders,
    timeoutCount,
    startGame: startWorkOrders,
    triggerOrder,
    retryOrder,
    resolveOrder,
  } = useWorkOrder({
    orders: level?.workOrders.orders || [],
    timeout: level?.workOrders.timeout || 30,
    enabled: level?.workOrders.enabled || false,
    onTimeout: (order) => {
      setCurrentOrder(order);
      setShowWorkOrder(true);
    },
    onComplete: (result: WorkOrderResult) => {
      setShowWorkOrder(false);
      const penalty = result.retried ? (level?.workOrders.retryPenalty || 0) : 0;
      if (result.isCorrect) {
        addScore(50 - penalty);
      }
    },
  });

  useEffect(() => {
    if (!currentLevelId || !gameContainerRef.current) return;

    const initGame = async () => {
      await gameInstance.init(gameContainerRef.current!, currentLevelId);
      
      const scene = gameInstance.getInspectionScene();
      if (scene) {
        scene.events.on('observationComplete', () => {
          setIsObserving(false);
        });
        
        scene.events.on('routeUpdate', (route: number[]) => {
          setPlayerRoute([...route]);
        });
        
        scene.events.on('routeComplete', (route: number[]) => {
          setPlayerRoute([...route]);
        });
      }

      startWorkOrders();

      const timer = setInterval(() => {
        setObserveTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    };

    initGame();

    return () => {
      gameInstance.destroy();
    };
  }, [currentLevelId, startWorkOrders]);

  useKeyboard([
    {
      keys: ['Space'],
      enabled: !isObserving && activeOrders.length === 0,
      callback: () => handleNext(),
    },
    {
      keys: ['1', '2', '3', '4'],
      enabled: showWorkOrder,
      callback: (key) => {
        if (currentOrder) {
          const optionIndex = parseInt(key) - 1;
          const option = currentOrder.options[optionIndex];
          if (option) {
            resolveOrder(currentOrder.id, option.id);
          }
        }
      },
    },
  ]);

  const handleNext = () => {
    if (playerRoute.length === 0) return;

    const scene = gameInstance.getInspectionScene();
    if (scene) {
      setInspectionRoute(scene.getPlayerRoute());
    }

    setPhase('contract');
    navigate('/game/contract');
  };

  const handleReset = () => {
    const scene = gameInstance.getInspectionScene();
    if (scene) {
      scene.resetRoute();
      setPlayerRoute([]);
    }
  };

  const handleOrderSelect = (optionId: string) => {
    if (currentOrder) {
      resolveOrder(currentOrder.id, optionId);
    }
  };

  const handleRetry = () => {
    if (currentOrder) {
      retryOrder(currentOrder.id);
      setShowWorkOrder(false);
    }
  };

  if (!level) {
    return (
      <GameContainer>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white">未找到关卡配置</p>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer>
      <Header showBack showTimer showScore title="第一阶段：巡检路线观察" />
      
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {isObserving ? (
                    <div className="flex items-center gap-2 text-accent-400">
                      <Eye className="w-6 h-6 animate-pulse-slow" />
                      <span className="text-lg font-bold">观察阶段</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <MapPin className="w-6 h-6" />
                      <span className="text-lg font-bold">记忆测试</span>
                    </div>
                  )}
                  <div className="text-gray-400">
                    已标记 <span className="text-white font-bold">{playerRoute.length}</span> / {level.inspection.patrolPoints.length} 个巡检点
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {isObserving && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">观察倒计时:</span>
                      <span className="text-white font-mono font-bold">
                        {Math.max(0, observeTimeLimit - observeTime)}s
                      </span>
                    </div>
                  )}
                  
                  {!isObserving && playerRoute.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleReset}
                      keyboardShortcut="R"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新选择
                    </Button>
                  )}
                </div>
              </div>

              {isObserving && (
                <div className="mt-4">
                  <ProgressBar
                    value={observeTimeLimit - observeTime}
                    max={observeTimeLimit}
                    variant="warning"
                  />
                </div>
              )}

              {!isObserving && playerRoute.length === level.inspection.patrolPoints.length && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">巡检点标记完成！检查路线是否正确，然后继续下一阶段。</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mb-6">
            <div
              ref={gameContainerRef}
              className="bg-primary-600/20 rounded-2xl overflow-hidden border border-primary-500/30 shadow-2xl"
              style={{ height: '500px' }}
            />
          </div>

          {isObserving && (
            <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-accent-300 mb-2">📋 任务说明</h3>
              <p className="text-gray-300">
                仔细观察橙色路线的巡检顺序。观察时间结束后，路线将会隐藏，
                你需要按照记忆中的顺序依次点击各个巡检点。
              </p>
            </div>
          )}

          {!isObserving && (
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-primary-300 mb-2">🎯 你的任务</h3>
              <p className="text-gray-300">
                按照你记忆中的巡检顺序，依次点击各个巡检点。
                点击错误或顺序错误都会扣分，完成后点击"进入合同审批"继续。
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={playerRoute.length !== level.inspection.patrolPoints.length}
              keyboardShortcut="Enter"
            >
              进入合同审批
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {showWorkOrder && currentOrder && (
        <WorkOrderPanel
          order={currentOrder}
          options={currentOrder.options}
          isRetrying={timeoutCount > 0}
          onSelect={handleOrderSelect}
          onRetry={handleRetry}
        />
      )}
    </GameContainer>
  );
};

export default InspectionPage;
