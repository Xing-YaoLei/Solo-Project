import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Star, Home, RotateCcw, TrendingUp, TrendingDown,
  CheckCircle, XCircle, AlertTriangle, Clock, Zap,
  MapPin, FileCheck, Gauge
} from 'lucide-react';
import { GameContainer } from '@/components/layout/GameContainer';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useGameStore } from '@/store/useGameStore';
import { levelManager } from '@/data/levelManager';
import { progressStorage } from '@/utils/storage';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { WorkOrderResult, Tenant, ContractDecision } from '@/types';

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentLevelId,
    score,
    inspection,
    contracts,
    meters,
    workOrders,
    totalTime,
    resetGame,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'inspection' | 'contracts' | 'meters' | 'workOrders'>('overview');

  const level = currentLevelId ? levelManager.getLevelById(currentLevelId) : null;

  useEffect(() => {
    if (level && score > 0) {
      progressStorage.saveProgress(level.id, Math.round(score), totalTime);
    }
  }, [level, score, totalTime]);

  useKeyboard([
    {
      keys: ['Enter'],
      enabled: true,
      callback: () => handleReplay(),
    },
    {
      keys: ['Escape'],
      enabled: true,
      callback: () => handleBackToMenu(),
    },
  ]);

  const handleBackToMenu = () => {
    resetGame();
    navigate('/');
  };

  const handleReplay = () => {
    if (currentLevelId) {
      resetGame();
      navigate('/loading');
    }
  };

  const getStars = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };

  const getGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 95) return { grade: 'S', color: 'text-yellow-400' };
    if (percentage >= 90) return { grade: 'A', color: 'text-green-400' };
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-400' };
    if (percentage >= 70) return { grade: 'C', color: 'text-purple-400' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
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

  const maxScore = 100;
  const stars = getStars(score, maxScore);
  const { grade, color } = getGrade(score, maxScore);

  const inspectionCorrect = inspection.playerRoute.filter(
    (point, index) => point === level.inspection.patrolRoute[index]
  ).length;

  const contractsCorrect = contracts.decisions.filter(
    (d, i) => d && level.contracts.correctAnswers[level.contracts.tenants[i].id] === d.optionId
  ).length;

  const metersCorrect = meters.readings.filter((r) => {
    if (!r) return false;
    const allMeters = [...level.meters.waterMeters, ...level.meters.electricMeters];
    const meter = allMeters.find((m) => m.id === r.meterId);
    if (!meter) return false;
    const tolerance = meter.tolerance || level.meters.tolerance || 5;
    return Math.abs(r.value - meter.correctReading) <= tolerance;
  }).length;

  const workOrderStats = {
    total: workOrders.completedOrders.length + workOrders.timeoutCount,
    completed: workOrders.completedOrders.length,
    correct: workOrders.completedOrders.filter((o) => o.isCorrect).length,
    avgResponseTime: workOrders.completedOrders.length > 0
      ? Math.round(
          workOrders.completedOrders.reduce((sum, o) => sum + o.responseTime, 0) /
          workOrders.completedOrders.length
        )
      : 0,
  };

  const renderStarIcon = (filled: boolean, index: number) => (
    <Star
      key={index}
      className={`w-12 h-12 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
    />
  );

  const tabs = [
    { id: 'overview', label: '总览' },
    { id: 'inspection', label: '巡检路线' },
    { id: 'contracts', label: '合同审批' },
    { id: 'meters', label: '水电核算' },
    { id: 'workOrders', label: '报修响应' },
  ] as const;

  return (
    <GameContainer>
      <Header showBack={false} title="关卡复盘" />

      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border-primary-500/30">
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">
                  {level.name} - 完成！
                </h1>

                <div className="flex justify-center gap-2 mb-6">
                  {[0, 1, 2].map((i) => renderStarIcon(i < stars, i))}
                </div>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">总得分</p>
                    <p className="text-5xl font-bold text-accent-400">
                      {Math.round(score)}
                    </p>
                    <p className="text-gray-500 text-sm">/ {maxScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">评级</p>
                    <p className={`text-6xl font-bold ${color}`}>
                      {grade}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">用时</p>
                    <p className="text-3xl font-bold text-white">
                      {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-gray-500 text-sm">分钟</p>
                  </div>
                </div>
                <p className="text-gray-400">
                  {stars === 3
                    ? '🎉 完美！你已经完全掌握了物业管理的核心技能！'
                    : stars === 2
                    ? '👍 表现不错！继续努力提升你的决策能力！'
                    : stars === 1
                    ? '💪 还需要加强练习，你可以做得更好！'
                    : '📚 不要灰心，多加练习一定能进步！'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all min-h-[48px]
                  ${activeTab === tab.id
                    ? 'bg-accent-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">总正确率</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(
                          ((inspectionCorrect + contractsCorrect + metersCorrect) /
                            (level.inspection.patrolPoints.length +
                              level.contracts.tenants.length +
                              level.meters.waterMeters.length +
                              level.meters.electricMeters.length)) *
                            100
                        )}%
                      </p>
                    </div>
                  </div>
                  <ProgressBar
                    value={inspectionCorrect + contractsCorrect + metersCorrect}
                    max={
                      level.inspection.patrolPoints.length +
                      level.contracts.tenants.length +
                      level.meters.waterMeters.length +
                      level.meters.electricMeters.length
                    }
                    variant="success"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">巡检路线</p>
                      <p className="text-2xl font-bold text-white">
                        {inspectionCorrect}/{level.inspection.patrolPoints.length}
                      </p>
                    </div>
                  </div>
                  <ProgressBar
                    value={inspectionCorrect}
                    max={level.inspection.patrolPoints.length}
                    variant="info"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">合同审批</p>
                      <p className="text-2xl font-bold text-white">
                        {contractsCorrect}/{level.contracts.tenants.length}
                      </p>
                    </div>
                  </div>
                  <ProgressBar
                    value={contractsCorrect}
                    max={level.contracts.tenants.length}
                    variant="default"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Gauge className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">水电核算</p>
                      <p className="text-2xl font-bold text-white">
                        {metersCorrect}/{level.meters.waterMeters.length + level.meters.electricMeters.length}
                      </p>
                    </div>
                  </div>
                  <ProgressBar
                    value={metersCorrect}
                    max={level.meters.waterMeters.length + level.meters.electricMeters.length}
                    variant="warning"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'inspection' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>巡检路线复盘</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <h4 className="text-green-400 font-bold mb-2">正确路线</h4>
                      <div className="flex flex-wrap gap-2">
                        {level.inspection.patrolRoute.map((pointIndex, i) => {
                          const point = level.inspection.patrolPoints[pointIndex];
                          return (
                            <span
                              key={i}
                              className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm"
                            >
                              {i + 1}. {point?.name || `点${pointIndex + 1}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <h4 className="text-blue-400 font-bold mb-2">你的路线</h4>
                      <div className="flex flex-wrap gap-2">
                        {inspection.playerRoute.map((pointIndex, i) => {
                          const point = level.inspection.patrolPoints[pointIndex];
                          const isCorrect = pointIndex === level.inspection.patrolRoute[i];
                          return (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                isCorrect
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {i + 1}. {point?.name || `点${pointIndex + 1}`}
                              {isCorrect ? ' ✓' : ' ✗'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'contracts' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>合同审批复盘</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {level.contracts.tenants.map((tenant: Tenant, index: number) => {
                  const decision = contracts.decisions[index];
                  const correctAnswer = level.contracts.correctAnswers[tenant.id];
                  const isCorrect = decision?.optionId === correctAnswer;
                  const selectedOption = level.contracts.approvalOptions.find(
                    (o: { id: string; }) => o.id === decision?.optionId
                  );
                  const correctOption = level.contracts.approvalOptions.find(
                    (o: { id: string; }) => o.id === correctAnswer
                  );
                  
                  return (
                    <div
                      key={tenant.id}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-white">{tenant.name}</p>
                            <p className="text-sm text-gray-400">
                              {tenant.industry} · {tenant.size}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">你的选择</p>
                          <p className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedOption?.label || '未选择'}
                          </p>
                        </div>
                      </div>
                      {!isCorrect && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <p className="text-sm text-gray-400">
                            <span className="text-green-400">正确答案：</span>
                            {correctOption?.label} - {correctOption?.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'meters' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>水电核算复盘</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...level.meters.waterMeters, ...level.meters.electricMeters].map((meter) => {
                  const reading = meters.readings.find((r) => r?.meterId === meter.id);
                  const userValue = reading?.value ?? 0;
                  const correctValue = meter.correctReading;
                  const diff = Math.abs(userValue - correctValue);
                  const tolerance = meter.tolerance || level.meters.tolerance || 5;
                  const isCorrect = diff <= tolerance;
                  const isWater = level.meters.waterMeters.some((m) => m.id === meter.id);
                  
                  return (
                    <div
                      key={meter.id}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-white">
                              {isWater ? '💧' : '⚡'} {meter.location}
                            </p>
                            <p className="text-sm text-gray-400">
                              {isWater ? '水表' : '电表'} · 编号: {meter.id}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-right">
                          <div>
                            <p className="text-xs text-gray-400">你的读数</p>
                            <p className={`font-mono font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {userValue}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">正确读数</p>
                            <p className="font-mono font-bold text-white">
                              {correctValue}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">误差</p>
                            <p className={`font-mono font-bold ${diff === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                              {diff > 0 ? '+' : ''}{userValue - correctValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'workOrders' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>报修响应复盘</CardTitle>
              </CardHeader>
              <CardContent>
                {level.workOrders.enabled ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                        <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {workOrderStats.avgResponseTime}s
                        </p>
                        <p className="text-sm text-gray-400">平均响应时间</p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {workOrderStats.correct}/{workOrderStats.total}
                        </p>
                        <p className="text-sm text-gray-400">正确处理</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {workOrders.timeoutCount}
                        </p>
                        <p className="text-sm text-gray-400">超时次数</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-white mb-4">响应时间趋势</h4>
                      <div className="bg-gray-800/50 rounded-xl p-6">
                        {workOrders.completedOrders.length > 0 ? (
                          <div className="space-y-3">
                            {workOrders.completedOrders.map((order: WorkOrderResult, index: number) => {
                              const maxTime = level.workOrders.timeout;
                              const percentage = Math.min((order.responseTime / maxTime) * 100, 100);
                              const orderInfo = level.workOrders.orders.find((o) => o.id === order.orderId);
                              return (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">
                                      {orderInfo?.title || `工单 ${index + 1}`}
                                      {order.retried && (
                                        <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded">
                                          重判
                                        </span>
                                      )}
                                    </span>
                                    <span className={order.isCorrect ? 'text-green-400' : 'text-red-400'}>
                                      {order.responseTime}s
                                    </span>
                                  </div>
                                  <ProgressBar
                                    value={order.responseTime}
                                    max={maxTime}
                                    variant={percentage > 80 ? 'danger' : percentage > 50 ? 'warning' : 'success'}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">
                          暂无工单处理记录
                        </p>
                      )}
                      </div>
                    </div>

                    <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                      <h4 className="text-primary-300 font-bold mb-2">📊 报修响应分析</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>
                          {workOrderStats.avgResponseTime < 15
                            ? '✅ 响应速度很快，保持这个效率！'
                            : workOrderStats.avgResponseTime < 25
                            ? '⏱️ 响应速度适中，可以更快一些'
                            : '⚠️ 响应速度较慢，需要提升决策效率'}
                        </li>
                        <li>
                          {workOrders.timeoutCount === 0
                            ? '✅ 没有超时记录，很棒！'
                            : `⚠️ 有 ${workOrders.timeoutCount} 次超时，注意时间管理`}
                        </li>
                        <li>
                          {workOrderStats.correct === workOrderStats.total
                            ? '✅ 所有工单处理正确！'
                            : '💡 部分工单处理有误，复盘时注意学习正确处理方式'}
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    本关卡未启用工单系统
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleBackToMenu}
              keyboardShortcut="Esc"
            >
              <Home className="w-5 h-5 mr-2" />
              返回主菜单
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleReplay}
              keyboardShortcut="Enter"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重新挑战
            </Button>
          </div>
        </div>
      </div>
    </GameContainer>
  );
};

export default ReviewPage;
