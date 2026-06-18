import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MATERIALS, getConfigByDifficulty } from '../../config/gameConfig';
import { generateReviewData } from '../../utils/gameUtils';

interface SettlementPageProps {
  onComplete: () => void;
}

export function SettlementPage({ onComplete }: SettlementPageProps) {
  const inventory = useGameStore(state => state.inventory);
  const deliveries = useGameStore(state => state.deliveries);
  const usageRecords = useGameStore(state => state.usageRecords);
  const events = useGameStore(state => state.events);
  const score = useGameStore(state => state.score);
  const totalScore = useGameStore(state => state.totalScore);
  const difficulty = useGameStore(state => state.difficulty);
  const completeSettlement = useGameStore(state => state.completeSettlement);
  const currentDay = useGameStore(state => state.currentDay);

  const [step, setStep] = useState(1);
  const [differencesChecked, setDifferencesChecked] = useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = useState(false);

  const config = getConfigByDifficulty(difficulty);

  const acceptedDeliveries = deliveries.filter(d => d.status === 'accepted');
  const shortageDeliveries = deliveries.filter(d => d.status === 'shortage');
  const totalShortageAmount = shortageDeliveries.reduce((sum, d) => sum + (d.shortageAmount || 0), 0);
  const resolvedEvents = events.filter(e => e.resolved);
  const unresolvedEvents = events.filter(e => !e.resolved);

  const reviewData = generateReviewData(useGameStore.getState(), currentDay);

  const handleCheckDifference = (materialType: string) => {
    setDifferencesChecked(prev => {
      const updated = { ...prev, [materialType]: true };
      const allChecked = inventory.every(inv => updated[inv.materialType]);
      setAllChecked(allChecked);
      return updated;
    });
  };

  const calculateDifference = (inv: typeof inventory[0]) => {
    const totalDelivered = acceptedDeliveries
      .filter(d => d.materialType === inv.materialType)
      .reduce((sum, d) => sum + d.quantity - (d.shortageAmount || 0), 0);
    const totalUsed = usageRecords
      .filter(u => u.materialType === inv.materialType)
      .reduce((sum, u) => sum + u.quantity, 0);
    const expected = totalDelivered - totalUsed;
    return {
      expected,
      actual: inv.quantity,
      difference: inv.quantity - expected
    };
  };

  const handleComplete = () => {
    completeSettlement();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 工程结算</h1>
          <p className="text-blue-300">工期已完成，请进行盘点和结算</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= s
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 h-1 ${
                    step > s ? 'bg-blue-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">1️⃣ 配送情况汇总</h2>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🚚</div>
                <div className="text-white font-bold text-2xl">{deliveries.length}</div>
                <div className="text-gray-400">总配送批次</div>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-green-400 font-bold text-2xl">{acceptedDeliveries.length}</div>
                <div className="text-gray-400">已签收</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-red-400 font-bold text-2xl">{shortageDeliveries.length}</div>
                <div className="text-gray-400">短缺批次</div>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-orange-400 font-bold text-2xl">{totalShortageAmount}</div>
                <div className="text-gray-400">短缺总量</div>
              </div>
            </div>

            {shortageDeliveries.length > 0 && (
              <div className="bg-red-500/10 rounded-xl p-4 mb-6">
                <h3 className="text-red-400 font-bold mb-3">短缺详情</h3>
                <div className="space-y-2">
                  {shortageDeliveries.map(d => {
                    const material = MATERIALS[d.materialType];
                    return (
                      <div key={d.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{material.icon}</span>
                          <div>
                            <div className="text-white">{material.name}</div>
                            <div className="text-gray-400 text-sm">第{d.actualDay}天到货</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-400 font-bold">
                            短缺 {d.shortageAmount} {material.unit}
                          </div>
                          <div className="text-gray-400 text-sm">
                            订购 {d.quantity}，实到 {d.quantity - (d.shortageAmount || 0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
            >
              下一步：检查库存差异 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">2️⃣ 库存盘点差异</h2>
            <p className="text-gray-400 mb-4">请核对每种材料的理论库存和实际库存差异</p>

            <div className="space-y-3 mb-6">
              {inventory.map(inv => {
                const material = MATERIALS[inv.materialType];
                const diff = calculateDifference(inv);
                const isChecked = differencesChecked[inv.materialType];
                const hasDifference = diff.difference !== 0;

                return (
                  <div
                    key={inv.materialType}
                    className={`bg-white/5 rounded-xl p-4 border-2 transition-all ${
                      isChecked
                        ? hasDifference
                          ? 'border-orange-500'
                          : 'border-green-500'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{material.icon}</span>
                        <div>
                          <div className="text-white font-bold">{material.name}</div>
                          <div className="text-gray-400 text-sm">{material.unit}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckDifference(inv.materialType)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isChecked
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        {isChecked ? '✓ 已核对' : '核对'}
                      </button>
                    </div>

                    {isChecked && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">理论库存</div>
                          <div className="text-white font-bold">{diff.expected} {material.unit}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">实际库存</div>
                          <div className="text-white font-bold">{diff.actual} {material.unit}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">差异</div>
                          <div className={`font-bold ${
                            diff.difference > 0 ? 'text-green-400' :
                            diff.difference < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {diff.difference > 0 ? '+' : ''}{diff.difference} {material.unit}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                ← 上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!allChecked}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
              >
                下一步：事件处理 →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">3️⃣ 事件处理情况</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-500/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <div className="text-green-400 font-bold text-xl">{resolvedEvents.length}</div>
                    <div className="text-gray-400">已处理事件</div>
                  </div>
                </div>
                {resolvedEvents.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {resolvedEvents.map(e => (
                      <div key={e.id} className="text-sm text-gray-400 p-2 bg-white/5 rounded">
                        第{e.day}天: {e.message.substring(0, 30)}...
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-red-500/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <div className="text-red-400 font-bold text-xl">{unresolvedEvents.length}</div>
                    <div className="text-gray-400">未处理事件</div>
                  </div>
                </div>
                {unresolvedEvents.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {unresolvedEvents.map(e => (
                      <div key={e.id} className="text-sm text-red-400 p-2 bg-red-500/10 rounded">
                        第{e.day}天: {e.message.substring(0, 30)}...
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-green-400 text-sm">🎉 所有事件已处理完毕！</div>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-bold mb-3">📋 事件类型统计</h3>
              <div className="grid grid-cols-4 gap-4">
                {['shortage', 'delay', 'quality', 'extra_demand'].map(type => {
                  const count = events.filter(e => e.type === type).length;
                  const typeNames: Record<string, string> = {
                    shortage: '短缺',
                    delay: '延误',
                    quality: '质量',
                    extra_demand: '追加'
                  };
                  const icons: Record<string, string> = {
                    shortage: '⚠️',
                    delay: '⏰',
                    quality: '🔍',
                    extra_demand: '📈'
                  };
                  return (
                    <div key={type} className="text-center">
                      <div className="text-2xl">{icons[type]}</div>
                      <div className="text-white font-bold">{count}</div>
                      <div className="text-gray-400 text-sm">{typeNames[type]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                ← 上一步
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
              >
                下一步：费用结算 →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">4️⃣ 费用结算</h2>

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">基础得分</span>
                  <span className="text-white font-bold">1000 分</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">工期奖励 ({currentDay}天)</span>
                  <span className="text-green-400 font-bold">+{currentDay * 50} 分</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">短缺扣分 ({totalShortageAmount}单位 × {config.shortagePenalty}分)</span>
                  <span className="text-red-400 font-bold">-{totalShortageAmount * config.shortagePenalty} 分</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">未处理事件 ({unresolvedEvents.length}个 × 50分)</span>
                  <span className="text-red-400 font-bold">-{unresolvedEvents.length * 50} 分</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">已处理事件奖励 ({resolvedEvents.length}个 × 30分)</span>
                  <span className="text-green-400 font-bold">+{resolvedEvents.length * 30} 分</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">完美配送 ({reviewData.statistics.perfectDeliveries}个 × 20分)</span>
                  <span className="text-green-400 font-bold">+{reviewData.statistics.perfectDeliveries * 20} 分</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-blue-500">
                <div className="flex items-center justify-between">
                  <span className="text-white text-xl font-bold">最终得分</span>
                  <div className="text-right">
                    <div className="text-4xl font-bold" style={{
                      color: score >= totalScore * 0.85 ? '#22c55e' :
                             score >= totalScore * 0.7 ? '#eab308' :
                             score >= totalScore * 0.5 ? '#f97316' : '#ef4444'
                    }}>
                      {score}
                    </div>
                    <div className="text-gray-400 text-sm">/ {totalScore} 满分</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                ← 上一步
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all transform hover:scale-105"
              >
                🎉 完成结算，查看复盘
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
