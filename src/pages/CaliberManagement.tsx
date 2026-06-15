import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle, Clock, Plus, Info, Zap, Target } from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface CaliberVersionData {
  version: string;
  effectiveDate: string;
  formula: string;
  description: string;
  changeReason: string;
  isActive: boolean;
  createdAt: string;
}

interface CaliberVersionCreate {
  version: string;
  effectiveDate: string;
  formula: string;
  description: string;
  changeReason: string;
}

const CaliberManagement: React.FC = () => {
  const [versions, setVersions] = useState<CaliberVersionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersion, setNewVersion] = useState<CaliberVersionCreate>({
    version: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    formula: '',
    description: '',
    changeReason: '',
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const data = await api.caliber.getVersions();
      const list = Array.isArray(data) ? data : data.data || [];
      setVersions(list);
    } catch (error) {
      console.error('Failed to fetch caliber versions:', error);
      const mockVersions: CaliberVersionData[] = [
        {
          version: 'v1.2',
          effectiveDate: '2024-01-10',
          formula: '完成率 = 已完成题目数 / (总题目数 - 退学学员应做题目数) × 100%',
          description: '优化分母计算逻辑，排除已退学学员',
          changeReason: '发现已退学学员拉低整体完成率，需排除统计',
          isActive: true,
          createdAt: '2024-01-10T10:30:00',
        },
        {
          version: 'v1.1',
          effectiveDate: '2024-01-05',
          formula: '完成率 = Σ(单次完成 × 权重) / 总题目数 × 100%，重复练习权重递减',
          description: '调整重复练习题目的计算权重',
          changeReason: '重复做同一道题被重复计数，数据失真',
          isActive: false,
          createdAt: '2024-01-05T14:20:00',
        },
        {
          version: 'v1.0',
          effectiveDate: '2024-01-01',
          formula: '完成率 = 已完成题目数 / 总题目数 × 100%',
          description: '初始版本，简单完成率计算',
          changeReason: '项目启动，建立基础统计口径',
          isActive: false,
          createdAt: '2024-01-01T09:00:00',
        },
      ];
      setVersions(mockVersions);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (version: string) => {
    if (!confirm(`确定要激活版本 ${version} 吗？这将影响所有指标计算。`)) return;
    try {
      await api.caliber.activateVersion(version);
      await fetchVersions();
    } catch (error) {
      console.error('Failed to activate version:', error);
    }
  };

  const handleCreate = async () => {
    if (!newVersion.version || !newVersion.formula || !newVersion.description || !newVersion.changeReason) {
      alert('请填写完整信息（版本号、描述、计算公式、变更原因）');
      return;
    }
    try {
      await api.caliber.createVersion(newVersion);
      setShowCreateModal(false);
      setNewVersion({
        version: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        formula: '',
        description: '',
        changeReason: '',
      });
      await fetchVersions();
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const activeVersion = versions.find(v => v.isActive);

  const formatTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('zh-CN', { hour12: false });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">口径管理</h1>
          <p className="text-dark-400 text-sm">管理完成率计算口径的版本历史和切换</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all"
        >
          <Plus size={18} />
          <span>创建新版本</span>
        </button>
      </div>

      {activeVersion && (
        <div className="card-gradient p-6 border-2 border-primary-500/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                <Zap size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">完成率口径 {activeVersion.version}</h3>
                  <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    当前生效
                  </span>
                </div>
                <p className="text-dark-300 text-sm mb-3">{activeVersion.description}</p>
                <div className="p-3 bg-dark-900/60 rounded-lg border border-dark-700/50">
                  <p className="text-xs text-dark-400 mb-1">计算公式</p>
                  <p className="text-primary-300 font-mono text-sm">{activeVersion.formula}</p>
                </div>
                <div className="flex items-center gap-6 mt-4 text-xs text-dark-400">
                  <span>创建于: {formatTime(activeVersion.createdAt)}</span>
                  <span>生效日期: {activeVersion.effectiveDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-gradient p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={20} className="text-primary-400" />
          口径版本历史
        </h2>
        <div className="space-y-4">
          {versions.map((version, index) => {
            const StatusIcon = version.isActive ? CheckCircle : Clock;
            return (
              <div
                key={version.version}
                className={cn(
                  'p-5 rounded-xl border transition-all',
                  version.isActive
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'bg-dark-800/40 border-dark-700/50 hover:border-dark-600/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      version.isActive
                        ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                        : 'bg-dark-700/60'
                    )}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold">完成率口径 {version.version}</h4>
                        {version.isActive && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <StatusIcon size={10} />
                            生效中
                          </span>
                        )}
                      </div>
                      <p className="text-dark-300 text-sm mb-2">{version.description}</p>
                      <div className="p-2.5 bg-dark-900/60 rounded-lg border border-dark-700/50 mb-2">
                        <p className="text-xs text-dark-400 mb-0.5">计算公式</p>
                        <p className="text-dark-200 font-mono text-xs">{version.formula}</p>
                      </div>
                      <div className="p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20 mb-2">
                        <p className="text-xs text-orange-300 mb-0.5">变更原因</p>
                        <p className="text-orange-100/80 text-xs">{version.changeReason}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span>版本: {version.version}</span>
                        <span>创建: {formatTime(version.createdAt)}</span>
                        <span>生效日期: {version.effectiveDate}</span>
                      </div>
                    </div>
                  </div>
                  {!version.isActive && (
                    <button
                      onClick={() => handleActivate(version.version)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Target size={14} />
                      激活此版本
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-gradient p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={20} className="text-primary-400" />
          口径变更说明
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <Info size={16} />
              为什么需要口径版本管理？
            </h4>
            <p className="text-dark-300 text-sm leading-relaxed">
              完成率的计算口径可能会随着业务发展而调整。保留口径版本历史可以帮助复盘时解释数据变化的原因，
              区分是业务变化还是口径调整导致的指标波动。所有指标计算都会记录所使用的口径版本，确保数据可追溯。
            </p>
          </div>
          <div className="p-4 bg-dark-800/40 rounded-xl border border-dark-700/50">
            <h4 className="text-white font-medium mb-2">口径变更影响范围</h4>
            <ul className="text-dark-300 text-sm space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5">•</span>
                数据总览页面的完成率指标
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5">•</span>
                趋势图表中的完成率曲线
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5">•</span>
                个人工作台的教师完成率统计
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-0.5">•</span>
                所有导出报表中的完成率字段
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-gradient p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">创建新口径版本</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">版本号 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                    placeholder="例如: v1.3"
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">生效日期 <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={newVersion.effectiveDate}
                    onChange={(e) => setNewVersion({ ...newVersion, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">版本描述 <span className="text-red-400">*</span></label>
                <textarea
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  placeholder="描述此版本的主要变更内容..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">变更原因 <span className="text-red-400">*</span></label>
                <textarea
                  value={newVersion.changeReason}
                  onChange={(e) => setNewVersion({ ...newVersion, changeReason: e.target.value })}
                  placeholder="说明为什么需要调整此口径..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">计算公式 <span className="text-red-400">*</span></label>
                <textarea
                  value={newVersion.formula}
                  onChange={(e) => setNewVersion({ ...newVersion, formula: e.target.value })}
                  placeholder="请输入完整的计算公式..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none font-mono text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all"
                >
                  创建版本
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaliberManagement;
