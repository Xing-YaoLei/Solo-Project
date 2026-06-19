import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon,
  Clock,
  RefreshCcw,
  SkipForward,
  Package,
  Minus,
  Percent,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShortageSolution } from '@/types';

interface SolutionOption {
  key: ShortageSolution;
  title: string;
  description: string;
  icon: typeof Clock;
  iconBg: string;
  iconColor: string;
  border: string;
  hoverBg: string;
  effects: { label: string; value: string; type: 'penalty' | 'neutral' }[];
  accent: string;
}

const options: SolutionOption[] = [
  {
    key: 'wait',
    title: '等待配送',
    description: '等待供应商紧急配送配件，保证原厂品质但需要时间',
    icon: Clock,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/10',
    accent: 'from-blue-500 to-cyan-500',
    effects: [
      { label: '时间', value: '-30秒', type: 'penalty' },
      { label: '分数', value: '-20分', type: 'penalty' },
      { label: '返修率', value: '无影响', type: 'neutral' },
    ],
  },
  {
    key: 'alternative',
    title: '使用替代件',
    description: '使用兼容的替代配件，质量可能存在兼容性风险',
    icon: RefreshCcw,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/10',
    accent: 'from-amber-500 to-orange-500',
    effects: [
      { label: '时间', value: '无影响', type: 'neutral' },
      { label: '分数', value: '-10分', type: 'penalty' },
      { label: '返修率', value: '+15%', type: 'penalty' },
    ],
  },
  {
    key: 'skip',
    title: '跳过工序',
    description: '放弃此工序，不进行维修，直接标记完成但质量堪忧',
    icon: SkipForward,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    border: 'border-red-500/30',
    hoverBg: 'hover:bg-red-500/10',
    accent: 'from-red-500 to-rose-500',
    effects: [
      { label: '时间', value: '无影响', type: 'neutral' },
      { label: '分数', value: '不得分', type: 'penalty' },
      { label: '返修率', value: '+40%', type: 'penalty' },
    ],
  },
];

export default function ShortageModal() {
  const {
    shortageModal,
    handleShortage,
    closeShortageModal,
    parts,
  } = useGameStore();

  const { open, partId, partName } = shortageModal;
  const part = parts.find((p) => p.id === partId);
  const displayName = partName || part?.name || '未知配件';
  const hasAlternative = part?.isAlternativeAvailable ?? false;
  const alternativePart = hasAlternative && part?.alternativePartId
    ? parts.find((p) => p.id === part.alternativePartId)
    : null;

  const handleSelect = (solution: ShortageSolution) => {
    handleShortage(solution);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeShortageModal}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 mx-4 w-full max-w-2xl"
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/50">
              <button
                onClick={closeShortageModal}
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent p-8 pb-6">
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="mb-5 flex items-center justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
                      <AlertOctagon className="h-10 w-10 text-red-400" />
                    </div>
                  </div>
                </motion.div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">配件库存不足</h2>
                  <p className="mt-2 text-sm text-white/60">
                    当前工序所需配件库存为零，请选择处理方案
                  </p>
                </div>

                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mx-auto mt-6 flex max-w-md items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                    <Package className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-red-400">
                      {displayName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        当前库存：<span className="font-bold text-red-400">0</span>
                      </span>
                      {part?.category && (
                        <span className="rounded-md bg-white/10 px-1.5 py-0.5">
                          {part.category}
                        </span>
                      )}
                    </div>
                    {alternativePart && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-400">
                        <RefreshCcw className="h-3 w-3" />
                        可用替代件：{alternativePart.name}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="p-6 space-y-3">
                {options.map((option, idx) => {
                  const isDisabled =
                    option.key === 'alternative' && !hasAlternative;
                  const Icon = option.icon;

                  return (
                    <motion.button
                      key={option.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08 }}
                      onClick={() => !isDisabled && handleSelect(option.key)}
                      disabled={isDisabled}
                      className={cn(
                        'group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all',
                        'bg-white/[0.02]',
                        option.border,
                        !isDisabled && cn(option.hoverBg, 'active:scale-[0.98]'),
                        isDisabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute left-0 top-0 h-full w-1 bg-gradient-to-b',
                          option.accent
                        )}
                      />

                      <div className="flex items-start gap-4 pl-2">
                        <div
                          className={cn(
                            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                            option.iconBg
                          )}
                        >
                          <Icon className={cn('h-6 w-6', option.iconColor)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-white">
                              {option.title}
                            </h3>
                            {isDisabled && (
                              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                                不可用
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-white/60 line-clamp-2">
                            {option.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {option.effects.map((effect, i) => (
                              <EffectBadge key={i} effect={effect} />
                            ))}
                          </div>
                        </div>

                        {!isDisabled && (
                          <motion.div
                            initial={{ opacity: 0, x: -5 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1 self-center"
                          >
                            <span className="text-xs text-white/50">选择</span>
                            <SkipForward className="h-4 w-4 text-white/50" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="border-t border-white/5 bg-white/[0.02] px-6 py-4">
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <div className="flex items-center gap-1.5">
                    <AlertOctagon className="h-3.5 w-3.5" />
                    <span>选择后游戏将自动继续，操作不可撤销</span>
                  </div>
                  <button
                    onClick={closeShortageModal}
                    className="text-white/50 underline decoration-dotted underline-offset-2 hover:text-white/80 transition-colors"
                  >
                    稍后处理
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EffectBadge({ effect }: { effect: { label: string; value: string; type: 'penalty' | 'neutral' } }) {
  const isPenalty = effect.type === 'penalty';
  const isTime = effect.label === '时间';
  const isScore = effect.label === '分数';
  const isRework = effect.label === '返修率';

  const Icon = isTime ? Clock : isScore ? Trophy : isRework ? Percent : Minus;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px]',
        isPenalty
          ? 'border-red-500/20 bg-red-500/10'
          : 'border-emerald-500/20 bg-emerald-500/10'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-3 w-3',
            isPenalty ? 'text-red-400' : 'text-emerald-400'
          )}
        />
      )}
      <span
        className={cn(
          'text-white/60',
          isPenalty ? 'text-white/50' : 'text-white/50'
        )}
      >
        {effect.label}
      </span>
      <span
        className={cn(
          'font-semibold tabular-nums',
          isPenalty ? 'text-red-400' : 'text-emerald-400'
        )}
      >
        {effect.value}
      </span>
    </div>
  );
}
