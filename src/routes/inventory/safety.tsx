import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AlertTriangle, TrendingDown, Edit3, Settings, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import type { SafetyStockConfig } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/inventory/safety')({
  component: SafetyStockPage,
});

function SafetyStockPage() {
  const [stocks, setStocks] = useState<SafetyStockConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.getSafetyStock();
      setStocks(data);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: SafetyStockConfig) => {
    if (item.currentStock <= item.minStock) {
      return { level: 'danger', label: '库存紧缺', color: 'red', textColor: 'text-red-600', bgColor: 'bg-red-50' };
    }
    if (item.currentStock <= item.warningStock) {
      return { level: 'warning', label: '库存偏低', color: 'orange', textColor: 'text-orange-600', bgColor: 'bg-orange-50' };
    }
    if (item.currentStock > item.warningStock * 2) {
      return { level: 'overstock', label: '库存偏高', color: 'blue', textColor: 'text-blue-600', bgColor: 'bg-blue-50' };
    }
    return { level: 'normal', label: '库存正常', color: 'green', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  };

  const getProgressColor = (item: SafetyStockConfig) => {
    const percentage = (item.currentStock / item.warningStock) * 100;
    if (percentage <= 30) return 'bg-red-500';
    if (percentage <= 60) return 'bg-orange-500';
    if (percentage > 200) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">安全库存管理</h1>
          <p className="text-gray-500 mt-1">监控各区域材料库存，设置预警线和补货建议</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </button>
          <button className="btn-primary">
            <Settings className="w-4 h-4 mr-2" />
            配置预警
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 font-display">
                {stocks.filter(s => s.currentStock <= s.minStock).length}
              </p>
              <p className="text-sm text-gray-500">库存紧缺</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 font-display">
                {stocks.filter(s => s.currentStock > s.minStock && s.currentStock <= s.warningStock).length}
              </p>
              <p className="text-sm text-gray-500">库存偏低</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 font-display">
                {stocks.filter(s => s.currentStock > s.warningStock * 2).length}
              </p>
              <p className="text-sm text-gray-500">库存偏高</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 h-48 animate-pulse" />
          ))
        ) : (
          stocks.map((item, index) => {
            const status = getStockStatus(item);
            const progress = Math.min((item.currentStock / item.warningStock) * 100, 120);
            const isUrgent = item.estimatedDaysLeft <= 7;

            return (
              <div
                key={item.id}
                className={cn(
                  'card p-6 animate-fade-in-up transition-all duration-300',
                  isUrgent && 'ring-2 ring-red-200 animate-pulse-slow'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{item.materialName}</h3>
                      <span className={cn('badge', status.bgColor, status.textColor)}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>{item.region}</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">当前库存</span>
                    <span className="font-semibold text-gray-900">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-500', getProgressColor(item))}
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-0 w-0.5 h-full bg-gray-300"
                      style={{ left: '100%' }}
                      title="预警线"
                    />
                    <div
                      className="absolute top-0 w-0.5 h-full bg-orange-400"
                      style={{ left: `${(item.minStock / item.warningStock) * 100}%` }}
                      title="最低库存线"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>最低: {item.minStock}</span>
                    <span>预警: {item.warningStock}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">日消耗速率</p>
                    <p className="font-medium text-gray-900">{item.consumptionRate} {item.unit}/天</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">预计可用天数</p>
                    <p className={cn(
                      'font-medium',
                      isUrgent ? 'text-red-600' : 'text-gray-900'
                    )}>
                      {item.estimatedDaysLeft} 天
                      {isUrgent && <span className="ml-1 text-xs">⚠️ 紧急</span>}
                    </p>
                  </div>
                </div>

                {isUrgent && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm text-red-700">
                      ⚠️ 预计 {item.estimatedDaysLeft} 天后缺货，建议立即补货
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      建议补货量: {Math.ceil((item.warningStock - item.currentStock) / 50) * 50 + item.consumptionRate * 7} {item.unit}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
