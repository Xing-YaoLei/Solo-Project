'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { useDashboardStore } from '@/store/dashboard';
import { DollarSign, FileCheck } from 'lucide-react';

export function WorkorderTrendChart() {
  const { workorderTrend, isLoading } = useDashboardStore();

  if (isLoading || workorderTrend.length === 0) {
    return (
      <div className="h-[340px] animate-pulse rounded-xl border border-industrial-700 bg-industrial-800" />
    );
  }

  const displayData = workorderTrend.slice(-14).map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  const totalRevenue = displayData.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalInsuranceFiled = displayData.reduce((s, d) => s + (d.insurance?.filed || 0), 0);
  const totalInsuranceRejected = displayData.reduce((s, d) => s + (d.insurance?.rejected || 0), 0);

  return (
    <div className="rounded-xl border border-industrial-700 bg-gradient-to-br from-industrial-800/80 to-industrial-900/80 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-white">工单项目趋势</h3>
          <p className="mt-0.5 text-[11px] text-industrial-400">近14天工单数量、完成情况、返修率、收银分账与保险理赔</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-risk-info" />
            <span className="text-industrial-300">总工单</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-risk-success" />
            <span className="text-industrial-300">已完成</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-risk-danger" />
            <span className="text-industrial-300">返修率(%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/80" />
            <span className="text-industrial-300">营收</span>
          </span>
        </div>
      </div>

      {(totalRevenue > 0 || totalInsuranceFiled > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-industrial-700 bg-industrial-900/60 p-3 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-risk-info/15">
              <DollarSign className="h-4 w-4 text-risk-info" />
            </div>
            <div>
              <div className="text-[10px] text-industrial-400">累计营收</div>
              <div className="font-semibold text-white">¥{totalRevenue.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-risk-warning/15">
              <FileCheck className="h-4 w-4 text-risk-warning" />
            </div>
            <div>
              <div className="text-[10px] text-industrial-400">保险报案</div>
              <div className="font-semibold text-white">{totalInsuranceFiled} 件</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-risk-danger/15">
              <FileCheck className="h-4 w-4 text-risk-danger" />
            </div>
            <div>
              <div className="text-[10px] text-industrial-400">保险拒赔</div>
              <div className="font-semibold text-white">{totalInsuranceRejected} 件</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-risk-success/15">
              <FileCheck className="h-4 w-4 text-risk-success" />
            </div>
            <div>
              <div className="text-[10px] text-industrial-400">保险材料项</div>
              <div className="font-semibold text-white">
                {displayData.reduce((s, d) => s + (d.partsFromInsurance || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E29B" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 20]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              labelStyle={{ color: '#94A3B8', marginBottom: '6px' }}
              formatter={(value: number, name: string, props: any) => {
                const labels: Record<string, string> = {
                  total: '总工单',
                  completed: '已完成',
                  reworkRate: '返修率',
                  revenue: '营收',
                };
                const d = props.payload;
                const extra = [];
                if (d.revenueBreakdown) {
                  extra.push(`现金 ¥${d.revenueBreakdown.cash || 0}`);
                  extra.push(`刷卡 ¥${d.revenueBreakdown.card || 0}`);
                  extra.push(`保险 ¥${d.revenueBreakdown.insurance || 0}`);
                }
                if (d.insurance) {
                  extra.push(`保险: ${d.insurance.filed || 0}报/${d.insurance.settled || 0}结/${d.insurance.rejected || 0}拒`);
                }
                if (d.partsFromInsurance) {
                  extra.push(`保险材料: ${d.partsFromInsurance}项`);
                }
                return [
                  name === 'reworkRate' ? `${value}%` : name === 'revenue' ? `¥${Number(value).toLocaleString()}` : value,
                  (labels[name] || name) + (extra.length > 0 && name === 'revenue' ? `\n  ${extra.join(' | ')}` : ''),
                ];
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              fill="url(#revenueGrad)"
              stroke="#F59E0B"
              strokeWidth={1.5}
              opacity={0.5}
            />
            <Bar yAxisId="left" dataKey="total" fill="url(#totalGrad)" radius={[4, 4, 0, 0]} barSize={18} />
            <Bar yAxisId="left" dataKey="completed" fill="url(#completedGrad)" radius={[4, 4, 0, 0]} barSize={18} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="reworkRate"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
