import { useState, useEffect } from 'react';
import type { EvidenceQuestion, EvidenceItem } from '@/types/game';
import { Image, FileText, Radio as FileAudio, CheckCircle2, XCircle, Send, AlertTriangle, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';

interface EvidenceSelectorProps {
  question: EvidenceQuestion;
  onSubmit: (selectedIds: string[]) => void;
  disabled?: boolean;
  preSelected?: string[];
}

const categoryInfo: Record<EvidenceItem['category'], { label: string; color: string }> = {
  time: { label: '时间凭证', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' },
  route: { label: '路线凭证', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' },
  weather: { label: '天气凭证', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  customer: { label: '客户凭证', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  rider: { label: '骑手相关', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
};

const typeIcon = {
  image: Image,
  text: FileText,
  audio: FileAudio,
};

export const EvidenceSelector = ({ question, onSubmit, disabled, preSelected }: EvidenceSelectorProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(preSelected || []));
  const [showInvalidInfo, setShowInvalidInfo] = useState(false);

  useEffect(() => {
    setSelected(new Set(preSelected || []));
  }, [preSelected, question.id]);

  const toggleItem = (id: string) => {
    if (disabled) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= question.maxAllowed) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const categories = Array.from(new Set(question.evidencePool.map(e => e.category)));
  const itemsByCategory = categories.map(cat => ({
    info: categoryInfo[cat],
    items: question.evidencePool.filter(e => e.category === cat),
  }));

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-slate-800/80 p-5 shadow-xl lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">申诉场景描述</h3>
          </div>
          <div className="rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
            <p className="text-sm leading-relaxed text-slate-200">{question.scenario}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-400/20 bg-slate-800/60 p-4 shadow-lg">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">选择要求</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                最少选择 <span className="font-bold text-white">{question.minRequired}</span> 项有效证据
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                最多选择 <span className="font-bold text-white">{question.maxAllowed}</span> 项
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                选择无效证据会扣分
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">当前选择</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-white">
                  {selected.size}
                  <span className="text-base text-slate-500">/{question.maxAllowed}</span>
                </p>
                <p className={`text-xs ${selected.size >= question.minRequired ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selected.size >= question.minRequired
                    ? '✓ 已满足最少要求'
                    : `还需选择 ${question.minRequired - selected.size} 项`}
                </p>
              </div>
              <div className="flex h-14 w-2 overflow-hidden rounded-full bg-slate-700/50">
                <div
                  className={`w-full transition-all ${selected.size >= question.minRequired ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ height: `${(selected.size / question.maxAllowed) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {itemsByCategory.map(group => (
          <div key={group.info.label} className="rounded-2xl border border-white/5 bg-slate-800/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${group.info.color}`}>
                {group.info.label} · {group.items.length}项
              </span>
              <span className="text-[11px] text-slate-500">
                已选 {group.items.filter(i => selected.has(i.id)).length} / {group.items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map(item => {
                const isSelected = selected.has(item.id);
                const Icon = typeIcon[item.type];
                const showAsInvalid = showInvalidInfo && !item.isValid;
                const showAsValid = showInvalidInfo && item.isValid;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    disabled={disabled}
                    className={clsx(
                      'group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 via-slate-800/80 to-slate-800/60 shadow-lg scale-[1.01]'
                        : showAsInvalid
                          ? 'border-rose-500/40 bg-rose-500/10'
                          : showAsValid
                            ? 'border-amber-400/30 bg-amber-400/5'
                            : 'border-white/5 bg-slate-800/50 hover:bg-slate-800/80 hover:border-white/15',
                      disabled && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/60 text-slate-400 group-hover:text-white'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                          ) : showAsInvalid ? (
                            <XCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">{item.content}</p>
                        {showAsInvalid && item.invalidReason && (
                          <p className="mt-2 rounded-md bg-rose-500/20 px-2 py-1 text-[11px] text-rose-300 border border-rose-400/20">
                            ❌ 无效原因: {item.invalidReason}
                          </p>
                        )}
                        {showAsValid && (
                          <p className="mt-2 rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-300 border border-emerald-400/20">
                            ✓ 有效证据
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      <span>{item.type === 'image' ? '图片证据' : item.type === 'text' ? '文字凭证' : '音频记录'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-800/60 px-5 py-3 backdrop-blur">
        <button
          onClick={() => setShowInvalidInfo(s => !s)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-300"
        >
          {showInvalidInfo ? '隐藏答案提示' : '显示正确答案对比'}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            选中 <span className="font-bold text-white">{selected.size}</span> / {question.maxAllowed}
          </span>
          <button
            onClick={() => onSubmit(Array.from(selected))}
            disabled={disabled || selected.size < question.minRequired}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all',
              disabled || selected.size < question.minRequired
                ? 'cursor-not-allowed bg-slate-700/60 text-slate-500'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 active:translate-y-0'
            )}
          >
            <Send className="h-4 w-4" />
            提交证据
          </button>
        </div>
      </div>
    </div>
  );
};
