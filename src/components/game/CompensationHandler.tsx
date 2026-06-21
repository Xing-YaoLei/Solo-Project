import { useState, useEffect, useMemo } from 'react';
import type { CompensationQuestion, DamageCause } from '@/types/game';
import {
  Send, AlertTriangle, ShieldAlert, Lightbulb, PackageCheck, DollarSign,
  Info, CheckCircle2, XCircle, ChevronRight, Eye, User, MessageSquareText
} from 'lucide-react';
import { clsx } from 'clsx';

interface CompensationHandlerProps {
  question: CompensationQuestion;
  onSubmit: (payload: { causeId: string; amount: string }) => void;
  disabled?: boolean;
  preCauseId?: string;
  preAmount?: string;
}

const categoryInfo: Record<DamageCause['category'], { label: string; color: string; icon: string }> = {
  packaging: { label: '包装问题', color: 'bg-purple-500/15 text-purple-300 border-purple-400/30', icon: '📦' },
  rider:     { label: '骑手责任', color: 'bg-rose-500/15 text-rose-300 border-rose-400/30',       icon: '🛵' },
  product:   { label: '商品本身', color: 'bg-amber-500/15 text-amber-300 border-amber-400/30',     icon: '🏷️' },
  external:  { label: '外部因素', color: 'bg-slate-500/15 text-slate-300 border-slate-400/30',     icon: '🌍' },
};

const degreeInfo = {
  minor:    { label: '轻微损坏', color: 'bg-emerald-500/20 text-emerald-300',  icon: '🟢' },
  moderate: { label: '中度损坏', color: 'bg-amber-500/20 text-amber-300',      icon: '🟡' },
  severe:   { label: '严重损坏', color: 'bg-rose-500/20 text-rose-300',        icon: '🔴' },
};

