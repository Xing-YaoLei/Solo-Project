import { useState, useEffect, useMemo } from 'react';
import type { SettlementQuestion, SettlementItem } from '@/types/game';
import {
  ArrowUp, ArrowDown, ArrowUpDown, GripVertical, Send, CheckCircle2,
  DollarSign, Clock, TrendingUp, AlertTriangle, Lightbulb, Package
} from 'lucide-react';
import { clsx } from 'clsx';

interface SettlementSorterProps {
  question: SettlementQuestion;
  onSubmit: (orderedIds: string[]) => void;
  disabled?: boolean;
  preOrdered?: string[];
}

const typeInfo: Record<SettlementItem['type'], { label: string; color: string; icon: string; accent: string }> = {
  base:     { label: '基础配送费', color: 'bg-blue-500/15 text-blue-300 border-blue-400/30',   icon: '📦', accent: 'border-blue-400/50' },
  subsidy:  { label: '补贴收入',   color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', icon: '✅', accent: 'border-emerald-400/50' },
  bonus:    { label: '奖励收入',   color: 'bg-amber-500/15 text-amber-300 border-amber-400/30', icon: '🎁', accent: 'border-amber-400/50' },
  penalty:  { label: '罚款扣款',   color: 'bg-rose-500/15 text-rose-300 border-rose-400/30',   icon: '⚠️', accent: 'border-rose-400/50' },
  refund:   { label: '退回款项',   color: 'bg-purple-500/15 text-purple-300 border-purple-400/30', icon: '↩️', accent: 'border-purple-400/50' },
};

export const SettlementSorter = ({ question, onSubmit, disabled, preOrdered }: SettlementSorterProps) => {
  const [orderedItems, setOrderedItems] = useState<SettlementItem[]>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (preOrdered && preOrdered.length > 0) {
      const mapped = preOrdered
        .map(id => question.items.find(i => i.id === id))
        .filter(Boolean) as SettlementItem[];
      setOrderedItems(mapped);
    } else {
      setOrderedItems([...question.items]);
    }
    setShowAnswer(false);
  }, [question.id, preOrdered, question.items]);

  const currentOrder = orderedItems.map(i => i.id);

  const moveItem = (from: number, to: number) => {
    if (disabled) return;
    if (from === to || from < 0 || to < 0 || from >= orderedItems.length || to >= orderedItems.length) return;
    const next = [...orderedItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrderedItems(next);
  };

  const onDragStart = (idx: number) => (e: React.DragEvent) => {
    if (disabled) return;
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const onDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };
  const onDrop = (to: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain') || String(draggingIdx ?? to), 10);
    moveItem(from, to);
    setDraggingIdx(null);
    setDragOverIdx(null);
  };
  const onDragEnd = () => { setDraggingIdx(null); setDragOverIdx(null); };

  const sortByInfo = useMemo(() => {
    if (question.sortBy === 'time')   return { label: '发生时间',     desc: '从早到晚的时间顺序', Icon: Clock,       dir: question.ascending ? '⬆️ 旧 → 新' : '⬇️ 新 → 旧' };
    if (question.sortBy === 'amount') return { label: '金额大小',     desc: '按金额绝对值排序',   Icon: DollarSign,  dir: question.ascending ? '⬆️ 小 → 大' : '⬇️ 大 → 小' };
    return { label: '业务逻辑顺序', desc: '基础费用→补贴→奖励→扣款→退款', Icon: TrendingUp, dir: '📋 业务流程' };
  }, [question.sortBy, question.ascending]);

  const totalAmount = orderedItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-slate-800/80 p-5 shadow-xl lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <sortByInfo.Icon className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
              排序要求 · {sortByInfo.label}
            </h3>
            <span className="ml-auto rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
              {sortByInfo.dir}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-200">{question.description}</p>
          <p className="mt-2 text-xs text-slate-400">
            <span className="text-emerald-400">提示：</span>{sortByInfo.desc}。可通过拖拽左侧手柄或上下箭头调整顺序。
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-400/20 bg-slate-800/60 p-4 shadow-lg">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">操作说明</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><GripVertical className="h-3.5 w-3.5 text-slate-500" /> 拖拽左侧手柄可调整位置</li>
              <li className="flex items-center gap-2"><ArrowUp className="h-3.5 w-3.5 text-slate-500" /> 上箭头将项目上移一位</li>
              <li className="flex items-center gap-2"><ArrowDown className="h-3.5 w-3.5 text-slate-500" /> 下箭头将项目下移一位</li>
              <li className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-slate-500" /> 相同类型条目按内部排序</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-indigo-500/10 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">明细合计</p>
            <p className="text-3xl font-bold text-white">
              <span className={totalAmount >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {totalAmount >= 0 ? '+' : ''}¥{totalAmount.toFixed(2)}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(typeInfo).map(([k, v]) => {
                const n = orderedItems.filter(i => i.type === k).length;
                if (n === 0) return null;
                return (
                  <span key={k} className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${v.color}`}>
                    {v.icon} {v.label} ×{n}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto pr-1 rounded-2xl border border-white/5 bg-slate-800/30 p-3">
        {orderedItems.map((item, idx) => {
          const info = typeInfo[item.type];
          const isCorrectPos = showAnswer && item.correctOrder === idx + 1;
          const isWrongPos = showAnswer && item.correctOrder !== idx + 1;
          return (
            <div
              key={item.id}
              draggable={!disabled}
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver(idx)}
              onDrop={onDrop(idx)}
              onDragEnd={onDragEnd}
              className={clsx(
                'group relative flex items-stretch gap-3 rounded-xl border p-3 transition-all',
                draggingIdx === idx && 'opacity-40 scale-95',
                dragOverIdx === idx && draggingIdx !== idx && 'ring-2 ring-cyan-400/60 -translate-y-0.5',
                isCorrectPos ? 'border-emerald-400/50 bg-emerald-500/10' :
                isWrongPos ? 'border-rose-400/40 bg-rose-500/10' :
                'border-white/5 bg-slate-800/60 hover:bg-slate-800/80 hover:border-white/15',
                disabled && 'opacity-70'
              )}
            >
              <div className="flex flex-col items-center justify-center gap-1 border-r border-white/5 pr-3">
                <div className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black',
                  idx < 3 ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-300' : 'bg-slate-700/50 text-slate-400'
                )}>
                  {idx + 1}
                </div>
                <button
                  draggable={!disabled}
                  onDragStart={onDragStart(idx)}
                  title="拖拽调整"
                  className={clsx(
                    'cursor-grab active:cursor-grabbing rounded p-0.5 transition',
                    disabled ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${info.color}`}>
                    <span>{info.icon}</span>{info.label}
                  </span>
                  {item.orderNo && (
                    <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      #{item.orderNo.slice(-8)}
                    </span>
                  )}
                  {showAnswer && (
                    isCorrectPos
                      ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> 位置正确</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">✗ 正确位置应为 第{item.correctOrder} 位</span>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{item.description}</p>
                <div className="mt-auto flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="h-3 w-3" />{item.time}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-2 pl-3 border-l border-white/5">
                <div className={clsx(
                  'rounded-lg px-3 py-2 text-right font-bold',
                  item.amount >= 0
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-rose-500/10 text-rose-300'
                )}>
                  <span className="text-[10px] font-normal text-slate-400 block">金额</span>
                  {item.amount >= 0 ? '+' : ''}¥{item.amount.toFixed(2)}
                </div>
                {!disabled && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(idx, idx - 1)}
                      disabled={idx === 0}
                      className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-md border transition',
                        idx === 0
                          ? 'cursor-not-allowed border-white/5 text-slate-600'
                          : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, idx + 1)}
                      disabled={idx === orderedItems.length - 1}
                      className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-md border transition',
                        idx === orderedItems.length - 1
                          ? 'cursor-not-allowed border-white/5 text-slate-600'
                          : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-800/60 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnswer(s => !s)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-300"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {showAnswer ? '隐藏正确位置' : '显示正确位置对比'}
          </button>
          <button
            onClick={() => setOrderedItems([...question.items].sort(() => Math.random() - 0.5))}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-300 disabled:opacity-40"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            随机打乱
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            共 <span className="font-bold text-white">{orderedItems.length}</span> 条明细
          </span>
          <button
            onClick={() => onSubmit(currentOrder)}
            disabled={disabled}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all',
              disabled
                ? 'cursor-not-allowed bg-slate-700/60 text-slate-500'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0'
            )}
          >
            <Send className="h-4 w-4" />
            提交排序
          </button>
        </div>
      </div>
    </div>
  );
};
