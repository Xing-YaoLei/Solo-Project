import { motion } from 'framer-motion';
import { Trophy, Users, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardsProps {
  totalScore: number;
  targetScore: number;
  occupancyPercent: number;
  targetOccupancy: number;
  totalRevenue: number;
  conflictCount: number;
  refundCount: number;
}

interface CardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof Trophy;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, subValue, icon: Icon, iconBg, iconColor, highlight, trend }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`
        relative p-4 rounded-2xl border overflow-hidden
        ${highlight
          ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-slate-800/50 border-amber-500/40'
          : 'bg-slate-800/50 border-slate-700/60'
        }
      `}
    >
      {highlight && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend && (
            <div className={`
              px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5
              ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                trend === 'down' ? 'bg-rose-500/20 text-rose-400' :
                'bg-slate-700/60 text-slate-400'}
            `}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
               trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              {trend === 'up' ? '达标' : trend === 'down' ? '未达标' : '-'}
            </div>
          )}
        </div>
        <div className={`text-2xl font-bold font-mono mb-0.5 ${highlight ? 'text-amber-400' : 'text-white'}`}>
          {value}
        </div>
        <div className="text-xs text-slate-400">{label}</div>
        {subValue && (
          <div className="mt-1 text-[10px] text-slate-500">{subValue}</div>
        )}
      </div>
    </motion.div>
  );
}

export function StatCards(props: StatCardsProps) {
  const {
    totalScore,
    targetScore,
    occupancyPercent,
    targetOccupancy,
    totalRevenue,
    conflictCount,
    refundCount,
  } = props;

  const scorePassed = totalScore >= targetScore;
  const occupancyPassed = occupancyPercent >= targetOccupancy;
  const scoreDiff = totalScore - targetScore;
  const occupancyDiff = occupancyPercent - targetOccupancy;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="最终得分"
        value={totalScore.toLocaleString()}
        subValue={scorePassed ? `超目标 ${scoreDiff.toLocaleString()}分` : `距目标 ${Math.abs(scoreDiff).toLocaleString()}分`}
        icon={Trophy}
        iconBg="bg-amber-500/20"
        iconColor="text-amber-400"
        highlight={scorePassed}
        trend={scorePassed ? 'up' : 'down'}
      />
      <StatCard
        label="总上座率"
        value={`${occupancyPercent}%`}
        subValue={occupancyPassed ? `超目标 ${occupancyDiff}%` : `距目标 ${Math.abs(occupancyDiff)}%`}
        icon={Users}
        iconBg="bg-emerald-500/20"
        iconColor="text-emerald-400"
        trend={occupancyPassed ? 'up' : 'down'}
      />
      <StatCard
        label="实际收益"
        value={`¥${totalRevenue.toLocaleString()}`}
        subValue="基于核销座位计算"
        icon={DollarSign}
        iconBg="bg-sky-500/20"
        iconColor="text-sky-400"
        trend="neutral"
      />
      <StatCard
        label={`${conflictCount} 冲突 · ${refundCount} 退票`}
        value={conflictCount + refundCount === 0 ? '完美' : '注意'}
        subValue="争议处理数量"
        icon={AlertTriangle}
        iconBg={conflictCount + refundCount === 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}
        iconColor={conflictCount + refundCount === 0 ? 'text-emerald-400' : 'text-rose-400'}
        trend={conflictCount + refundCount === 0 ? 'up' : 'neutral'}
      />
    </div>
  );
}
