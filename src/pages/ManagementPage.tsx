import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QUERY_KEYS, queryClient } from '@/main';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import * as Dialog from '@radix-ui/react-dialog';
import { DOCUMENT_TYPES, RISK_COLORS, RISK_LABELS, STAGE_META } from '@/utils/constants';
import {
  mockWarningThresholds,
  mockRules,
} from '@/data/mockData';
import {
  fetchWarningThresholds,
  fetchRules,
  updateWarningThreshold,
  toggleWarningThreshold,
  createRule,
  updateRule,
  deleteRule,
} from '@/services/endpoints';
import { cn } from '@/lib/utils';
import { formatDays } from '@/utils/format';
import {
  Settings2,
  Code2,
  Bell,
  Save,
  Plus,
  Pencil,
  Trash2,
  Mail,
  MessageCircle,
  Users,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { WarningThreshold, RuleConfig, RiskLevel, TurnoverStage } from '@shared/types';

const INVALIDATE_KEYS = [
  QUERY_KEYS.thresholds,
  QUERY_KEYS.rules,
  QUERY_KEYS.riskMatrix,
  QUERY_KEYS.alerts,
  QUERY_KEYS.dashboardSummary,
  QUERY_KEYS.vehicles,
  QUERY_KEYS.documentMissing,
];

interface ToastData {
  message: string;
  subMessage?: string;
  variant?: 'success' | 'info';
}

export default function ManagementPage() {
  const [tab, setTab] = useState('threshold');
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (data: ToastData | string) => {
    if (typeof data === 'string') {
      setToast({ message: data });
    } else {
      setToast(data);
    }
  };

  return (
    <div className="space-y-5 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up">
          <div className={cn(
            'flex items-start gap-2 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg max-w-sm',
            toast.variant === 'info'
              ? 'bg-brand-500/15 border-brand-500/30'
              : 'bg-emerald-500/15 border-emerald-500/30'
          )}>
            <CheckCircle2 size={16} className={cn(
              'shrink-0 mt-0.5',
              toast.variant === 'info' ? 'text-brand-400' : 'text-emerald-400'
            )} />
            <div>
              <span className={cn(
                'text-sm font-medium block',
                toast.variant === 'info' ? 'text-brand-300' : 'text-emerald-300'
              )}>{toast.message}</span>
              {toast.subMessage && (
                <span className={cn(
                  'text-xs block mt-0.5',
                  toast.variant === 'info' ? 'text-brand-400/70' : 'text-emerald-400/70'
                )}>{toast.subMessage}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">预警管理配置</h1>
        <p className="text-sm text-slate-400 mt-0.5">阈值、规则引擎与通知渠道配置</p>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="inline-flex bg-surface-card border border-surface-border rounded-xl p-1 gap-1">
          <TabTrigger value="threshold" icon={Settings2}>预警阈值</TabTrigger>
          <TabTrigger value="rules" icon={Code2}>规则引擎</TabTrigger>
          <TabTrigger value="notify" icon={Bell}>通知配置</TabTrigger>
        </Tabs.List>

        <Tabs.Content value="threshold" className="mt-5">
          <ThresholdsTab onSaved={showToast} />
        </Tabs.Content>
        <Tabs.Content value="rules" className="mt-5">
          <RulesTab onSaved={(msg) => showToast(msg)} />
        </Tabs.Content>
        <Tabs.Content value="notify" className="mt-5">
          <NotifyTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function TabTrigger({ value, icon: Icon, children }: { value: string; icon: any; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        'data-[state=active]:bg-brand-500/20 data-[state=active]:text-white data-[state=active]:shadow-glow-blue data-[state=active]:border data-[state=active]:border-brand-500/20',
        'text-slate-400 hover:text-slate-200'
      )}
    >
      <Icon size={15} />
      {children}
    </Tabs.Trigger>
  );
}

function ThresholdsTab({ onSaved }: { onSaved: (data: ToastData | string) => void }) {
  const thresholdsQuery = useQuery({
    queryKey: QUERY_KEYS.thresholds,
    queryFn: async () => (await fetchWarningThresholds()).data,
    initialData: mockWarningThresholds,
    select: (data) => data ?? mockWarningThresholds,
  });

  const [localThresholds, setLocalThresholds] = useState<WarningThreshold[]>(thresholdsQuery.data ?? mockWarningThresholds);

  useEffect(() => {
    if (thresholdsQuery.data) {
      setLocalThresholds(thresholdsQuery.data);
    }
  }, [thresholdsQuery.data]);

  const stages: TurnoverStage[] = ['inbound', 'preparation', 'test_drive', 'quoting', 'deal', 'transfer'];

  const updateLocal = (id: string, patch: Partial<WarningThreshold>) => {
    setLocalThresholds((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const invalidateAll = (affectedVehicleIds?: string[]) => {
    INVALIDATE_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
    if (affectedVehicleIds && affectedVehicleIds.length > 0) {
      affectedVehicleIds.slice(0, 5).forEach((id) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review(id) });
      });
    }
  };

  const updateThresholdMutate = useMutation({
    mutationFn: (patch: Partial<WarningThreshold> & { id: string }) => updateWarningThreshold(patch),
    onSuccess: (response) => {
      const data = response.data;
      invalidateAll(data.affectedVehicleIds);
      queryClient.setQueryData(QUERY_KEYS.thresholds, localThresholds);
      onSaved({
        message: `触发重新计算，受影响 ${data.affectedCount} 台车`,
        subMessage: data.affectedVehicleIds && data.affectedVehicleIds.length > 0
          ? `涉及车辆：${data.affectedVehicleIds.slice(0, 3).join('、')}${data.affectedVehicleIds.length > 3 ? '...' : ''}`
          : undefined,
        variant: 'info',
      });
    },
  });

  const toggleThresholdMutate = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleWarningThreshold(id, enabled),
    onSuccess: () => {
      invalidateAll();
      onSaved('阈值配置已保存，相关数据已刷新');
    },
  });

  const handleSave = (t: WarningThreshold) => {
    updateThresholdMutate.mutate({
      id: t.id,
      warningDays: t.warningDays,
      criticalDays: t.criticalDays,
      stageRequired: t.stageRequired,
      enabled: t.enabled,
    });
  };

  const handleToggle = (id: string, enabled: boolean) => {
    updateLocal(id, { enabled });
    toggleThresholdMutate.mutate({ id, enabled });
  };

  if (thresholdsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface-card border border-surface-border p-5 animate-pulse">
            <div className="h-9 w-9 rounded-lg bg-white/5 mb-4" />
            <div className="h-4 w-32 bg-white/5 rounded mb-1" />
            <div className="h-3 w-24 bg-white/5 rounded mb-4" />
            <div className="space-y-3.5">
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-9 bg-white/5 rounded" />
            </div>
            <div className="h-9 w-full bg-white/5 rounded mt-4" />
          </div>
        ))}
      </div>
    );
  }

  const thresholds = localThresholds;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {thresholds.map((t) => {
        const meta = DOCUMENT_TYPES.find((d) => d.key === t.documentType)!;
        const Icon = meta.icon;
        const isSaving = updateThresholdMutate.isPending;
        return (
          <div key={t.id} className="rounded-2xl bg-surface-card border border-surface-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400">
                  <Icon size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">保存后刷新影响数</p>
                </div>
              </div>
              <Switch.Root
                checked={t.enabled}
                onCheckedChange={(v) => handleToggle(t.id, v)}
                className={cn(
                  'w-10 h-5 rounded-full relative transition-colors',
                  t.enabled ? 'bg-emerald-500/70' : 'bg-slate-700'
                )}
              >
                <Switch.Thumb
                  className={cn(
                    'block w-4 h-4 bg-white rounded-full shadow-md transition-transform',
                    t.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                  style={{ marginTop: 2 }}
                />
              </Switch.Root>
            </div>

            <div className="space-y-3.5">
              <SliderRow
                label="预警阈值 (天)"
                color="#F59E0B"
                min={0}
                max={30}
                value={[t.warningDays]}
                onValueChange={(v) => updateLocal(t.id, { warningDays: v[0] })}
                numericValue={t.warningDays}
                onNumberChange={(n) => updateLocal(t.id, { warningDays: n })}
              />
              <SliderRow
                label="严重阈值 (天)"
                color="#EF4444"
                min={0}
                max={60}
                value={[t.criticalDays]}
                onValueChange={(v) => updateLocal(t.id, { criticalDays: v[0] })}
                numericValue={t.criticalDays}
                onNumberChange={(n) => updateLocal(t.id, { criticalDays: n })}
              />
              <div>
                <div className="text-[11px] text-slate-500 mb-1">必须齐备阶段前</div>
                <div className="relative">
                  <select
                    value={t.stageRequired}
                    onChange={(e) => updateLocal(t.id, { stageRequired: e.target.value as TurnoverStage })}
                    className="w-full h-9 px-3 pr-8 rounded-lg bg-surface-elevated/60 border border-surface-border text-xs text-slate-200 focus:outline-none focus:border-brand-500/40 appearance-none"
                  >
                    {stages.map((st) => (
                      <option key={st} value={st}>{STAGE_META.find((m) => m.key === st)?.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSave(t)}
              disabled={isSaving}
              className={cn(
                'mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-colors',
                isSaving
                  ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:bg-brand-500/25'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> 保存中...
                </>
              ) : (
                <>
                  <Save size={12} /> 保存配置
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SliderRow({
  label,
  color,
  min,
  max,
  value,
  onValueChange,
  numericValue,
  onNumberChange,
}: {
  label: string;
  color: string;
  min: number;
  max: number;
  value: number[];
  onValueChange: (v: number[]) => void;
  numericValue: number;
  onNumberChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-slate-400">{label}</span>
        <input
          type="number"
          value={numericValue}
          onChange={(e) => onNumberChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
          className="w-14 h-6 rounded-md bg-surface-elevated/60 border border-surface-border text-[11px] text-center text-slate-200 tabular-nums focus:outline-none"
        />
      </div>
      <Slider.Root
        min={min}
        max={max}
        value={value}
        onValueChange={onValueChange}
        step={1}
        className="relative flex items-center select-none touch-none w-full h-5"
      >
        <Slider.Track className="bg-surface-elevated relative grow rounded-full h-1.5">
          <Slider.Range className="absolute h-full rounded-full" style={{ background: color }} />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 rounded-full shadow-md focus:outline-none"
          style={{ background: color, border: '2px solid #0F1419' }}
          aria-label={label}
        />
      </Slider.Root>
      <div className="flex justify-between mt-0.5 text-[10px] text-slate-600">
        <span>{formatDays(min)}</span>
        <span>{formatDays(max)}</span>
      </div>
    </div>
  );
}

function RulesTab({ onSaved }: { onSaved: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RuleConfig | null>(null);

  const rulesQuery = useQuery({
    queryKey: QUERY_KEYS.rules,
    queryFn: async () => {
      const r = await fetchRules({ pageSize: 100 });
      return r.data?.items ?? mockRules;
    },
    initialData: mockRules,
    select: (data) => data ?? mockRules,
  });

  const [localRules, setLocalRules] = useState<RuleConfig[]>(rulesQuery.data ?? mockRules);

  useEffect(() => {
    if (rulesQuery.data) {
      setLocalRules(rulesQuery.data);
    }
  }, [rulesQuery.data]);

  const invalidateRules = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rules });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riskMatrix });
  };

  const toggleRuleMutate = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateRule({ id, enabled }),
    onSuccess: () => {
      invalidateRules();
      onSaved('规则状态已更新');
    },
  });

  const saveRuleMutate = useMutation({
    mutationFn: (rule: RuleConfig) => {
      if (rule.id.startsWith('rule-') && rule.createdAt === rule.updatedAt) {
        return createRule({
          name: rule.name,
          description: rule.description,
          expression: rule.expression,
          level: rule.level,
          enabled: rule.enabled,
        });
      }
      return updateRule(rule);
    },
    onSuccess: () => {
      invalidateRules();
      onSaved('规则已保存');
    },
  });

  const deleteRuleMutate = useMutation({
    mutationFn: (id: string) => deleteRule(id),
    onSuccess: () => {
      invalidateRules();
      onSaved('规则已删除');
    },
  });

  const levels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

  const handleToggle = (id: string, enabled: boolean) => {
    setLocalRules((list) => list.map((r) => (r.id === id ? { ...r, enabled } : r)));
    toggleRuleMutate.mutate({ id, enabled });
  };

  const handleSave = (rule: RuleConfig) => {
    setLocalRules((list) =>
      list.find((r) => r.id === rule.id)
        ? list.map((r) => (r.id === rule.id ? rule : r))
        : [...list, rule]
    );
    saveRuleMutate.mutate(rule);
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setLocalRules((list) => list.filter((x) => x.id !== id));
    deleteRuleMutate.mutate(id);
  };

  const rules = localRules;

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
      <div className="h-14 flex items-center justify-between px-5 border-b border-surface-border">
        <div>
          <h3 className="text-sm font-semibold text-white">规则引擎列表</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">DSL 表达式驱动的动态预警规则</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors shadow-glow-blue"
        >
          <Plus size={14} /> 新建规则
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 text-left bg-surface-elevated/30">
              <th className="px-5 py-3 font-medium">规则名称</th>
              <th className="px-4 py-3 font-medium">DSL 表达式</th>
              <th className="px-4 py-3 font-medium">等级</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-5 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-surface-border hover:bg-white/[0.02]">
                <td className="px-5 py-3.5">
                  <div className="text-sm text-white font-medium">{r.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{r.description}</div>
                </td>
                <td className="px-4 py-3.5 max-w-xs">
                  <code className="text-[11px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 inline-block truncate max-w-full">
                    {r.expression}
                  </code>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                    style={{ background: `${RISK_COLORS[r.level]}20`, color: RISK_COLORS[r.level] }}
                  >
                    {RISK_LABELS[r.level]}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-400 text-[11px]">{r.updatedAt.slice(0, 10)}</td>
                <td className="px-4 py-3.5">
                  <Switch.Root
                    checked={r.enabled}
                    onCheckedChange={(v) => handleToggle(r.id, v)}
                    className={cn('w-9 h-5 rounded-full relative transition-colors', r.enabled ? 'bg-emerald-500/70' : 'bg-slate-700')}
                  >
                    <Switch.Thumb
                      className={cn('block w-4 h-4 bg-white rounded-full shadow-md transition-transform')}
                      style={{ marginTop: 2, transform: r.enabled ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </Switch.Root>
                </td>
                <td className="px-5 py-3.5 text-right space-x-1">
                  <button
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  >
                    <Pencil size={12} /> 编辑
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 size={12} /> 删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[92vw] rounded-2xl bg-surface-elevated border border-surface-border shadow-card z-50 p-6 animate-slide-up">
            <Dialog.Title className="text-lg font-display font-bold text-white mb-1">
              {editing ? '编辑规则' : '新建规则'}
            </Dialog.Title>
            <Dialog.Description className="text-xs text-slate-400 mb-4">
              配置规则名称、DSL 表达式与触发等级
            </Dialog.Description>
            <RuleForm
              initial={editing}
              levels={levels}
              onSubmit={(r) => {
                handleSave(r);
              }}
              onCancel={() => {
                setOpen(false);
                setEditing(null);
              }}
              isSubmitting={saveRuleMutate.isPending}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function RuleForm({
  initial,
  levels,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: RuleConfig | null;
  levels: RiskLevel[];
  onSubmit: (r: RuleConfig) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [expression, setExpression] = useState(initial?.expression ?? '');
  const [level, setLevel] = useState<RiskLevel>(initial?.level ?? 'medium');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          id: initial?.id ?? `rule-${Date.now()}`,
          name,
          description: `${name}描述`,
          expression,
          level,
          enabled,
          createdAt: initial?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-[11px] text-slate-400 mb-1 block">规则名称</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：行驶证滞库超期预警"
          className="w-full h-10 px-3 rounded-lg bg-surface border border-surface-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
        />
      </div>
      <div>
        <label className="text-[11px] text-slate-400 mb-1 block">DSL 表达式</label>
        <textarea
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          rows={4}
          placeholder="如: stockDays > 15 AND documents.driving_license.status != 'present'"
          className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-xs text-emerald-400 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40 font-mono resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] text-slate-400 mb-1 block">风险等级</label>
          <div className="flex gap-1.5">
            {levels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={cn(
                  'flex-1 h-9 rounded-lg text-[11px] font-medium border transition-colors',
                  level === l
                    ? 'border-white/20'
                    : 'border-surface-border bg-surface text-slate-400 hover:text-slate-200'
                )}
                style={level === l ? { background: `${RISK_COLORS[l]}22`, color: RISK_COLORS[l], borderColor: `${RISK_COLORS[l]}44` } : {}}
              >
                {RISK_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] text-slate-400 mb-1 block">启用状态</label>
          <div className="h-9 flex items-center gap-3 px-3 rounded-lg bg-surface border border-surface-border">
            <Switch.Root
              checked={enabled}
              onCheckedChange={setEnabled}
              className={cn('w-9 h-5 rounded-full relative transition-colors', enabled ? 'bg-emerald-500/70' : 'bg-slate-700')}
            >
              <Switch.Thumb
                className={cn('block w-4 h-4 bg-white rounded-full shadow-md transition-transform')}
                style={{ marginTop: 2, transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </Switch.Root>
            <span className="text-xs text-slate-300">{enabled ? '已启用' : '已禁用'}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg bg-white/5 border border-surface-border text-xs text-slate-300 hover:bg-white/10 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'h-9 px-5 rounded-lg text-xs font-medium transition-colors shadow-glow-blue inline-flex items-center gap-1.5',
            isSubmitting
              ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" /> 保存中...
            </>
          ) : (
            <>
              <Save size={13} /> 保存规则
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function NotifyTab() {
  const channels = [
    { key: 'dingtalk', label: '钉钉', icon: MessageCircle, desc: '群机器人 Webhook' },
    { key: 'wecom', label: '企业微信', icon: Users, desc: '应用消息推送' },
    { key: 'email', label: '邮件', icon: Mail, desc: 'SMTP 邮件通知' },
  ];
  const roles = [
    { key: 'store_manager', label: '门店店长', people: ['张伟(zhangw@x.com)', '李娜(lina@x.com)'] },
    { key: 'region_ops', label: '区域运营', people: ['王强(wangq@x.com)'] },
    { key: 'risk_admin', label: '风控管理员', people: ['赵敏(zhaom@x.com)', '陈超(chenc@x.com)', '刘芳(liuf@x.com)'] },
    { key: 'management', label: '总部管理层', people: ['孙总(sunz@x.com)'] },
  ];
  const [chMap, setChMap] = useState<Record<string, boolean>>({ dingtalk: true, wecom: true, email: false });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const on = chMap[ch.key];
          return (
            <div
              key={ch.key}
              className={cn(
                'rounded-2xl border p-5 transition-all',
                on ? 'bg-surface-card border-brand-500/25 shadow-glow-blue/30' : 'bg-surface-card/50 border-surface-border'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', on ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-400')}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{ch.label}通知</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ch.desc}</p>
                  </div>
                </div>
                <Switch.Root
                  checked={on}
                  onCheckedChange={(v) => setChMap((m) => ({ ...m, [ch.key]: v }))}
                  className={cn('w-10 h-5 rounded-full relative transition-colors', on ? 'bg-emerald-500/70' : 'bg-slate-700')}
                >
                  <Switch.Thumb
                    className={cn('block w-4 h-4 bg-white rounded-full shadow-md transition-transform')}
                    style={{ marginTop: 2, transform: on ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </Switch.Root>
              </div>
              <div className="text-[11px] text-slate-500">
                示例 Webhook / SMTP 配置占位
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
        <div className="h-14 flex items-center justify-between px-5 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-white">接收人映射</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">角色 → 接收人员列表</p>
          </div>
        </div>
        <div className="divide-y divide-surface-border">
          {roles.map((r) => (
            <div key={r.key} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-32 shrink-0">
                <div className="text-sm text-white font-medium">{r.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{r.key}</div>
              </div>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {r.people.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {p}
                    <button className="text-brand-400/60 hover:text-brand-300 ml-1">×</button>
                  </span>
                ))}
                <button className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-dashed border-surface-border text-slate-500 hover:border-brand-500/40 hover:text-brand-400 transition-colors">
                  <Plus size={11} /> 添加接收人
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