export const CompensationHandler = ({ question, onSubmit, disabled, preCauseId, preAmount }: CompensationHandlerProps) => {
  const { caseData, amountOptions } = question;
  const [selectedCause, setSelectedCause] = useState<string>(preCauseId || '');
  const [selectedAmount, setSelectedAmount] = useState<string>(preAmount || '');
  const [showSystemCause, setShowSystemCause] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setSelectedCause(preCauseId || '');
    setSelectedAmount(preAmount || '');
    setShowSystemCause(false);
    setShowHint(false);
  }, [question.id, preCauseId, preAmount]);

  const systemAnalyzedCause = useMemo(() => {
    return caseData.possibleCauses.find(c => c.id === caseData.correctCauseId);
  }, [caseData]);

  const selectedCauseData = caseData.possibleCauses.find(c => c.id === selectedCause);
  const expectedCompensation = Math.round(caseData.productValue * (systemAnalyzedCause?.compensationRatio || 0));

  const canSubmit = selectedCause && selectedAmount;

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-slate-800/50 to-slate-800/80 p-5 shadow-xl lg:col-span-3">
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-300">赔付案例详情</h3>
            <span className={`ml-2 rounded-full px-3 py-0.5 text-[11px] font-bold ${degreeInfo[caseData.damageDegree].color}`}>
              {degreeInfo[caseData.damageDegree].icon} {degreeInfo[caseData.damageDegree].label}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700/50 to-slate-900/50 p-6 md:col-span-2 md:aspect-square">
              <div className="text-center">
                <div className="text-7xl leading-none mb-2">{caseData.damageImage}</div>
                <p className="mt-2 text-xs text-slate-400">损坏物示意图</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:col-span-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">商品名称</p>
                <p className="text-lg font-bold text-white leading-tight">{caseData.productName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400/70">商品价值</p>
                  <p className="text-2xl font-black text-amber-300">¥{caseData.productValue}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-700/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">建议赔付比例</p>
                  <p className="text-2xl font-black text-slate-200">
                    {systemAnalyzedCause ? `${(systemAnalyzedCause.compensationRatio * 100).toFixed(0)}%` : '待判定'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <MessageSquareText className="h-3.5 w-3.5 text-cyan-400" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">客户备注说明</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-200">「{caseData.customerNote}」</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <User className="h-3 w-3" /> 客户反馈 · 开箱验损记录
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="rounded-2xl border border-amber-400/20 bg-slate-800/60 p-4 shadow-lg">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">任务要求</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span>从下列可能原因中，选择<span className="font-bold text-white">最符合</span>的损坏原因</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span>根据判定原因，选择<span className="font-bold text-white">恰当的赔付金额</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>可开启「系统分析」查看系统判定的原因参考</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-rose-500/10 to-indigo-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">您的当前选择</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={clsx(
                    'rounded-md px-2.5 py-1 text-[11px] font-bold',
                    selectedCauseData
                      ? `${categoryInfo[selectedCauseData.category].color} border`
                      : 'bg-slate-700/40 text-slate-500 border border-white/5'
                  )}>
                    {selectedCauseData ? `${categoryInfo[selectedCauseData.category].icon} ${selectedCauseData.name}` : '❓ 未选原因'}
                  </span>
                  <span className={clsx(
                    'rounded-md px-2.5 py-1 text-[11px] font-bold',
                    selectedAmount
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                      : 'bg-slate-700/40 text-slate-500 border border-white/5'
                  )}>
                    {selectedAmount ? `¥${selectedAmount}` : '💴 未选金额'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
              <div
                className={clsx(
                  'h-full transition-all',
                  canSubmit
                    ? 'w-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500'
                    : selectedCause ? 'w-1/2 bg-amber-500' : 'w-0'
                )}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {canSubmit ? '✓ 两项均已选择，可以提交' : selectedCause ? '还需选择赔付金额' : '请先选择损坏原因'}
            </p>
          </div>

          <button
            onClick={() => setShowSystemCause(s => !s)}
            className={clsx(
              'w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition',
              showSystemCause
                ? 'border-cyan-400/40 bg-cyan-500/10'
                : 'border-white/10 bg-slate-800/60 hover:bg-slate-800/80 hover:border-white/20'
            )}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                {showSystemCause ? '隐藏系统损坏分析' : '查看系统损坏原因分析'}
              </span>
            </div>
            <ChevronRight className={clsx('h-4 w-4 text-slate-400 transition-transform', showSystemCause && 'rotate-90')} />
          </button>
          {showSystemCause && systemAnalyzedCause && (
            <div className="animate-in rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-3 text-xs text-slate-300 fade-in">
              <p className="mb-1 flex items-center gap-1.5 font-bold text-cyan-300">
                <PackageCheck className="h-3.5 w-3.5" />
                系统综合分析结果
              </p>
              <p className="leading-relaxed">
                根据外箱状态、客户描述、损坏程度等多维度综合判断：
                <span className="mx-1 font-bold text-white">{systemAnalyzedCause.name}</span>
                ，建议赔付比例 <span className="font-bold text-white">{(systemAnalyzedCause.compensationRatio * 100).toFixed(0)}%</span>，
                建议赔付金额 <span className="font-bold text-emerald-300">¥{expectedCompensation}</span>
              </p>
              <p className="mt-2 rounded-md bg-slate-800/60 px-2 py-1 text-[11px] text-slate-400 border border-white/5">
                <Info className="inline h-3 w-3 mr-1" />
                {systemAnalyzedCause.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-800/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-lg">🔍</span> 第一步 · 判定损坏原因
            </h3>
            <span className="text-[11px] text-slate-400">单选 · {caseData.possibleCauses.length} 选 1</span>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            {caseData.possibleCauses.map(cause => {
              const isSelected = selectedCause === cause.id;
              const cat = categoryInfo[cause.category];
              const isCorrectHighlight = showHint && cause.id === caseData.correctCauseId;
              const isWrongHighlight = showHint && isSelected && cause.id !== caseData.correctCauseId;
              return (
                <button
                  key={cause.id}
                  onClick={() => !disabled && setSelectedCause(cause.id)}
                  disabled={disabled}
                  className={clsx(
                    'relative flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-all',
                    isSelected
                      ? `border-emerald-400/50 bg-gradient-to-br from-white/10 via-slate-800/80 to-slate-800/60 shadow-lg scale-[1.01] ring-2 ring-emerald-400/20`
                      : isCorrectHighlight
                        ? 'border-emerald-400/50 bg-emerald-500/10'
                        : isWrongHighlight
                          ? 'border-rose-400/40 bg-rose-500/10'
                          : 'border-white/5 bg-slate-800/50 hover:bg-slate-800/80 hover:border-white/15',
                    disabled && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-lg',
                      isSelected ? 'bg-white/10' : 'bg-slate-700/60 group-hover:bg-slate-700/80'
                    )}>
                      {cat.icon}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white">{cause.name}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">赔付</span>
                          <span className="text-xs font-black text-amber-300">
                            {(cause.compensationRatio * 100).toFixed(0)}%
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          {isCorrectHighlight && !isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          {isWrongHighlight && <XCircle className="h-4 w-4 text-rose-400" />}
                        </div>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{cause.description}</p>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        对应赔付金额：<span className="font-bold text-slate-300">¥{Math.round(caseData.productValue * cause.compensationRatio)}</span>
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-800/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-lg">💰</span> 第二步 · 选择赔付金额
            </h3>
            <span className="text-[11px] text-slate-400">单选 · {amountOptions.length} 选 1</span>
          </div>

          <div className="flex flex-1 flex-col gap-2.5">
            {amountOptions.map(opt => {
              const amt = parseFloat(opt.value) || 0;
              const matchExpected = amt === expectedCompensation;
              const isSelected = selectedAmount === opt.value;
              const isCorrectHighlight = showHint && matchExpected;
              const isWrongHighlight = showHint && isSelected && !matchExpected;
              const ratio = caseData.productValue > 0 ? (amt / caseData.productValue) : 0;
              return (
                <button
                  key={opt.id}
                  onClick={() => !disabled && setSelectedAmount(opt.value)}
                  disabled={disabled}
                  className={clsx(
                    'relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all',
                    isSelected
                      ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 via-slate-800/80 to-slate-800/60 shadow-lg scale-[1.01] ring-2 ring-emerald-400/10'
                      : isCorrectHighlight
                        ? 'border-emerald-400/50 bg-emerald-500/10'
                        : isWrongHighlight
                          ? 'border-rose-400/40 bg-rose-500/10'
                          : 'border-white/5 bg-slate-800/50 hover:bg-slate-800/80 hover:border-white/15',
                    disabled && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className={clsx(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                    isSelected ? 'bg-emerald-500/20' : 'bg-slate-700/60 group-hover:bg-slate-700/80'
                  )}>
                    <DollarSign className={clsx('h-5 w-5', isSelected ? 'text-emerald-300' : 'text-slate-400')} />
                  </div>
                  <div className="flex flex-1 min-w-0 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-black text-white">{opt.label}</p>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                      {isCorrectHighlight && !isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                      {isWrongHighlight && <XCircle className="h-5 w-5 text-rose-400" />}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400">赔付比例约 <span className="font-bold text-slate-300">{(ratio * 100).toFixed(0)}%</span></span>
                      {matchExpected && !showHint && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300 border border-cyan-400/20">
                          <Info className="h-3 w-3" /> 与系统建议一致
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-800/60 px-5 py-3 backdrop-blur">
        <button
          onClick={() => setShowHint(s => !s)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-300"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {showHint ? '隐藏正确答案' : '显示正确答案对比'}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            判定原因 <span className="font-bold text-white">{selectedCause ? '✓' : '✗'}</span> · 赔付金额 <span className="font-bold text-white">{selectedAmount ? '✓' : '✗'}</span>
          </span>
          <button
            onClick={() => canSubmit && onSubmit({ causeId: selectedCause, amount: selectedAmount })}
            disabled={disabled || !canSubmit}
            className={clsx(
              'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all',
              disabled || !canSubmit
                ? 'cursor-not-allowed bg-slate-700/60 text-slate-500'
                : 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0'
            )}
          >
            <Send className="h-4 w-4" />
            提交赔付判定
          </button>
        </div>
      </div>
    </div>
  );
};
