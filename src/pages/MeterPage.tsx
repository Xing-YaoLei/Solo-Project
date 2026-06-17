import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { GameContainer } from '@/components/layout/GameContainer';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MeterDisplay } from '@/components/game/MeterDisplay';
import { WorkOrderPanel } from '@/components/game/WorkOrderPanel';
import { useGameStore } from '@/store/useGameStore';
import { levelManager } from '@/data/levelManager';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useWorkOrder } from '@/hooks/useWorkOrder';
import type { PlayerMeterReading, WorkOrderResult, WorkOrder as WorkOrderType, ActiveWorkOrder } from '@/types';

const MeterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentLevelId,
    setPhase,
    setMeterReading,
    addScore,
    completeWorkOrder,
    incrementTimeoutCount,
 meters: { readings },
    calculateFinalScore,
  } = useGameStore();

  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ActiveWorkOrder | null>(null);

  const level = currentLevelId ? levelManager.getLevelById(currentLevelId) : null;
  const waterMeters = level?.meters.waterMeters || [];
  const electricMeters = level?.meters.electricMeters || [];
  const allMeters = [...waterMeters, ...electricMeters];
  const totalMeters = allMeters.length;
  const woTimeout = level?.workOrders.timeout || 30;

  const {
    activeOrders,
    timeoutCount,
    startGame: startWorkOrders,
    retryOrder,
    resolveOrder,
  } = useWorkOrder({
    orders: level?.workOrders.orders || [],
    timeout: woTimeout,
    enabled: level?.workOrders.enabled || false,
    onTrigger: (order, isRetrying) => {
      const activeOrder: ActiveWorkOrder = {
        ...order,
        startTime: Date.now(),
        remainingTime: woTimeout,
        isRetrying,
      };
      setCurrentOrder(activeOrder);
      setShowWorkOrder(true);
    },
    onTimeout: (order) => {
    },
    onComplete: (result: WorkOrderResult) => {
      completeWorkOrder(result);
      setShowWorkOrder(false);
      setCurrentOrder(null);
      const penalty = result.retried ? (level?.workOrders.retryPenalty || 0) : 0;
      if (result.isCorrect) {
        addScore(50 - penalty);
      }
    },
  });

  React.useEffect(() => {
    startWorkOrders();
  }, [startWorkOrders]);

  useKeyboard([
    {
      keys: ['Enter'],
      enabled: activeOrders.length === 0,
      callback: () => handleFinish(),
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

  const handleReadingChange = (meterId: string, value: number) => {
    if (activeOrders.length > 0) return;
    const reading: PlayerMeterReading = {
      meterId,
      value,
      timestamp: Date.now(),
    };
    setMeterReading(meterId, reading);
  };

  const handleFinish = () => {
    calculateFinalScore();
    setPhase('review');
    navigate('/game/review');
  };

  const handleOrderSelect = (optionId: string) => {
    if (currentOrder) {
      resolveOrder(currentOrder.id, optionId);
    }
  };

  const handleRetry = () => {
    if (currentOrder) {
      retryOrder(currentOrder.id);
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

  const completedReadings = readings.filter((r) => r !== null).length;
  const allCompleted = completedReadings === totalMeters;

  const displayOrder = currentOrder || (activeOrders.length > 0 ? activeOrders[0] : null);
  const displayIsRetrying = displayOrder?.isRetrying || (timeoutCount > 0 && !displayOrder);

  return (
    <GameContainer>
      <Header showBack showTimer showScore title="第三阶段：水电读数核算" />

      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Gauge className="w-6 h-6 text-accent-400" />
                  <span className="text-lg font-bold text-white">水电读数核算</span>
                  <span className="text-gray-400">
                    已录入 <span className="text-white font-bold">{completedReadings}</span> / {totalMeters} 个
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">
                    剩余 <span className="text-white font-bold">{totalMeters - completedReadings}</span> 个
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={completedReadings}
                  max={totalMeters}
                  variant="default"
                  showLabel
                  label={`完成度: ${Math.round((completedReadings / totalMeters) * 100)}%`}
                />
              </div>

              {allCompleted && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">所有水电表已录入！检查读数是否正确，然后点击"查看评分结果"完成关卡。</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                  💧 水表读数
                </h3>
                <div className="space-y-4">
                  {waterMeters.map((meter) => {
                    const reading = readings.find((r) => r?.meterId === meter.id);
                    return (
                      <MeterDisplay
                        key={meter.id}
                        meter={meter}
                        type="water"
                        unitPrice={level.meters.unitPrices.water}
                        value={reading?.value}
                        onChange={(value) => handleReadingChange(meter.id, value)}
                        disabled={activeOrders.length > 0}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  ⚡ 电表读数
                </h3>
                <div className="space-y-4">
                  {electricMeters.map((meter) => {
                    const reading = readings.find((r) => r?.meterId === meter.id);
                    return (
                      <MeterDisplay
                        key={meter.id}
                        meter={meter}
                        type="electric"
                        unitPrice={level.meters.unitPrices.electric}
                        value={reading?.value}
                        onChange={(value) => handleReadingChange(meter.id, value)}
                        disabled={activeOrders.length > 0}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">💰 收费标准</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">水费单价</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ¥{level.meters.unitPrices.water.toFixed(2)}/吨
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">电费单价</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    ¥{level.meters.unitPrices.electric.toFixed(2)}/度
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-primary-300 mb-2">💡 操作提示</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 仔细核对每个水电表的读数，误差过大会扣分</li>
              <li>• 使用 ± 按钮或直接输入数字来调整读数</li>
              <li>• 系统会根据读数计算当月水电费总额</li>
              <li>• 注意单位：水表单位为吨，电表单位为度</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/game/contract')}
              disabled={activeOrders.length > 0}
              keyboardShortcut="←"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回合同审批
            </Button>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinish}
              disabled={!allCompleted || activeOrders.length > 0}
              keyboardShortcut="Enter"
            >
              查看评分结果
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {showWorkOrder && displayOrder && (
        <WorkOrderPanel
          order={displayOrder}
          options={displayOrder.options}
          timeout={woTimeout}
          isRetrying={displayIsRetrying}
          onSelect={handleOrderSelect}
          onRetry={handleRetry}
          onResolve={handleOrderSelect}
        />
      )}
    </GameContainer>
  );
};

export default MeterPage;
