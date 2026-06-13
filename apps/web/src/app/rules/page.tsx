// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Shield, ArrowRight, Clock, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { apiEndpoints } from '@/lib/api';
import { responsibilityConfig, cn } from '@/lib/utils';
import { ResponsibilityRule, ResponsibilityParty } from '@solo/shared';

export default function RulesPage() {
  const [rules, setRules] = useState<ResponsibilityRule[]>([]);
  const [problemTags, setProblemTags] = useState<any[]>([]);
  const [visitResults, setVisitResults] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    isActive: true,
    priority: 1,
    problemTags: [],
    autoAssign: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, configRes, regionsRes, opsRes] = await Promise.all([
        apiEndpoints.responsibilityRules.list(),
        apiEndpoints.config.getAll(),
        apiEndpoints.users.regions(),
        apiEndpoints.users.operators(),
      ]);
      setRules(rulesRes as ResponsibilityRule[]);
      setProblemTags(configRes.problemTags || []);
      setVisitResults(configRes.visitResults || []);
      setRegions(regionsRes as string[]);
      setOperators(opsRes as any[]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rule?: ResponsibilityRule) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({
        name: rule.name,
        description: rule.description,
        responsibility: rule.responsibility,
        assigneeId: rule.assigneeId || '',
        problemTags: rule.problemTags || [],
        visitResult: rule.visitResult || '',
        region: rule.region || '',
        priority: rule.priority,
        autoAssign: rule.autoAssign ?? true,
        handlingTimeHours: rule.handlingTimeHours || 24,
        isActive: rule.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        responsibility: '',
        assigneeId: '',
        problemTags: [],
        visitResult: '',
        region: '',
        priority: rules.length + 1,
        autoAssign: true,
        handlingTimeHours: 24,
        isActive: true,
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await apiEndpoints.responsibilityRules.update(editingId, formData);
      } else {
        await apiEndpoints.responsibilityRules.create(formData);
      }
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该规则吗？')) return;
    try {
      await apiEndpoints.responsibilityRules.delete(id);
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const toggleTag = (tag: string) => {
    const current = formData.problemTags || [];
    const next = current.includes(tag)
      ? current.filter((t: string) => t !== tag)
      : [...current, tag];
    setFormData({ ...formData, problemTags: next });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">责任归属规则</h1>
          <p className="text-sm text-gray-500 mt-1">
            基于问题标签、回访结果、区域等维度自动判定责任归属和处理人
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => startEdit()}>
            <Plus className="mr-2 h-4 w-4" />
            新增规则
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary-300 bg-primary-50/30">
          <CardHeader>
            <CardTitle>{editingId ? '编辑规则' : '新增规则'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="规则名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：生鲜类商品破损规则"
              />
              <Input
                type="number"
                label="优先级（数字越大越优先）"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                min={1}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                匹配条件（满足任一条件即触发）
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4 bg-white rounded-lg border border-gray-200">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">问题标签</label>
                  <div className="flex flex-wrap gap-2">
                    {problemTags.filter((t) => t.isActive).map((tag) => {
                      const isSelected = formData.problemTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                            isSelected
                              ? 'border-transparent text-white'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                          )}
                          style={isSelected ? { backgroundColor: tag.color } : {}}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Select
                  label={<span className="text-xs text-gray-500">回访结果</span>}
                  value={formData.visitResult}
                  onChange={(e) => setFormData({ ...formData, visitResult: e.target.value })}
                  options={[
                    { value: '', label: '不限' },
                    ...visitResults.filter((v) => v.isActive).map((v) => ({
                      value: v.code,
                      label: v.name,
                    })),
                  ]}
                />
                <Select
                  label={<span className="text-xs text-gray-500">区域</span>}
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  options={[
                    { value: '', label: '不限' },
                    ...regions.map((r) => ({ value: r, label: r })),
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select
                label="责任归属"
                value={formData.responsibility}
                onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                options={Object.values(ResponsibilityParty).map((r) => ({
                  value: r,
                  label: responsibilityConfig[r].label,
                }))}
              />
              <Select
                label="指派处理人"
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                options={[
                  { value: '', label: '不自动指派' },
                  ...operators.map((o) => ({
                    value: o.id,
                    label: `${o.name} (${o.region || '-'})`,
                  })),
                ]}
              />
              <Input
                type="number"
                label="标准处理时限（小时）"
                value={formData.handlingTimeHours}
                onChange={(e) => setFormData({ ...formData, handlingTimeHours: Number(e.target.value) })}
                min={1}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoAssign}
                  onChange={(e) => setFormData({ ...formData, autoAssign: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">自动指派</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">启用规则</span>
              </label>
            </div>

            <Input
              label="规则描述（可选）"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                <X className="mr-1 h-4 w-4" />
                取消
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <Save className="mr-1 h-4 w-4" />
                保存规则
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无责任规则</p>
              <Button className="mt-4" onClick={() => startEdit()}>
                创建第一条规则
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules
            .sort((a, b) => b.priority - a.priority)
            .map((rule, index) => {
              const resp = rule.responsibility ? responsibilityConfig[rule.responsibility] : null;
              return (
                <Card
                  key={rule.id}
                  className={cn(
                    'transition-all hover:shadow-md',
                    !rule.isActive && 'opacity-60 bg-gray-50',
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <GripVertical className="h-5 w-5 text-gray-300" />
                          <Badge variant="secondary" size="sm">
                            #{rules.length - index}
                          </Badge>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                            <Badge variant="outline" size="sm">
                              优先级 {rule.priority}
                            </Badge>
                            {!rule.isActive && (
                              <Badge variant="secondary" size="sm">已停用</Badge>
                            )}
                            {rule.autoAssign && (
                              <Badge variant="primary" size="sm">自动指派</Badge>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-sm text-gray-500 mb-2">{rule.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-gray-500">匹配：</span>
                            {rule.problemTags && rule.problemTags.length > 0 && (
                              <span className="text-gray-600">
                                标签：{rule.problemTags.join('、')}
                              </span>
                            )}
                            {rule.visitResult && (
                              <>
                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                <span className="text-gray-600">
                                  回访：{visitResults.find((v) => v.code === rule.visitResult)?.name || rule.visitResult}
                                </span>
                              </>
                            )}
                            {rule.region && (
                              <>
                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                <span className="text-gray-600">区域：{rule.region}</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {resp && (
                              <div className="flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-gray-400" />
                                <span>责任：</span>
                                <span className={cn('font-medium', resp.color)}>
                                  {resp.label}
                                </span>
                              </div>
                            )}
                            {rule.assigneeId && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500">→</span>
                                <span>处理人：</span>
                                <span className="font-medium text-gray-700">
                                  {operators.find((o) => o.id === rule.assigneeId)?.name || rule.assigneeId}
                                </span>
                              </div>
                            )}
                            {rule.handlingTimeHours && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                <span>{rule.handlingTimeHours} 小时</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(rule)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
