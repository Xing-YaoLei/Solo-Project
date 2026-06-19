'use client';

import { Gauge, Package, AlertTriangle, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, ReceiptText, FileX } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';

interface CardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  gradient: string;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
  pulse?: boolean;
  footer?: React.ReactNode;
}

function StatCard({ icon, title, value, subtitle, gradient, iconBg, trend, pulse, footer }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-industrial-700 p-5 ${gradient} transition-all hover:scale-[1.02] hover:shadow-2xl`}
      style={{ animationDelay: `${Math.random() * 0.3}s` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-industrial-200/80">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`font-display text-3xl font-bold text-white ${pulse ? 'animate-pulse' : ''}`}>
              {value}
            </span>
            {trend && (
              <span className={`flex items-center text-xs ${trend === 'up' ? 'text-risk-danger' : trend === 'down' ? 'text-risk-success' : 'text-industrial-300'}`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-industrial-300">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      {footer && (
        <div className="mt-3 border-t border-industrial-700/60 pt-2 text-[11px] text-industrial-300">
          {footer}
        </div>
      )}
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
    </div>
  );
}

export function WarningCards() {
  const { dashboardData, isLoading } = useDashboardStore();

  if (isLoading || !dashboardData) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-industrial-700 bg-industrial-800" />
        ))}
      </div>
    );
  }

  const { warnings, reworkRate } = dashboardData;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={<Gauge className="h-5 w-5 text-risk-warning" />}
        title="工位过载预警"
        value={warnings.overloadedStations}
        subtitle="个工位负载超过 85%"
        gradient="bg-gradient-to-br from-orange-950/60 via-industrial-800 to-industrial-900"
        iconBg="bg-risk-warning/20"
        trend="up"
        pulse={warnings.overloadedStations > 0}
      />
      <StatCard
        icon={<Package className="h-5 w-5 text-risk-danger" />}
        title="库存缺口"
        value={warnings.inventoryGaps}
        subtitle="类配件低于安全阈值"
        gradient="bg-gradient-to-br from-red-950/60 via-industrial-800 to-industrial-900"
        iconBg="bg-risk-danger/20"
        trend="up"
        pulse={warnings.inventoryGaps > 0}
      />
      <StatCard
        icon={<AlertTriangle className="h-5 w-5 text-risk-warning" />}
        title="质检异常"
        value={warnings.qualityAnomalies}
        subtitle="件发现质量问题（含保险拒赔/收银异常）"
        gradient="bg-gradient-to-br from-amber-950/60 via-industrial-800 to-industrial-900"
        iconBg="bg-risk-warning/20"
      />
      <StatCard
        icon={<RotateCcw className={`h-5 w-5 ${warnings.reworkRateAlert ? 'text-risk-danger' : 'text-risk-success'}`} />}
        title="返修率"
        value={`${reworkRate.value}%`}
        subtitle={`阈值 ${reworkRate.threshold}% · ${warnings.reworkRateAlert ? '超标！' : '正常范围'}`}
        gradient={warnings.reworkRateAlert
          ? 'bg-gradient-to-br from-red-950/60 via-industrial-800 to-industrial-900'
          : 'bg-gradient-to-br from-emerald-950/40 via-industrial-800 to-industrial-900'}
        iconBg={warnings.reworkRateAlert ? 'bg-risk-danger/20' : 'bg-risk-success/20'}
        pulse={warnings.reworkRateAlert}
        footer={
          reworkRate.insuranceReworkShare !== undefined && (
            <span>
              保险关联返修：<strong className="text-white">{reworkRate.insuranceReworkedCount || 0}</strong> 件
              （占 <strong className="text-white">{reworkRate.insuranceReworkShare}%</strong>）
            </span>
          )
        }
      />
      <StatCard
        icon={<FileX className="h-5 w-5 text-risk-danger" />}
        title="保险拒赔率"
        value={`${warnings.insuranceRejectRate || 0}%`}
        subtitle="近30天保险理赔被驳回占比"
        gradient="bg-gradient-to-br from-rose-950/60 via-industrial-800 to-industrial-900"
        iconBg="bg-risk-danger/20"
        pulse={(warnings.insuranceRejectRate || 0) > 10}
      />
      <StatCard
        icon={<ReceiptText className="h-5 w-5 text-risk-warning" />}
        title="收银异常"
        value={warnings.cashierAnomalyCount || 0}
        subtitle="笔异常交易（负数/保险未结算即刷卡）"
        gradient="bg-gradient-to-br from-yellow-950/50 via-industrial-800 to-industrial-900"
        iconBg="bg-risk-warning/20"
        pulse={(warnings.cashierAnomalyCount || 0) > 0}
      />
    </div>
  );
}
