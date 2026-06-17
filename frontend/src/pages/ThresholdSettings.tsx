import { useState, useEffect } from 'react';
import ChartCard from '@/components/ChartCard';
import { thresholdApi } from '@/services/api';
import type { ThresholdConfig, ThresholdChangeLog } from '@/types';
import { Settings, Edit2, Check, X, Clock, User } from 'lucide-react';

export default function ThresholdSettings() {
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [changeLogs, setChangeLogs] = useState<ThresholdChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ warning: 0, critical: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [thresholdList, logs] = await Promise.all([
          thresholdApi.getAll(),
          thresholdApi.getChangeLogs(undefined, 10),
        ]);
        setThresholds(thresholdList);
        setChangeLogs(logs);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (threshold: ThresholdConfig) => {
    setEditingId(threshold.id);
    setEditValues({
      warning: threshold.warningThreshold,
      critical: threshold.criticalThreshold,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    try {
      const updated = await thresholdApi.update(
        id,
        editValues.warning,
        editValues.critical
      );
      setThresholds(thresholds.map((t) => (t.id === id ? updated : t)));
      const logs = await thresholdApi.getChangeLogs(undefined, 10);
      setChangeLogs(logs);
      setEditingId(null);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const getLevelBadge = (metricKey: string, value: number) => {
    const threshold = thresholds.find((t) => t.metricKey === metricKey);
    if (!threshold) return 'bg-slate-100 text-slate-600';
    if (value >= threshold.criticalThreshold) return 'bg-danger-100 text-danger-700';
    if (value >= threshold.warningThreshold) return 'bg-warning-100 text-warning-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">预警阈值配置</h1>
          <p className="text-sm text-slate-500 mt-1">
            自定义各指标的预警阈值，当指标超过阈值时将触发预警提醒
          </p>
        </div>
      </div>

      <ChartCard title="阈值配置列表" subtitle="点击编辑按钮调整阈值">
        <div className="space-y-4">
          {thresholds.map((threshold) => (
            <div
              key={threshold.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {threshold.metricName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      指标标识：{threshold.metricKey}
                    </p>
                  </div>
                </div>

                {editingId === threshold.id ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-warning-600 font-medium">预警阈值</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editValues.warning}
                          onChange={(e) =>
                            setEditValues({ ...editValues, warning: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1.5 text-sm border border-warning-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                        />
                        <span className="text-sm text-slate-500">{threshold.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-danger-600 font-medium">严重阈值</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editValues.critical}
                          onChange={(e) =>
                            setEditValues({ ...editValues, critical: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1.5 text-sm border border-danger-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-transparent"
                        />
                        <span className="text-sm text-slate-500">{threshold.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSave(threshold.id)}
                        className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                        title="保存"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-warning-600 font-medium mb-1">预警阈值</div>
                      <div className="text-lg font-bold text-warning-600">
                        {threshold.warningThreshold}
                        <span className="text-sm font-normal ml-1">{threshold.unit}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-danger-600 font-medium mb-1">严重阈值</div>
                      <div className="text-lg font-bold text-danger-600">
                        {threshold.criticalThreshold}
                        <span className="text-sm font-normal ml-1">{threshold.unit}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(threshold)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑
                    </button>
                  </div>
                )}
              </div>

              {!editingId && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span>最后更新：{threshold.updatedBy}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{threshold.updatedAt}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="阈值变更记录" subtitle="最近10条变更历史">
        <div className="space-y-3">
          {changeLogs.map((log, index) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-3 rounded-lg bg-slate-50"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    {log.metricName}
                  </span>
                  <span className="text-xs text-slate-500">{log.changedAt}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-slate-500">预警阈值：</span>
                  <span className="text-warning-600 line-through">{log.oldWarning}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-warning-700 font-medium">{log.newWarning}</span>
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-slate-500">严重阈值：</span>
                  <span className="text-danger-600 line-through">{log.oldCritical}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-danger-700 font-medium">{log.newCritical}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  操作人：{log.changedBy}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
