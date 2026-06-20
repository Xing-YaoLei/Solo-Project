'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { type Column } from '@/components/common/DataTable';
import { ShieldCheck, Lock, Unlock, Save } from 'lucide-react';
import {
  getSensitiveFieldConfigs,
  updateSensitiveFieldConfig,
} from '@/lib/api/permissions';
import { toast } from '@/components/common/Toast';
import type { SensitiveFieldConfig, UserRole } from '@scenic/shared';
import { ROLE_LABELS } from '@scenic/shared';
import * as Checkbox from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';

export default function SensitiveFieldConfig() {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['sensitive-fields'],
    queryFn: getSensitiveFieldConfigs,
  });
  const queryClient = useQueryClient();
  const { canManageSettings } = usePermission();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedRoles, setEditedRoles] = useState<UserRole[]>([]);

  const allRoles: UserRole[] = ['VISITOR', 'TICKET_STAFF', 'PATROL_STAFF', 'OPERATOR', 'SUPERVISOR'];

  const handleStartEdit = (config: SensitiveFieldConfig) => {
    setEditingField(config.field);
    setEditedRoles([...config.roles]);
  };

  const handleSave = async (field: string) => {
    try {
      await updateSensitiveFieldConfig(field, { roles: editedRoles });
      queryClient.invalidateQueries({ queryKey: ['sensitive-fields'] });
      toast('保存成功', { type: 'success' });
      setEditingField(null);
    } catch (e) {
      toast('保存失败', { type: 'error' });
    }
  };

  const toggleRole = (role: UserRole) => {
    setEditedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const columns: Column<SensitiveFieldConfig>[] = [
    {
      key: 'field',
      title: '字段标识',
      dataIndex: 'field',
      render: (record) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            'p-1 rounded',
            record.roles.length > 0 ? 'text-warning bg-warning/10' : 'text-slate-400 bg-slate-100'
          )}>
            {record.roles.length > 0 ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </span>
          <code className="text-sm font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-700">
            {record.field}
          </code>
        </div>
      ),
    },
    {
      key: 'label',
      title: '字段名称',
      dataIndex: 'label',
      render: (record) => (
        <span className="text-sm font-medium text-slate-700">{record.label}</span>
      ),
    },
    {
      key: 'maskPattern',
      title: '掩码规则',
      dataIndex: 'maskPattern',
      render: (record) => (
        <span className="text-xs text-slate-500 font-mono">
          {record.maskPattern || '-'}
        </span>
      ),
    },
    {
      key: 'roles',
      title: '可查看角色',
      render: (record) => {
        const isEditing = editingField === record.field;
        const currentRoles = isEditing ? editedRoles : record.roles;

        if (!canManageSettings || !isEditing) {
          if (currentRoles.length === 0) {
            return <span className="text-sm text-slate-400">全部可见</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {currentRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-primary/10 text-primary"
                >
                  {ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-3">
              {allRoles.map((role) => {
                const checked = currentRoles.includes(role);
                return (
                  <label
                    key={role}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer"
                  >
                    <Checkbox.Root
                      checked={checked}
                      onCheckedChange={() => toggleRole(role)}
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        checked
                          ? 'bg-primary border-primary text-white'
                          : 'border-slate-300 hover:border-primary'
                      )}
                    >
                      <Checkbox.Indicator>
                        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    {ROLE_LABELS[role]}
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(record.field)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90"
              >
                <Save className="w-3 h-3" />
                保存
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        );
      },
    },
    {
      key: 'action',
      title: '操作',
      align: 'center',
      render: (record) => {
        if (!canManageSettings || editingField === record.field) return null;
        return (
          <button
            onClick={() => handleStartEdit(record)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/5"
          >
            <ShieldCheck className="w-3 h-3" />
            配置权限
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 p-3 rounded-lg bg-info/5 border border-info/20">
        <p className="text-xs text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-info" />
          勾选的角色可以查看该敏感字段的完整信息，未勾选的角色将看到掩码后的数据。
        </p>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={configs}
          rowKey="field"
          loading={isLoading}
          emptyText="暂无敏感字段配置"
        />
      </div>
    </div>
  );
}
