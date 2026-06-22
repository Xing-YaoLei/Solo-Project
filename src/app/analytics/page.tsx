'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RCTooltip,
  CartesianGrid,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area,
} from 'recharts';
import { useSession } from '@/store/session';
import { mockData } from '@/lib/mock-data';
import { ChartCard } from '@/components/ui/ChartCard';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

const AUDIENCE_OPTIONS = [
  { key: 'ALL', label: '全局数据' },
  { key: 'LAST_30', label: '近 30 天' },
  { key: 'LAST_90', label: '近 90 天' },
] as const;

const CLOSE_LEGEND = [
  { name: '已完成整改', color: '#2563eb' },
  { name: '风险豁免', color: '#0ea5e9' },
  { name: '升级/合并', color: '#10b981' },
];

export default function AnalyticsPage() {
  const { user } = useSession();
  const [audience, setAudience] = useState<(typeof AUDIENCE_OPTIONS)[number]['key']>('ALL');
  const [baseAudits, setBaseAudits] = useState<ReturnType<
    (typeof mockData)['audits']['list']
  >['items']>([]);

  useEffect(() => {
    if (!user) return;
    const { items } = mockData.audits.list({
      userId: user.id,
      role: user.role,
      page: 1,
      pageSize: 1000,
    });
    let list = items;
    if (audience === 'LAST_30') {
      const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
      list = list.filter((a) => +new Date(a.createdAt) >= cutoff);
    } else if (audience === 'LAST_90') {
      const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
      list = list.filter((a) => +new Date(a.createdAt) >= cutoff);
    }
    setBaseAudits(list);
  }, [user, audience]);

  const dispatchData = useMemo(
    () => mockData.analytics.dispatchRules(baseAudits),
    [baseAudits],
  );
  const funnelData = useMemo(() => mockData.analytics.funnel(baseAudits), [baseAudits]);
  const reviewData = useMemo(
    () => mockData.analytics.reviewComments(baseAudits),
    [baseAudits],
  );
  const closeData = useMemo(
    () => mockData.analytics.closeReasons(baseAudits),
    [baseAudits],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setAudience(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                audience === opt.key
                  ? 'bg-brand-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          覆盖 <span className="font-mono font-semibold text-slate-700">{baseAudits.length}</span>{' '}
          条整改项
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="派工规则分布"
          description="各派工规则项下整改项数量与占比"
        >
          <div className="flex items-center gap-6 h-64">
            <div className="w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dispatchData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {dispatchData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RCTooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.92)',
                      border: 'none',
                      borderRadius: 10,
                      color: '#f8fafc',
                      fontSize: 12,
                      padding: '10px 12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {dispatchData.map((d, i) => {
                const sum = dispatchData.reduce((s, x) => s + x.value, 0);
                const pct = sum ? ((d.value / sum) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={d.name}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">
                      {d.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500 w-20 text-right">
                      {d.value} 项 · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="处理时限漏斗"
          description="创建 → 派工 → 整改 → 待复核 → 已关闭各阶段转化（单位：项）"
        >
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart width={400} height={250}>
                <RCTooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.92)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 12,
                    padding: '10px 12px',
                  }}
                  formatter={(value: number, _n: any, p: { payload?: { avgHours?: number } }) => {
                    const payload = p.payload as { avgHours?: number } | undefined;
                    return [
                      `${value} 项${
                        payload?.avgHours ? ` · 平均耗时 ${payload.avgHours}h` : ''
                      }`,
                      '规模',
                    ];
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                  animationDuration={800}
                >
                  {funnelData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#10b981'][index]}
                    />
                  ))}
                  <LabelList
                    position="right"
                    fill="#0f172a"
                    stroke="none"
                    dataKey="stage"
                    fontSize={12}
                    fontWeight={500}
                  />
                  <LabelList
                    position="center"
                    fill="#ffffff"
                    stroke="none"
                    dataKey="value"
                    fontSize={13}
                    fontWeight={600}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="复核意见排行"
          description="复核不通过常见原因 Top N（次数越高需重点治理）"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={reviewData}
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="reason"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={130}
                />
                <RCTooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    background: 'rgba(15,23,42,0.92)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 12,
                    padding: '10px 12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  animationDuration={800}
                  fill="url(#barGradient)"
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="关闭原因变化"
          description="近 12 周各关闭原因的周变化趋势（堆叠面积）"
          right={
            <div className="flex items-center gap-3 flex-wrap">
              {CLOSE_LEGEND.map((it) => (
                <div key={it.name} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: it.color }}
                  />
                  {it.name}
                </div>
              ))}
            </div>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={closeData}
                margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="close_completed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="close_waived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="close_escalated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <RCTooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.92)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 12,
                    padding: '10px 12px',
                  }}
                  labelStyle={{ color: '#cbd5e1', marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  name="已完成整改"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#close_completed)"
                  animationDuration={800}
                />
                <Area
                  type="monotone"
                  stackId="1"
                  dataKey="waived"
                  name="风险豁免"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#close_waived)"
                  animationDuration={800}
                />
                <Area
                  type="monotone"
                  stackId="1"
                  dataKey="escalated"
                  name="升级/合并"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#close_escalated)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
