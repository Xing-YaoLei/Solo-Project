import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, ArrowRight, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { GameContainer } from '@/components/layout/GameContainer';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TenantCard } from '@/components/game/TenantCard';
import { WorkOrderPanel } from '@/components/game/WorkOrderPanel';
import { Timeline } from '@/components/game/Timeline';
import { useGameStore } from '@/store/useGameStore';
import { levelManager } from '@/data/levelManager';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useNumberKeys } from '@/hooks/useKeyboard';
import { useWorkOrder } from '@/hooks/useWorkOrder';
import type { ContractDecision, WorkOrderResult, WorkOrder as WorkOrderType, WorkOrderOption, ApprovalOption, ActiveWorkOrder } from '@/types';

const ContractPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentLevelId,
    setPhase,
    setContractDecision,
    addScore,
    completeWorkOrder,
    incrementTimeoutCount,
    contracts: { decisions },
  } = useGameStore();

  const [currentTenantIndex, setCurrentTenantIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ActiveWorkOrder | null>(null);

  const level = currentLevelId ? levelManager.getLevelById(currentLevelId) : null;
  const tenants = level?.contracts.tenants || [];
  const approvalOptions = level?.contracts.approvalOptions || [];
  const currentTenant = tenants[currentTenantIndex];
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

  useEffect(() => {
    startWorkOrders();
  }, [startWorkOrders]);

  useKeyboard([
    {
      keys: ['Enter'],
      enabled: selectedOption !== null && activeOrders.length === 0,
      callback: () => handleNext(),
    },
    {
      keys: ['ArrowLeft'],
      enabled: currentTenantIndex > 0 && activeOrders.length === 0,
      callback: () => setCurrentTenantIndex(currentTenantIndex - 1),
    },
    {
      keys: ['ArrowRight'],
      enabled: currentTenantIndex < tenants.length - 1 && activeOrders.length === 0,
      callback: () => setCurrentTenantIndex(currentTenantIndex + 1),
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

  useNumberKeys(approvalOptions.length, (index) => {
    if (activeOrders.length === 0 && approvalOptions[index]) {
      setSelectedOption(approvalOptions[index].id);
    }
  }, activeOrders.length === 0);

  const handleSelectOption = (optionId: string) => {
    if (activeOrders.length > 0) return;
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (!selectedOption || !currentTenant) return;

    const decision: ContractDecision = {
      tenantId: currentTenant.id,
      optionId: selectedOption,
      timestamp: Date.now(),
    };

    setContractDecision(currentTenantIndex, decision);

    if (currentTenantIndex < tenants.length - 1) {
      setCurrentTenantIndex(currentTenantIndex + 1);
      const prevDecision = decisions[currentTenantIndex + 1];
      setSelectedOption(prevDecision?.optionId || null);
    } else {
      setPhase('meter');
      navigate('/game/meter');
    }
  };

  const handlePrevious = () => {
    if (currentTenantIndex > 0) {
      if (selectedOption && currentTenant) {
        const decision: ContractDecision = {
          tenantId: currentTenant.id,
          optionId: selectedOption,
          timestamp: Date.now(),
        };
        setContractDecision(currentTenantIndex, decision);
      }
      setCurrentTenantIndex(currentTenantIndex - 1);
      const prevDecision = decisions[currentTenantIndex - 1];
      setSelectedOption(prevDecision?.optionId || null);
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
    }
  };

  if (!level || tenants.length === 0) {
    return (
      <GameContainer>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white">未找到关卡配置</p>
        </div>
      </GameContainer>
    );
  }

  const allDecided = decisions.filter((d) => d !== null).length === tenants.length;
  const correctCount = decisions.filter(
    (d, i) => d && level.contracts.correctAnswers[tenants[i].id] === d.optionId
  ).length;

  const displayOrder = currentOrder || (activeOrders.length > 0 ? activeOrders[0] : null);
  const displayIsRetrying = displayOrder?.isRetrying || (timeoutCount > 0 && !displayOrder);

  return (
    <GameContainer>
      <Header showBack showTimer showScore title="第二阶段：租户合同审批" />

      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <FileCheck className="w-6 h-6 text-accent-400" />
                  <span className="text-lg font-bold text-white">
                    租户合同审批
                  </span>
                  <span className="text-gray-400">
                    第 <span className="text-white font-bold">{currentTenantIndex + 1}</span> / {tenants.length} 份
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">
                    已审批 <span className="text-white font-bold">{correctCount}</span> 份
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={currentTenantIndex + 1}
                  max={tenants.length}
                  variant="default"
                  showLabel
                  label={`进度: ${Math.round(((currentTenantIndex + 1) / tenants.length) * 100)}%`}
                />
              </div>

              {allDecided && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">所有合同已审批完成！检查后点击"进入水电核算"继续。</span>
                </div>
              )}
            </CardContent>
          </Card>

          {currentTenant && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <TenantCard tenant={currentTenant} />
              </div>

              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">审批意见</h3>
                    <div className="space-y-3">
                      {approvalOptions.map((option: ApprovalOption, index: number) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(option.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left min-h-[48px]
                            ${selectedOption === option.id
                              ? 'border-accent-400 bg-accent-500/20'
                              : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                              ${selectedOption === option.id
                                ? 'bg-accent-400 text-white'
                                : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <p className={`font-medium ${selectedOption === option.id ? 'text-accent-300' : 'text-white'}`}>
                                {option.label}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="mb-6">
            <Timeline
              tenants={tenants}
              decisions={decisions}
              currentIndex={currentTenantIndex}
              onSelect={setCurrentTenantIndex}
            />
          </div>

          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-primary-300 mb-2">💡 审批提示</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 仔细评估租户的信用评级、经营稳定性和特殊要求</li>
              <li>• 高风险租户可能需要提供额外保证金或缩短租期</li>
              <li>• 优质租户可以考虑给予租金优惠或优先续约权</li>
              <li>• 使用数字键 1-4 快速选择审批意见</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button
              variant="secondary"
              size="lg"
              onClick={handlePrevious}
              disabled={currentTenantIndex === 0 || activeOrders.length > 0}
              keyboardShortcut="←"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              上一份
            </Button>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!selectedOption || activeOrders.length > 0}
              keyboardShortcut="Enter"
            >
              {currentTenantIndex < tenants.length - 1 ? (
                <>
                  下一份
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  进入水电核算
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
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

export default ContractPage;
