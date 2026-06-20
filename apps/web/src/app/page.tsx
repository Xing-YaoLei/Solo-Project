'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Ticket, DollarSign, AlertTriangle, HandCoins,
  QrCode, CalendarDays, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { fmtMoney, fmtPercent, fmtDateTime, cn, STATUS_STYLES, LABELS } from '@/lib/utils';
import Link from 'next/link';

const SEVERITY_COLORS: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
const EXCEPTION_TYPE_COLORS: Record<string, string> = {
  REFUND_DISPUTE: '#6366f1', DOUBLE_PAYMENT: '#ec4899', SEAT_CONFLICT: '#14b8a6',
  CHECKIN_ABNORMAL: '#8b5cf6', SYSTEM_ERROR: '#ef4444', OTHER: '#64748b',
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/overview')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">加载中...</div>;

  const kpis = data?.kpis || {};
  const kpiCards = [
    { label: '总销售额', value: fmtMoney(kpis.totalRevenue), unit: '元', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
    { label: '已售票数', value: kpis.totalSold?.toLocaleString() || 0, unit: '张 / ' + (kpis.totalStock?.toLocaleString() || 0) + ' 库存', icon: Ticket, color: 'from-brand-500 to-brand-700' },
    { label: '销售率', value: fmtPercent(kpis.soldRate || 0), unit: '售出/库存', icon: TrendingUp, color: 'from-blue-500 to-indigo-600' },
    { label: '订单数', value: kpis.totalOrders?.toLocaleString() || 0, unit: '已支付 ' + (kpis.paidOrders || 0), icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: '核销率', value: fmtPercent(kpis.checkInRate || 0), unit: '已核销 ' + (kpis.checkedIn || 0) + '/' + (kpis.totalCheckIns || 0), icon: QrCode, color: 'from-amber-500 to-orange-600' },
    { label: '赞助总额', value: fmtMoney(kpis.totalSponsorAmount), unit: (kpis.totalSponsors || 0) + ' 家', icon: HandCoins, color: 'from-pink-500 to-rose-600' },
    { label: '待处理异常', value: kpis.openExceptionCount || 0, unit: '总异常 ' + (kpis.exceptionCount || 0), icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
    { label: '活动总数', value: kpis.totalActivities || 0, unit: '进行中活动', icon: CalendarDays, color: 'from-slate-500 to-slate-700' },
  ];

  const orderDistribution = Object.entries(data?.orderStatusDistribution || {})
    .map(([k, v]) => ({ name: LABELS.OrderStatus[k] || k, value: v as number }));
  const ticketSales = (data?.ticketSales || []).map((t: any) => ({
    name: t.name, 已售: t.sold, 剩余: Math.max(0, t.stock - t.sold),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">运营总览</h1>
          <p className="text-sm text-slate-500 mt-1">活动票务整体运营数据实时看板</p>
        </div>
        <div className="text-xs text-slate-400">数据每 30 秒自动刷新 · {fmtDateTime(new Date())}</div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{k.label}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{k.value}</span>
                  {k.unit && <span className="text-xs text-slate-500">{k.unit}</span>}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center`}>
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title !mb-0">票种销售分布</div>
            <Link href="/ticket-types" className="text-sm text-brand-600 hover:underline flex items-center">
              管理 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={ticketSales} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="已售" stackId="a" fill="#0ea5e9" />
                <Bar dataKey="剩余" stackId="a" fill="#e2e8f0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title !mb-0">订单状态</div>
            <Link href="/orders" className="text-sm text-brand-600 hover:underline flex items-center">
              订单管理 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-72">
            {orderDistribution.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={orderDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}:${value}`}
                  >
                    {orderDistribution.map((e, i) => (
                      <Cell key={i} fill={['#0ea5e9', '#6366f1', '#10b981', '#94a3b8', '#f59e0b', '#8b5cf6', '#ef4444'][i % 7]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">暂无数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title !mb-0 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              最新异常单
            </div>
            <Link href="/exceptions" className="text-sm text-brand-600 hover:underline flex items-center">
              全部异常 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.recentExceptions || []).length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm">暂无异常，很棒！</div>
            )}
            {(data?.recentExceptions || []).map((e: any) => {
              const typeColor = EXCEPTION_TYPE_COLORS[e.type] || '#64748b';
              const sevColor = SEVERITY_COLORS[e.severity] || '#64748b';
              return (
                <Link key={e.id} href={`/exceptions/${e.id}`} className="block p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: typeColor }} />
                      <div className="text-sm font-medium text-slate-900">{e.exceptionNo} · {e.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_STYLES[e.status]} style={{ background: sevColor + '20', color: sevColor }}>
                        {LABELS.Severity[e.severity] || e.severity}
                      </span>
                      <span className={STATUS_STYLES[e.status] || 'badge bg-slate-100 text-slate-600'}>
                        {LABELS.ExceptionStatus[e.status] || e.status}
                      </span>
                      <span className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title !mb-0">快捷操作</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '新建订单', href: '/orders/new', icon: Ticket },
              { label: '签到核销', href: '/check-in', icon: QrCode },
              { label: '座位图', href: '/seats', icon: CalendarDays },
              { label: '创建异常单', href: '/exceptions/new', icon: AlertTriangle },
              { label: '赞助清单', href: '/sponsors', icon: HandCoins },
              { label: '导出报表', href: '/exports', icon: TrendingUp },
            ].map((it) => (
              <Link
                key={it.label}
                href={it.href}
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors flex items-center justify-center mb-2">
                  <it.icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium text-slate-800">{it.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
