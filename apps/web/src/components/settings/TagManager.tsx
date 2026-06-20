'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { getTags, createTag, updateTag, deleteTag } from '@/lib/api/tags';
import { toast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Tag as TagType } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  code: string;
  color: string;
  sortOrder: number;
  parentId?: string;
}

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16', '#1e3a5f', '#d4a853',
];

export default function TagManager() {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });
  const queryClient = useQueryClient();
  const { canManageSettings } = usePermission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TagType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    color: '#1e3a5f',
    sortOrder: 0,
  });

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      color: '#1e3a5f',
      sortOrder: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: TagType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      color: item.color,
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast('创建成功', { type: 'success' });
      setDialogOpen(false);
    },
    onError: () => toast('创建失败', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<TagType> }) =>
      updateTag(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast('更新成功', { type: 'success' });
      setDialogOpen(false);
    },
    onError: () => toast('更新失败', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast('删除成功', { type: 'success' });
      setDeleteConfirm(null);
    },
    onError: () => toast('删除失败', { type: 'error' }),
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast('请填写完整信息', { type: 'warning' });
      return;
    }
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        payload: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const sortedTags = [...tags].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700">问题标签</h3>
        {canManageSettings && (
          <button
            onClick={openAddDialog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            新增标签
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-slate-500">加载中...</div>
        ) : sortedTags.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            暂无标签
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTags.map((tag) => (
              <div
                key={tag.id}
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-md"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{tag.name}</span>
                <span className="text-xs opacity-70">({tag.code})</span>
                {canManageSettings && (
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                    <button
                      onClick={() => openEditDialog(tag)}
                      className="p-1 rounded hover:bg-white/50"
                      title="编辑"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(tag.id)}
                      className="p-1 rounded hover:bg-white/50"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-50">
            <Dialog.Title className="text-lg font-semibold text-slate-900 mb-4">
              {editingItem ? '编辑' : '新增'}标签
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  标签名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入标签名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  标签编码
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入标签编码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  标签颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        'w-8 h-8 rounded-md border-2 transition-all',
                        formData.color === color
                          ? 'border-slate-800 scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-8 h-8 rounded-md cursor-pointer opacity-0 absolute inset-0"
                    />
                    <div
                      className="w-8 h-8 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400"
                      style={{ backgroundColor: formData.color }}
                    >
                      +
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  排序
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                <Check className="w-4 h-4" />
                保存
              </button>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="确认删除"
        description="删除标签后，已关联该标签的工单数据不受影响，是否继续？"
        confirmText="删除"
        variant="danger"
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
      />
    </div>
  );
}
