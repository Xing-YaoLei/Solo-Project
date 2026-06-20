'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  UserCircle,
  X,
  Check,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/api/departments';
import { toast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { Department, DepartmentType } from '@scenic/shared';
import { usePermission } from '@/hooks/usePermission';

interface TreeNode extends Department {
  children?: TreeNode[];
}

const TypeIconMap: Record<DepartmentType, typeof Building2> = {
  DEPARTMENT: Building2,
  POSITION: Users,
  STAFF: UserCircle,
};

const TypeLabelMap: Record<DepartmentType, string> = {
  DEPARTMENT: '部门',
  POSITION: '岗位',
  STAFF: '人员',
};

function TreeItem({
  node,
  level,
  onEdit,
  onDelete,
  onAddChild,
}: {
  node: TreeNode;
  level: number;
  onEdit: (node: Department) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const Icon = TypeIconMap[node.type];
  const { canManageSettings } = usePermission();

  return (
    <div>
      <div
        className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded hover:bg-slate-200 text-slate-500"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-slate-700 flex-1">
          {node.name}
        </span>
        <span className="text-xs text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">
          {TypeLabelMap[node.type]}
        </span>
        {canManageSettings && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={() => onAddChild(node.id)}
              className="p-1.5 rounded hover:bg-primary/10 text-primary"
              title="添加下级"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500"
              title="编辑"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="p-1.5 rounded hover:bg-danger/10 text-danger"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FormData {
  name: string;
  code: string;
  type: DepartmentType;
  sortOrder: number;
  parentId?: string;
}

export default function DepartmentTree() {
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });
  const queryClient = useQueryClient();
  const { canManageSettings } = usePermission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    type: 'DEPARTMENT',
    sortOrder: 0,
  });

  const buildTree = (items: Department[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    items.forEach((item) => map.set(item.id, { ...item }));
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        const parent = map.get(node.parentId)!;
        parent.children = [...(parent.children || []), node];
      } else {
        roots.push(node);
      }
    });
    return roots.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const openAddDialog = (pId?: string) => {
    setEditingItem(null);
    setParentId(pId);
    setFormData({
      name: '',
      code: '',
      type: pId ? 'STAFF' : 'DEPARTMENT',
      sortOrder: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Department) => {
    setEditingItem(item);
    setParentId(item.parentId);
    setFormData({
      name: item.name,
      code: item.code,
      type: item.type,
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast('创建成功', { type: 'success' });
      setDialogOpen(false);
    },
    onError: () => toast('创建失败', { type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Department> }) =>
      updateDepartment(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast('更新成功', { type: 'success' });
      setDialogOpen(false);
    },
    onError: () => toast('更新失败', { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
      createMutation.mutate({
        ...formData,
        parentId,
      });
    }
  };

  const tree = buildTree(departments);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700">责任归属树</h3>
        {canManageSettings && (
          <button
            onClick={() => openAddDialog()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-2">
        {isLoading ? (
          <div className="py-8 text-center text-slate-500">加载中...</div>
        ) : tree.length === 0 ? (
          <div className="py-8 text-center text-slate-500">暂无数据</div>
        ) : (
          tree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              level={0}
              onEdit={openEditDialog}
              onDelete={(id) => setDeleteConfirm(id)}
              onAddChild={openAddDialog}
            />
          ))
        )}
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-50">
            <Dialog.Title className="text-lg font-semibold text-slate-900 mb-4">
              {editingItem ? '编辑' : '新增'}责任归属
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  编码
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入编码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as DepartmentType,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="DEPARTMENT">部门</option>
                  <option value="POSITION">岗位</option>
                  <option value="STAFF">人员</option>
                </select>
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
        description="删除后将无法恢复，且会影响其子级数据，是否继续？"
        confirmText="删除"
        variant="danger"
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
      />
    </div>
  );
}
