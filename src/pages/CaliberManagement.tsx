import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle, Clock, Plus, Info, Zap, Target } from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface CaliberVersion {
  version: string;
  name: string;
  description: string;
  formula: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  effective_from: string;
  effective_to: string | null;
}

const CaliberManagement: React.FC = () => {
  const [versions, setVersions] = useState<CaliberVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version: '',
    name: '',
    description: '',
    formula: '',
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const data = await api.caliber.getVersions();
      setVersions(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to fetch caliber versions:', error);
      const mockVersions: CaliberVersion[] = [
        {
          version: 'v1.2',
          name: '完成率口径 v1.2',
          description: '优化分母计算逻辑，排除已退学学员',
          formula: '完成率 = 已完成题目数 / (总题目数 - 退学学员应做题目数) × 100%',
          is_active: true,
          created_at: '2024-01-10 10:30:00',
          created_by: 'admin',
          effective_from: '2024-01-10',
          effective_to: null,
        },
        {
          version: 'v1.1',
          name: '完成率口径 v1.1',
          description: '调整重复练习题目的计算权重',
          formula: '完成率 = Σ(单次完成 × 权重) / 总题目数 × 100%，重复练习权重递减',
          is_active: false,
          created_at: '2024-01-05 14:20:00',
          created_by: 'manager',
          effective_from: '2024-01-05',
          effective_to: '2024-01-09',
        },
        {
          version: 'v1.0',
          name: '完成率口径 v1.0',
          description: '初始版本，简单完成率计算',
          formula: '完成率 = 已完成题目数 / 总题目数 × 100%',
          is_active: false,
          created_at: '2024-01-01 09:00:00',
          created_by: 'admin',
          effective_from: '2024-01-01',
          effective_to: '2024-01-04',
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
    if (!newVersion.version || !newVersion.name || !newVersion.formula) {
      alert('请填写完整信息');
      return;
    }
    try {
      await api.caliber.createVersion(newVersion);
      setShowCreateModal(false);
      setNewVersion({ version: '', name: '', description: '', formula: '' });
      await fetchVersions();
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const activeVersion = versions.find(v => v.is_active);

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
                  <h3 className="text-xl font-bold text-white">{activeVersion.name}</h3>
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
                  <span>创建于: {activeVersion.created_at}</span>
                  <span>创建人: {activeVersion.created_by}</span>
                  <span>生效日期: {activeVersion.effective_from}</span>
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
            const StatusIcon = version.is_active ? CheckCircle : Clock;
            return (
              <div
                key={version.version}
                className={cn(
                  'p-5 rounded-xl border transition-all',
                  version.is_active
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'bg-dark-800/40 border-dark-700/50 hover:border-dark-600/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      version.is_active
                        ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                        : 'bg-dark-700/60'
                    )}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold">{version.name}</h4>
                        {version.is_active && (
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
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span>版本: {version.version}</span>
                        <span>创建: {version.created_at}</span>
                        <span>生效: {version.effective_from}{version.effective_to ? ` ~ ${version.effective_to}` : ' ~ 至今'}</span>
                      </div>
                    </div>
                  </div>
                  {!version.is_active && (
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
          <div className="card-gradient p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">创建新口径版本</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">版本号</label>
                  <input
                    type="text"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                    placeholder="例如: v1.3"
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">版本名称</label>
                  <input
                    type="text"
                    value={newVersion.name}
                    onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                    placeholder="例如: 完成率口径 v1.3"
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">版本描述</label>
                <textarea
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  placeholder="描述此版本的主要变更内容..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">计算公式</label>
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
