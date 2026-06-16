'use client';

import { useState } from 'react';
import {
  Settings,
  AlertTriangle,
  Clock,
  DollarSign,
  Stethoscope,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { DEFAULT_THRESHOLDS } from '@/services/thresholdService';
import { cn } from '@/lib/utils';

interface ThresholdConfig {
  key: string;
  name: string;
  value: string;
  type: string;
  description: string;
  category: string;
}

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  revisit: { label: '复诊率', icon: Clock, color: 'text-blue-600 bg-blue-50' },
  missed: { label: '爽约次数', icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
  treatment: { label: '治疗周期', icon: Stethoscope, color: 'text-purple-600 bg-purple-50' },
  payment: { label: '缴费情况', icon: DollarSign, color: 'text-green-600 bg-green-50' },
};

export default function ThresholdConfigPage() {
  const [configs, setConfigs] = useState<ThresholdConfig[]>(
    Object.values(DEFAULT_THRESHOLDS).map((config) => ({
      key: config.key,
      name: config.name,
      value: config.value,
      type: config.type,
      description: config.description,
      category: config.category,
    }))
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['revisit', 'missed'])
  );
  const [savedMessage, setSavedMessage] = useState(false);

  const categories = [...new Set(configs.map((c) => c.category))];

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleValueChange = (key: string, newValue: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value: newValue } : c))
    );
  };

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleReset = () => {
    setConfigs(
      Object.values(DEFAULT_THRESHOLDS).map((config) => ({
        key: config.key,
        name: config.name,
        value: config.value,
        type: config.type,
        description: config.description,
        category: config.category,
      }))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Settings size={24} className="text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">阈值配置</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  调整预警阈值，系统将根据配置自动生成复盘任务
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RotateCcw size={16} />
                恢复默认
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                保存配置
              </button>
            </div>
          </div>
        </div>
      </header>

      {savedMessage && (
        <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Save size={16} />
          配置已保存
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">关于阈值配置</h4>
              <p className="text-sm text-blue-600 mt-1">
                阈值是触发预警的临界点。当患者的指标低于或超过设定的阈值时，系统会自动生成备注任务，
                提醒医护人员及时关注和处理。您可以根据诊所的实际情况灵活调整这些阈值。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((category) => {
            const catConfig = categoryConfig[category] || {
              label: category,
              icon: Settings,
              color: 'text-slate-600 bg-slate-50',
            };
            const CatIcon = catConfig.icon;
            const isExpanded = expandedCategories.has(category);
            const categoryConfigs = configs.filter((c) => c.category === category);

            return (
              <div key={category} className="card overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full card-header flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', catConfig.color)}>
                      <CatIcon size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-800">
                        {catConfig.label}阈值
                      </h3>
                      <p className="text-sm text-slate-500">
                        共 {categoryConfigs.length} 项配置
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {categoryConfigs.map((config) => (
                      <div
                        key={config.key}
                        className="px-6 py-4 flex items-center justify-between gap-6"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label className="font-medium text-slate-800">
                              {config.name}
                            </label>
                            {config.type === 'percentage' && (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                百分比
                              </span>
                            )}
                            {config.type === 'number' && (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                数值
                              </span>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-sm text-slate-500 mt-1">
                              {config.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            value={config.value}
                            onChange={(e) =>
                              handleValueChange(config.key, e.target.value)
                            }
                            className="w-24 input text-right"
                            step={config.type === 'percentage' ? '1' : '1'}
                          />
                          <span className="text-slate-500 w-6">
                            {config.type === 'percentage' ? '%' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">阈值生效说明</h3>
          </div>
          <div className="card-body space-y-4 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">预警级别</p>
                <p className="text-slate-500">
                  系统采用两级预警机制：预警（黄色）和严重（红色）。当指标触发严重阈值时，会生成高优先级的备注任务。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">自动任务生成</p>
                <p className="text-slate-500">
                  系统每天凌晨自动扫描所有正畸患者，当发现符合预警条件的患者时，自动生成备注任务并分配给相关医生。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">配置生效时间</p>
                <p className="text-slate-500">
                  保存配置后立即生效，下次扫描时将使用新的阈值进行判断。已生成的任务不受阈值调整影响。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
