// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Clock, Target, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { apiEndpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import { VisitResult, ProblemTag } from '@solo/shared';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'visit' | 'tags'>('visit');
  const [visitResults, setVisitResults] = useState<VisitResult[]>([]);
  const [problemTags, setProblemTags] = useState<ProblemTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ type: string; id?: string } | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiEndpoints.config.getAll();
      setVisitResults(res.visitResults || []);
      setProblemTags(res.problemTags || []);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editing?.type === 'visit') {
        if (editing.id) {
          await apiEndpoints.visitResults.update(editing.id, formData);
        } else {
          await apiEndpoints.visitResults.create(formData);
        }
      } else if (editing?.type === 'tag') {
        if (editing.id) {
          await apiEndpoints.problemTags.update(editing.id, formData);
        } else {
          await apiEndpoints.problemTags.create(formData);
        }
      }
      setEditing(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      if (type === 'visit') {
        await apiEndpoints.visitResults.delete(id);
      } else if (type === 'tag') {
        await apiEndpoints.problemTags.delete(id);
      }
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const startEdit = (type: string, item?: any) => {
    setEditing({ type, id: item?.id });
    setFormData(item ? { ...item } : { isActive: true });
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormData({});
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
          <h1 className="text-2xl font-bold text-gray-900">规则配置</h1>
          <p className="text-sm text-gray-500 mt-1">管理售后业务的基础字典和规则参数</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('visit')}
          className={cn(
            'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'visit'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          )}
        >
          <Target className="h-4 w-4" />
          回访结果字典
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={cn(
            'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'tags'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          )}
        >
          <Tag className="h-4 w-4" />
          问题标签阈值
        </button>
      </div>

      {activeTab === 'visit' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              回访结果字典
            </CardTitle>
            {!editing && (
              <Button variant="primary" size="sm" onClick={() => startEdit('visit')}>
                <Plus className="mr-1 h-4 w-4" />
                新增
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing?.type === 'visit' && (
              <div className="mb-6 p-4 rounded-lg border border-primary-200 bg-primary-50/50">
                <h4 className="font-medium text-gray-900 mb-4">
                  {editing.id ? '编辑' : '新增'}回访结果
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input
                    label="结果编码"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="如：FULL_REFUND"
                  />
                  <Input
                    label="显示名称"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：全额退款"
                  />
                  <Input
                    type="number"
                    label="优先级"
                    value={formData.sortOrder || 0}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? true}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">启用</span>
                  </label>
                </div>
                {formData.description !== undefined && (
                  <Input
                    label="描述（可选）"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-4"
                  />
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="mr-1 h-4 w-4" />
                    取消
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    <Save className="mr-1 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {visitResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无回访结果</p>
                </div>
              ) : (
                visitResults
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border transition-colors',
                        item.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">
                            {item.name?.charAt(0) || item.code?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <Badge variant="secondary" size="sm">
                              {item.code}
                            </Badge>
                            {!item.isActive && (
                              <Badge variant="outline" size="sm">已停用</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 mr-2">优先级: {item.sortOrder}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit('visit', item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete('visit', item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'tags' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              问题标签与处理阈值
            </CardTitle>
            {!editing && (
              <Button variant="primary" size="sm" onClick={() => startEdit('tag')}>
                <Plus className="mr-1 h-4 w-4" />
                新增
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing?.type === 'tag' && (
              <div className="mb-6 p-4 rounded-lg border border-primary-200 bg-primary-50/50">
                <h4 className="font-medium text-gray-900 mb-4">
                  {editing.id ? '编辑' : '新增'}问题标签
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input
                    label="标签名称"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：商品破损"
                  />
                  <Input
                    type="number"
                    label="处理时限（天）"
                    value={formData.thresholdDays || 3}
                    onChange={(e) => setFormData({ ...formData, thresholdDays: Number(e.target.value) })}
                    min={1}
                  />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">标签颜色</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={cn(
                            'w-8 h-8 rounded-full transition-transform',
                            formData.color === color && 'ring-2 ring-offset-2 ring-gray-400 scale-110',
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? true}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">启用</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="mr-1 h-4 w-4" />
                    取消
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    <Save className="mr-1 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {problemTags.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无问题标签</p>
                </div>
              ) : (
                problemTags
                  .filter((t) => t.isActive)
                  .map((tag) => (
                    <div
                      key={tag.id}
                      className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: tag.color + '20' }}
                          >
                            <Tag className="h-4 w-4" style={{ color: tag.color }} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{tag.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Clock className="h-3 w-3" />
                              处理时限 {tag.thresholdDays} 天
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit('tag', tag)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete('tag', tag.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="h-1 rounded-full"
                        style={{ backgroundColor: tag.color, opacity: 0.5 }}
                      />
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
