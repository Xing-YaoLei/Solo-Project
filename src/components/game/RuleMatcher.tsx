import { useState, useEffect } from 'react';
import type { RuleQuestion, SubsidyRule, OrderScene } from '@/types/game';
import { MapPin, Clock, Truck, Map, Tag, Send } from 'lucide-react';
import { clsx } from 'clsx';

interface RuleMatcherProps {
  question: RuleQuestion;
  onSubmit: (selectedIds: string[]) => void;
  disabled?: boolean;
  preSelected?: string[];
}

const weatherMap: Record<string, { label: string; icon: string; color: string }> = {
  rain: { label: '雨天', icon: '🌧️', color: 'bg-blue-500/20 text-blue-300' },
  snow: { label: '雪天', icon: '❄️', color: 'bg-slate-200/20 text-slate-200' },
  heat: { label: '高温', icon: '🔥', color: 'bg-orange-500/20 text-orange-300' },
  sunny: { label: '晴朗', icon: '☀️', color: 'bg-amber-500/20 text-amber-300' },
  cloud: { label: '多云', icon: '⛅', color: 'bg-slate-400/20 text-slate-300' },
};

const orderTypeMap: Record<string, { label: string; icon: string }> = {
  food: { label: '餐饮外卖', icon: '🍱' },
  digital: { label: '数码产品', icon: '📱' },
  jewelry: { label: '珠宝首饰', icon: '💎' },
  fresh: { label: '生鲜食品', icon: '🥩' },
  bulky: { label: '大件货物', icon: '📦' },
  document: { label: '文件票据', icon: '📄' },
  medicine: { label: '医药用品', icon: '💊' },
  flower: { label: '鲜花礼品', icon: '💐' },
};

const areaMap: Record<string, { label: string; icon: string }> = {
  urban: { label: '市区', icon: '🏙️' },
  downtown: { label: '商圈', icon: '🏬' },
  suburb: { label: '郊区', icon: '🏘️' },
  industrial: { label: '工业园', icon: '🏭' },
  campus: { label: '校园', icon: '🎓' },
  hospital: { label: '医院', icon: '🏥' },
};

export const RuleMatcher = ({ question, onSubmit, disabled, preSelected }: RuleMatcherProps) => {
  const { orderScene, availableRules } = question;
  const [selected, setSelected] = useState<Set<string>>(new Set(preSelected || []));
  const [hoveredRule, setHoveredRule] = useState<string | null>(null);

  useEffect(() => {
    setSelected(new Set(preSelected || []));
  }, [preSelected, question.id]);

  const toggleRule = (id: string) => {
    if (disabled) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderConditionBadges = (scene: OrderScene) => {
    const w = weatherMap[scene.weather] || { label: scene.weather, icon: '🌡️', color: 'bg-slate-500/20' };
    const ot = orderTypeMap[scene.orderType] || { label: scene.orderType, icon: '📦' };
    const ar = areaMap[scene.area] || { label: scene.area, icon: '📍' };
    return (
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/30">
          <Clock className="h-3 w-3" /> {scene.time}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-medium text-cyan-300 ring-1 ring-cyan-400/30">
          <MapPin className="h-3 w-3" /> {scene.distance}km
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${w.color} ring-white/10`}>
          {w.icon} {w.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
          {ot.icon} {ot.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-2.5 py-1 text-xs font-medium text-fuchsia-300 ring-1 ring-fuchsia-400/30">
          {ar.icon} {ar.label}
        </span>
      </div>
    );
  };

  const renderRuleCondition = (rule: SubsidyRule) => {
    const parts: string[] = [];
    if (rule.conditions.timeSlot) parts.push(`时段 ${rule.conditions.timeSlot[0]}~${rule.conditions.timeSlot[1]}`);
    if (rule.conditions.distance) parts.push(`里程 ≥${rule.conditions.distance[0]}km`);
    if (rule.conditions.weather) parts.push(`天气: ${rule.conditions.weather.map(w => weatherMap[w]?.label || w).join('/')}`);
    if (rule.conditions.orderType) parts.push(`品类: ${rule.conditions.orderType.map(t => orderTypeMap[t]?.label || t).join('/')}`);
    if (rule.conditions.area) parts.push(`区域: ${rule.conditions.area.map(a => areaMap[a]?.label || a).join('/')}`);
    return parts.length > 0 ? parts.join(' · ') : '通用规则';
  };

  const renderAmount = (rule: SubsidyRule) => {
    switch (rule.type) {
      case 'fixed': return `¥${rule.amount} / 单`;
      case 'per_km': return `¥${rule.amount} / 公里`;
      case 'multiplier': return `${(rule.amount * 100).toFixed(0)}% 订单金额`;
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-800/80 p-5 shadow-xl ring-1 ring-white/5">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-300">订单场景信息</h3>
          <span className="ml-auto rounded-full bg-slate-700/60 px-3 py-1 font-mono text-xs text-slate-300">
            {orderScene.orderNo}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">取货地址</p>
                <p className="text-sm text-slate-200">{orderScene.startAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Map className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">收货地址</p>
                <p className="text-sm text-slate-200">{orderScene.endAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">场景说明</p>
                <p className="text-sm text-slate-200">{orderScene.description}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">订单标签</p>
            {renderConditionBadges(orderScene)}
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">已选规则</span>
                <span className={`font-bold ${selected.size > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {selected.size} 项
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">请选择适用的补贴规则（可多选）</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
        {availableRules.map(rule => {
          const isSelected = selected.has(rule.id);
          const isHovered = hoveredRule === rule.id;
          return (
            <button
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              onMouseEnter={() => setHoveredRule(rule.id)}
              onMouseLeave={() => setHoveredRule(null)}
              disabled={disabled}
              className={clsx(
                'group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200',
                isSelected
                  ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-slate-800/80 shadow-xl shadow-emerald-500/10 scale-[1.02]'
                  : isHovered
                    ? 'border-white/20 bg-slate-800/70 shadow-lg -translate-y-0.5'
                    : 'border-white/5 bg-slate-800/40 hover:bg-slate-800/60',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
              style={isSelected ? { boxShadow: `inset 0 0 0 1px ${rule.color}40` } : {}}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-lg">
                  ✓
                </div>
              )}
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl shadow-inner"
                style={{ backgroundColor: `${rule.color}20`, border: `1px solid ${rule.color}30` }}
              >
                {rule.icon}
              </div>
              <div className="flex flex-col gap-1 pr-8">
                <p className="text-base font-bold text-white">{rule.name}</p>
                <p className="text-xs text-slate-400">{rule.description}</p>
              </div>
              <div className="mt-1 w-full rounded-lg bg-black/20 p-2">
                <p className="text-[11px] text-slate-500 mb-0.5">触发条件</p>
                <p className="text-xs text-slate-300 leading-relaxed">{renderRuleCondition(rule)}</p>
              </div>
              <div className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-gradient-to-r from-transparent to-white/5 px-2.5 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">补贴标准</span>
                <span className="font-mono text-sm font-bold text-amber-300">{renderAmount(rule)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-800/60 px-5 py-3 backdrop-blur">
        <div>
          <p className="text-xs text-slate-400">
            选择了 <span className="font-bold text-white">{selected.size}</span> 项规则
          </p>
        </div>
        <button
          onClick={() => onSubmit(Array.from(selected))}
          disabled={disabled || selected.size === 0}
          className={clsx(
            'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all',
            disabled || selected.size === 0
              ? 'cursor-not-allowed bg-slate-700/60 text-slate-500'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0'
          )}
        >
          <Send className="h-4 w-4" />
          提交判定
        </button>
      </div>
    </div>
  );
};
