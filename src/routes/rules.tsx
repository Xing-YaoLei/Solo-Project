import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Edit, Trash2, Settings, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/services/api';
import type { UsageRule, InventoryThreshold } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/rules')({
  component: RulesPage,
});

function RulesPage() {
  const [usageRules, setUsageRules] = useState<UsageRule[]>([]);
  const [thresholds, setThresholds] = useState<InventoryThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usage' | 'threshold'>('usage');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, thresholdsData] = await Promise.all([
        api.getUsageRules(),
        api.getInventoryThresholds(),
      ]);
      setUsageRules(rulesData);
      setThresholds(thresholdsData);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'usage', label: '领用规则', icon: Settings, count: usageRules.length },
    { key: 'threshold', label: '盘点阈值', icon: Scale, count: thresholds.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">规则配置</h1>
          <p className="text-gray-500 mt-1">管理人员维护领用规则和盘点差异阈值</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          新增规则
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'usage' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">领用规则总数</p>
                      <p className="text-2xl font-bold text-blue-700">{usageRules.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600">需审批规则</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {usageRules.filter(r => r.requiresApproval).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">免审批规则</p>
                      <p className="text-2xl font-bold text-green-700">
                        {usageRules.filter(r => !r.requiresApproval).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {usageRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="p-5 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                              {rule.category}
                            </span>
                            {rule.requiresApproval ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                需审批
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                <CheckCircle className="w-3 h-3" />
                                免审批
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mt-3">
                            单日最大领用: {rule.maxQuantityPerDay.toLocaleString()} 单位
                          </h3>
                          <p className="text-sm text-gray-500 mt-2">{rule.description}</p>
                          {rule.requiresApproval && (
                            <p className="text-xs text-orange-600 mt-2">
                              审批级别: {rule.approvalLevel} 级审批
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'threshold' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Scale className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">阈值配置数</p>
                      <p className="text-2xl font-bold text-blue-700">{thresholds.length}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">平均允许误差</p>
                      <p className="text-2xl font-bold text-green-700">
                        {thresholds.length > 0 
                          ? (thresholds.reduce((sum, t) => sum + t.allowableErrorRate, 0) / thresholds.length).toFixed(1)
                          : '0.0'
                        }%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">最低误差率</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {thresholds.length > 0 
                          ? Math.min(...thresholds.map(t => t.allowableErrorRate)).toFixed(1)
                          : '0.0'
                        }%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {thresholds.map((threshold, index) => (
                    <div
                      key={threshold.id}
                      className="p-5 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                              {threshold.category}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">允许误差率</p>
                              <p className={cn(
                                'text-xl font-bold mt-1',
                                threshold.allowableErrorRate <= 1 ? 'text-red-600' :
                                threshold.allowableErrorRate <= 2 ? 'text-orange-600' : 'text-green-600'
                              )}>
                                ±{threshold.allowableErrorRate}%
                              </p>
                              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    threshold.allowableErrorRate <= 1 ? 'bg-red-500' :
                                    threshold.allowableErrorRate <= 2 ? 'bg-orange-500' : 'bg-green-500'
                                  )}
                                  style={{ width: `${threshold.allowableErrorRate * 20}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">超量预警阈值</p>
                              <p className="text-xl font-bold text-blue-600 mt-1">
                                {threshold.excessWarningThreshold.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                超过此数量触发库存积压预警
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
