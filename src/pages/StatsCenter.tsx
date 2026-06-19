import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Sparkles,
  Target,
  Zap,
  Shield,
  Star,
  Lock,
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trophy,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { formatNumber, formatPercent, formatRelativeTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { GameRecord, Level } from '@/types';

interface TooltipState {
  x: number;
  y: number;
  levelName: string;
  reworkRate: number;
  completionRate: number;
  record?: GameRecord;
}

function ReworkRateBarChart() {
  const levels = useGameStore((s) => s.levels);
  const gameRecords = useGameStore((s) => s.gameRecords);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const chartData = useMemo(() => {
    return levels
      .filter((l) => l.bestScore > 0 || gameRecords.some((r) => r.levelId === l.id))
      .map((level) => {
        const levelRecords = gameRecords.filter((r) => r.levelId === level.id);
        const bestRecord = [...levelRecords].sort((a, b) => b.score - a.score)[0];
        const avgReworkRate =
          levelRecords.length > 0
            ? levelRecords.reduce((acc, r) => acc + r.repairRate, 0) / levelRecords.length
            : level.bestScore > 0
            ? 0
            : 0;
        return {
          level,
          bestRecord,
          avgReworkRate,
          completionRate: bestRecord?.completionRate ?? 0,
        };
      });
  }, [levels, gameRecords]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-300 mb-1">暂无关卡数据</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">完成关卡后将展示返修率对比</p>
      </div>
    );
  }

  const maxRate = 0.5;
  const barWidth = Math.max(40, Math.min(64, 560 / chartData.length));
  const chartHeight = 280;
  const padding = { top: 20, right: 20, bottom: 48, left: 48 };
  const innerWidth = chartData.length * barWidth + (chartData.length - 1) * 16;
  const svgWidth = Math.max(600, innerWidth + padding.left + padding.right);

  const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
  const yToPx = (v: number) =>
    padding.top + (1 - Math.min(v, maxRate) / maxRate) * (chartHeight - padding.top - padding.bottom);

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={chartHeight}
          className="w-full min-w-[600px]"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="barGradientGood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="barGradientWarn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="barGradientBad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={yToPx(tick)}
                x2={svgWidth - padding.right}
                y2={yToPx(tick)}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={yToPx(tick) + 4}
                textAnchor="end"
                className="fill-gray-400 dark:fill-gray-500 text-[11px]"
              >
                {Math.round(tick * 100)}%
              </text>
            </g>
          ))}

          {chartData.map((item, i) => {
            const x = padding.left + i * (barWidth + 16);
            const reworkH = (chartHeight - padding.top - padding.bottom) * (item.avgReworkRate / maxRate);
            const completionH = (chartHeight - padding.top - padding.bottom) * (item.completionRate / maxRate);
            const yRework = yToPx(item.avgReworkRate);
            const yCompletion = yToPx(item.completionRate);

            const reworkGradient =
              item.avgReworkRate <= 0.1 ? 'url(#barGradientGood)' :
              item.avgReworkRate <= 0.25 ? 'url(#barGradientWarn)' : 'url(#barGradientBad)';

            return (
              <g key={item.level.id}>
                <motion.rect
                  x={x}
                  y={yToPx(0)}
                  width={barWidth / 2 - 2}
                  height={0}
                  initial={{ height: 0 }}
                  animate={{ height: completionH }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                  fill="url(#barGradientGood)"
                  opacity={0.3}
                  rx={4}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      levelName: item.level.name,
                      reworkRate: item.avgReworkRate,
                      completionRate: item.completionRate,
                      record: item.bestRecord,
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      levelName: item.level.name,
                      reworkRate: item.avgReworkRate,
                      completionRate: item.completionRate,
                      record: item.bestRecord,
                    });
                  }}
                  style={{ cursor: 'pointer' }}
                />

                <motion.rect
                  x={x + barWidth / 2 + 2}
                  y={yToPx(0)}
                  width={barWidth / 2 - 2}
                  height={0}
                  initial={{ height: 0 }}
                  animate={{ height: reworkH }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                  fill={reworkGradient}
                  rx={4}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      levelName: item.level.name,
                      reworkRate: item.avgReworkRate,
                      completionRate: item.completionRate,
                      record: item.bestRecord,
                    });
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      levelName: item.level.name,
                      reworkRate: item.avgReworkRate,
                      completionRate: item.completionRate,
                      record: item.bestRecord,
                    });
                  }}
                  style={{ cursor: 'pointer' }}
                />

                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 20}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-400 text-[11px] font-medium"
                >
                  L{levels.findIndex((l) => l.id === item.level.id) + 1}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 34}
                  textAnchor="middle"
                  className="fill-gray-400 dark:fill-gray-500 text-[10px]"
                >
                  {item.level.name.length > 6 ? item.level.name.slice(0, 6) + '…' : item.level.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-emerald-500 opacity-40" />
          <span className="text-xs text-gray-600 dark:text-gray-400">完成率</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gradient-to-t from-rose-600 to-rose-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">返修率</span>
        </div>
      </div>

      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="pointer-events-none absolute z-10 rounded-xl bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 shadow-2xl border border-gray-700/50 min-w-[200px]"
          style={{
            left: Math.min(tooltip.x + 16, svgWidth - 220),
            top: tooltip.y + 16,
          }}
        >
          <div className="font-semibold text-sm mb-2">{tooltip.levelName}</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-gray-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                完成率
              </span>
              <span className="font-medium text-emerald-400">
                {formatPercent(tooltip.completionRate, { decimals: 1 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-gray-300">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                返修率
              </span>
              <span className="font-medium text-rose-400">
                {formatPercent(tooltip.reworkRate, { decimals: 1 })}
              </span>
            </div>
            {tooltip.record && (
              <>
                <div className="border-t border-gray-700/50 mt-2 pt-2" />
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    最佳得分
                  </span>
                  <span className="font-medium text-amber-400">{formatNumber(tooltip.record.score)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    星级
                  </span>
                  <span className="font-medium text-amber-400">{'★'.repeat(tooltip.record.stars)}{'☆'.repeat(3 - tooltip.record.stars)}</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TrendLineChart() {
  const gameRecords = useGameStore((s) => s.gameRecords);
  const levels = useGameStore((s) => s.levels);

  const sortedRecords = useMemo(() => {
    return [...gameRecords].sort((a, b) => a.timestamp - b.timestamp).slice(-20);
  }, [gameRecords]);

  if (sortedRecords.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-300 mb-1">训练数据不足</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">至少完成2次关卡以查看趋势</p>
      </div>
    );
  }

  const chartHeight = 280;
  const padding = { top: 28, right: 24, bottom: 40, left: 52 };
  const svgWidth = 700;
  const innerW = svgWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxScore = Math.max(...sortedRecords.map((r) => r.score), 100);
  const yMax = Math.ceil(maxScore / 500) * 500;

  const xStep = innerW / (sortedRecords.length - 1 || 1);

  const points = sortedRecords.map((r, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + (1 - r.score / yMax) * innerH,
    record: r,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `M ${points[0].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} ` +
    points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

  const yTicks = 5;
  const xTicks = Math.min(sortedRecords.length, 6);

  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={chartHeight} className="w-full min-w-[600px]">
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = (yMax / yTicks) * i;
          const y = padding.top + (1 - i / yTicks) * innerH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400 dark:fill-gray-500 text-[11px]"
              >
                {formatNumber(val)}
              </text>
            </g>
          );
        })}

        {Array.from({ length: xTicks }).map((_, i) => {
          const idx = Math.round((i / (xTicks - 1 || 1)) * (sortedRecords.length - 1));
          const r = sortedRecords[idx];
          if (!r) return null;
          const level = levels.find((l) => l.id === r.levelId);
          const x = padding.left + idx * xStep;
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - padding.bottom + 18}
              textAnchor="middle"
              className="fill-gray-400 dark:fill-gray-500 text-[10px]"
            >
              {level?.name ? `L${levels.findIndex((l) => l.id === level.id) + 1}` : '—'}
            </text>
          );
        })}

        <motion.path
          d={areaPath}
          fill="url(#trendArea)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#trendLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />

        {points.map((p, i) => {
          const stars = p.record.stars;
          return (
            <g key={i}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r="0"
                initial={{ r: 0 }}
                animate={{ r: stars >= 2 ? 6 : 4.5 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.05, type: 'spring' }}
                fill={stars >= 3 ? '#fbbf24' : stars >= 2 ? '#6366f1' : stars >= 1 ? '#06b6d4' : '#94a3b8'}
                stroke="#fff"
                strokeWidth="2"
              />
              <title>
                {`${formatNumber(p.record.score)}分 · ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${formatRelativeTime(p.record.timestamp)}`}
              </title>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-6 mt-2">
        {[
          { color: '#fbbf24', label: '三星通关' },
          { color: '#6366f1', label: '二星通关' },
          { color: '#06b6d4', label: '一星通关' },
          { color: '#94a3b8', label: '未获星' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  check: (records: GameRecord[], levels: Level[]) => boolean;
  progress?: (records: GameRecord[], levels: Level[]) => { current: number; target: number };
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-blood',
    name: '初出茅庐',
    description: '完成第一个关卡',
    icon: Zap,
    color: 'from-sky-400 to-blue-500',
    check: (records) => records.length >= 1,
    progress: (records) => ({ current: Math.min(records.length, 1), target: 1 }),
  },
  {
    id: 'three-star-l1',
    name: '完美开局',
    description: '任意关卡获得三星评价',
    icon: Crown,
    color: 'from-amber-400 to-orange-500',
    check: (records) => records.some((r) => r.stars >= 3),
    progress: (records) => ({
      current: Math.min(records.filter((r) => r.stars >= 3).length, 1),
      target: 1,
    }),
  },
  {
    id: 'zero-rework',
    name: '零返修大师',
    description: '以0%返修率完成任意关卡',
    icon: Shield,
    color: 'from-emerald-400 to-teal-500',
    check: (records) => records.some((r) => r.repairRate === 0 && r.completionRate >= 0.6),
    progress: (records) => ({
      current: Math.min(records.filter((r) => r.repairRate === 0 && r.completionRate >= 0.6).length, 1),
      target: 1,
    }),
  },
  {
    id: 'speed-runner',
    name: '风驰电掣',
    description: '完成5次关卡',
    icon: Clock,
    color: 'from-violet-400 to-purple-500',
    check: (records) => records.length >= 5,
    progress: (records) => ({ current: Math.min(records.length, 5), target: 5 }),
  },
  {
    id: 'collector',
    name: '星级收藏家',
    description: '累计获得6颗星',
    icon: Star,
    color: 'from-amber-400 to-yellow-500',
    check: (records, levels) =>
      levels.reduce((acc, l) => acc + l.bestStars, 0) >= 6,
    progress: (records, levels) => ({
      current: Math.min(levels.reduce((acc, l) => acc + l.bestStars, 0), 6),
      target: 6,
    }),
  },
  {
    id: 'all-clear',
    name: '通关达人',
    description: '解锁并完成3个不同关卡',
    icon: Trophy,
    color: 'from-indigo-400 to-blue-600',
    check: (records, levels) => {
      const completedLevels = new Set(
        records.filter((r) => r.stars >= 1).map((r) => r.levelId)
      );
      const unlockedLevels = levels.filter((l) => l.unlocked).length;
      return completedLevels.size >= 3 && unlockedLevels >= 3;
    },
    progress: (records, levels) => {
      const completedLevels = new Set(
        records.filter((r) => r.stars >= 1).map((r) => r.levelId)
      );
      return { current: Math.min(completedLevels.size, 3), target: 3 };
    },
  },
  {
    id: 'high-scorer',
    name: '分数猎手',
    description: '单局得分突破2000分',
    icon: Target,
    color: 'from-rose-400 to-pink-500',
    check: (records) => records.some((r) => r.score >= 2000),
    progress: (records) => ({
      current: Math.min(records.filter((r) => r.score >= 2000).length, 1),
      target: 1,
    }),
  },
  {
    id: 'completionist',
    name: '完美主义者',
    description: '以100%完成率完成任意关卡',
    icon: Sparkles,
    color: 'from-cyan-400 to-sky-500',
    check: (records) => records.some((r) => r.completionRate >= 1),
    progress: (records) => ({
      current: Math.min(records.filter((r) => r.completionRate >= 1).length, 1),
      target: 1,
    }),
  },
];

function AchievementBadge({
  achievement,
  unlocked,
  progress,
  index,
}: {
  achievement: AchievementDef;
  unlocked: boolean;
  progress?: { current: number; target: number };
  index: number;
}) {
  const { icon: Icon } = achievement;
  const pct = progress ? (progress.current / progress.target) * 100 : unlocked ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.08 * index }}
      className={cn(
        'group relative rounded-2xl border p-4 transition-all',
        unlocked
          ? 'bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:-translate-y-0.5'
          : 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800/60 opacity-80'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl',
            unlocked
              ? `bg-gradient-to-br ${achievement.color} shadow-lg`
              : 'bg-gray-200 dark:bg-gray-700/50'
          )}
        >
          {unlocked ? (
            <Icon className="h-7 w-7 text-white drop-shadow" />
          ) : (
            <Lock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          )}
          {unlocked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.08, type: 'spring' }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow"
            >
              <Award className="h-3 w-3 text-amber-500" />
            </motion.div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                'font-semibold text-sm truncate',
                unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {achievement.name}
            </h3>
            {unlocked && (
              <span className="flex-shrink-0 text-[10px] font-medium rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5">
                已解锁
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {achievement.description}
          </p>

          {!unlocked && progress && progress.target > 1 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                <span>进度</span>
                <span>{progress.current}/{progress.target}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.08 }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AchievementsSection() {
  const gameRecords = useGameStore((s) => s.gameRecords);
  const levels = useGameStore((s) => s.levels);

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(gameRecords, levels)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            已解锁 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{unlockedCount}</span> / {ACHIEVEMENTS.length}
          </p>
        </div>
        <Medal className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a, i) => (
          <AchievementBadge
            key={a.id}
            achievement={a}
            unlocked={a.check(gameRecords, levels)}
            progress={a.progress?.(gameRecords, levels)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

export default function StatsCenter() {
  const gameRecords = useGameStore((s) => s.gameRecords);
  const levels = useGameStore((s) => s.levels);

  const summary = useMemo(() => {
    const totalGames = gameRecords.length;
    const totalStars = levels.reduce((acc, l) => acc + l.bestStars, 0);
    const maxStars = levels.length * 3;
    const avgCompletion =
      totalGames > 0
        ? gameRecords.reduce((acc, r) => acc + r.completionRate, 0) / totalGames
        : 0;
    const totalCars = gameRecords.reduce((acc, r) => acc + r.completedVehicles, 0);
    const totalReworks = gameRecords.reduce((acc, r) => acc + r.reworkCount, 0);
    return { totalGames, totalStars, maxStars, avgCompletion, totalCars, totalReworks };
  }, [gameRecords, levels]);

  const hasData = gameRecords.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              统计中心
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-[52px]">
            追踪你的训练进度与维修技能成长
          </p>
        </motion.div>

        {hasData ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
            >
              {[
                {
                  label: '总游戏场次',
                  value: formatNumber(summary.totalGames),
                  icon: Zap,
                  color: 'text-amber-500',
                  bg: 'bg-amber-50 dark:bg-amber-500/10',
                },
                {
                  label: '累计星星',
                  value: `${summary.totalStars}/${summary.maxStars}`,
                  icon: Star,
                  color: 'text-yellow-500',
                  bg: 'bg-yellow-50 dark:bg-yellow-500/10',
                },
                {
                  label: '平均完成率',
                  value: formatPercent(summary.avgCompletion, { decimals: 0 }),
                  icon: CheckCircle2,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                },
                {
                  label: '维修车辆数',
                  value: formatNumber(summary.totalCars),
                  icon: Car,
                  color: 'text-sky-500',
                  bg: 'bg-sky-50 dark:bg-sky-500/10',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="rounded-2xl bg-white/80 dark:bg-gray-800/50 backdrop-blur border border-white/50 dark:border-gray-700/30 p-4 shadow-sm"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} mb-3`}>
                    <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-3xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-white/50 dark:border-gray-700/30 p-6 md:p-8 mb-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    关卡返修率对比
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    悬停柱状图可查看详细数据
                  </p>
                </div>
              </div>
              <ReworkRateBarChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="rounded-3xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-white/50 dark:border-gray-700/30 p-6 md:p-8 mb-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                  <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    训练趋势
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    近期得分变化曲线
                  </p>
                </div>
              </div>
              <TrendLineChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="rounded-3xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-white/50 dark:border-gray-700/30 p-6 md:p-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                  <Award className="h-4.5 w-4.5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    成就徽章
                  </h2>
                </div>
              </div>
              <AchievementsSection />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-white/50 dark:border-gray-700/30 p-12 md:p-20 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700/50">
              <Trophy className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              还没有训练记录
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              完成第一个关卡后，这里将展示你的成绩统计、训练趋势以及成就徽章。
              快去开始你的维修训练吧！
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                返修率对比
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                训练趋势图
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Award className="h-4 w-4 text-amber-500" />
                成就解锁
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
