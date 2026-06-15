import { useState, useEffect } from 'react';
import { reminderApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { ReminderRule, ReminderRecord, RiskLevel } from '@/types';

const riskColors: Record<RiskLevel, string> = {
  normal: 'bg-risk-normal',
  warning: 'bg-risk-warning',
  danger: 'bg-risk-danger',
  critical: 'bg-risk-critical',
};

const riskLabels: Record<RiskLevel, string> = {
  normal: '正常',
  warning: '提醒',
  danger: '风险',
  critical: '严重',
};

const ruleTypeLabels: Record<string, string> = {
  completion_rate: '完成率',
  days_without_practice: '未练习天数',
  accuracy_rate: '正确率',
};

export default function RemindersPage() {
  const { hasRole } = useAuthStore();
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [myReminders, setMyReminders] = useState<ReminderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'mine'>('mine');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'completion_rate',
    threshold: 60,
    risk_level: 'warning' as RiskLevel,
    days_without_practice: undefined as number | undefined,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'rules' && hasRole(['admin', 'manager'])) {
        const data = await reminderApi.listRules();
        setRules(data);
      } else if (activeTab === 'mine') {
        const data = await reminderApi.getMyReminders();
        setMyReminders(data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await reminderApi.updateRule(editingRule.id, formData);
      } else {
        await reminderApi.createRule(formData);
      }
      setShowModal(false);
      setEditingRule(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || '操作失败');
    }
  };

  const handleEdit = (rule: ReminderRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      threshold: rule.threshold,
      risk_level: rule.risk_level,
      days_without_practice: rule.days_without_practice,
      is_active: rule.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个规则吗？')) return;
    try {
      await reminderApi.deleteRule(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || '删除失败');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await reminderApi.markRead(id);
      loadData();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const canManage = hasRole(['admin', 'manager']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">提醒中心</h1>
        {canManage && activeTab === 'rules' && (
          <button
            onClick={() => {
              setEditingRule(null);
              setFormData({
                name: '',
                description: '',
                rule_type: 'completion_rate',
                threshold: 60,
                risk_level: 'warning',
                days_without_practice: undefined,
                is_active: true,
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + 新建规则
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'mine'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              我的提醒
              {myReminders.filter(r => !r.is_read).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {myReminders.filter(r => !r.is_read).length}
                </span>
              )}
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'rules'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                提醒规则
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'mine' && (
            <div className="space-y-3">
              {myReminders.map(reminder => (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-lg border transition ${
                    reminder.is_read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${reminder.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {reminder.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(reminder.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {!reminder.is_read && (
                      <button
                        onClick={() => handleMarkRead(reminder.id)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        标记已读
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {myReminders.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  暂无提醒消息
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && canManage && (
            <div className="divide-y divide-gray-100">
              {rules.map(rule => (
                <div key={rule.id} className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${riskColors[rule.risk_level]}`}>
                        {riskLabels[rule.risk_level]}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {rule.is_active ? '已启用' : '已停用'}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>类型: {ruleTypeLabels[rule.rule_type] || rule.rule_type}</span>
                      <span>阈值: {rule.threshold}{rule.rule_type === 'completion_rate' || rule.rule_type === 'accuracy_rate' ? '%' : '天'}</span>
                      {rule.days_without_practice && (
                        <span>未练习天数: {rule.days_without_practice}天</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              {rules.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  暂无提醒规则
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingRule ? '编辑规则' : '新建规则'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规则类型</label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="completion_rate">完成率</option>
                    <option value="days_without_practice">未练习天数</option>
                    <option value="accuracy_rate">正确率</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">阈值</label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">触发风险等级</label>
                <select
                  value={formData.risk_level}
                  onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as RiskLevel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="normal">正常</option>
                  <option value="warning">提醒</option>
                  <option value="danger">风险</option>
                  <option value="critical">严重</option>
                </select>
              </div>
              {formData.rule_type === 'days_without_practice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">未练习天数</label>
                  <input
                    type="number"
                    value={formData.days_without_practice || ''}
                    onChange={(e) => setFormData({ ...formData, days_without_practice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="连续多少天未练习触发"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">启用此规则</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
