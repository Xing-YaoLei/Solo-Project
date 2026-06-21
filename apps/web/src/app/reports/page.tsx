'use client';

import { useState } from 'react';
import { useMonthlyReport } from '@/lib/hooks';
import { CaseType, PaymentStatus } from '@legal/shared';

const caseTypeLabels: Record<CaseType, string> = {
  [CaseType.CIVIL]: '民事',
  [CaseType.CRIMINAL]: '刑事',
  [CaseType.ADMINISTRATIVE]: '行政',
  [CaseType.ARBITRATION]: '仲裁',
  [CaseType.LABOR]: '劳动',
  [CaseType.INTELLECTUAL_PROPERTY]: '知识产权',
  [CaseType.CONTRACT]: '合同',
  [CaseType.TORT]: '侵权',
  [CaseType.FAMILY]: '家事',
  [CaseType.REAL_ESTATE]: '房产',
  [CaseType.CORPORATE]: '公司',
  [CaseType.OTHER]: '其他',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: '未付款',
  [PaymentStatus.PARTIAL]: '部分付款',
  [PaymentStatus.PAID]: '已付款',
  [PaymentStatus.OVERDUE]: '逾期',
  [PaymentStatus.REFUNDED]: '已退款',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: report, loading } = useMonthlyReport(year, month);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 4 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const summaryCards = report
    ? [
        { title: '总案件数', value: String(report.totalCases), color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
        { title: '活跃案件', value: String(report.activeCases), color: 'bg-indigo-50 text-indigo-600', iconBg: 'bg-indigo-100' },
        { title: '已结案', value: String(report.closedCases), color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
        { title: '总应收', value: formatCurrency(report.totalRevenue), color: 'bg-cyan-50 text-cyan-600', iconBg: 'bg-cyan-100' },
        { title: '已回款', value: formatCurrency(report.collectedRevenue), color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
        { title: '未回款', value: formatCurrency(report.outstandingRevenue), color: 'bg-red-50 text-red-600', iconBg: 'bg-red-100' },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">月度报表</h1>
          <p className="text-sm text-slate-500 mt-1">查看案件统计数据和财务报表</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      )}

      {!loading && !report && (
        <div className="text-center py-12 text-slate-400">暂无报表数据</div>
      )}

      {!loading && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-xs font-medium text-slate-500">{card.title}</p>
                <p className={`text-lg font-bold mt-2 ${card.color.split(' ')[1]}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">按案件类型统计</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-5 py-3 font-medium text-slate-500">案件类型</th>
                      <th className="text-right px-5 py-3 font-medium text-slate-500">数量</th>
                      <th className="text-right px-5 py-3 font-medium text-slate-500">应收</th>
                      <th className="text-right px-5 py-3 font-medium text-slate-500">已收</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(report.byCaseType).map(([type, data]) => (
                      <tr key={type} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-700">
                          {caseTypeLabels[type as CaseType] || type}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">{data.count}</td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {formatCurrency(data.revenue)}
                        </td>
                        <td className="px-5 py-3 text-right text-green-600">
                          {formatCurrency(data.collected)}
                        </td>
                      </tr>
                    ))}
                    {Object.keys(report.byCaseType).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">按律师统计</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-5 py-3 font-medium text-slate-500">律师</th>
                      <th className="text-right px-5 py-3 font-medium text-slate-500">案件数</th>
                      <th className="text-right px-5 py-3 font-medium text-slate-500">应收</th>
                      <th className="text-right px-5 py-3 font-medium text-slate-500">已收</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(report.byLawyer).map(([lawyerId, data]) => (
                      <tr key={lawyerId} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-700">{lawyerId}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{data.count}</td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {formatCurrency(data.revenue)}
                        </td>
                        <td className="px-5 py-3 text-right text-green-600">
                          {formatCurrency(data.collected)}
                        </td>
                      </tr>
                    ))}
                    {Object.keys(report.byLawyer).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">按付款状态统计</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">付款状态</th>
                    <th className="text-right px-5 py-3 font-medium text-slate-500">案件数</th>
                    <th className="text-right px-5 py-3 font-medium text-slate-500">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(report.byPaymentStatus).map(([status, data]) => {
                    const statusConfig: Record<string, string> = {
                      UNPAID: 'bg-slate-100 text-slate-600',
                      PARTIAL: 'bg-amber-100 text-amber-700',
                      PAID: 'bg-green-100 text-green-700',
                      OVERDUE: 'bg-red-100 text-red-700',
                      REFUNDED: 'bg-gray-100 text-gray-600',
                    };

                    return (
                      <tr key={status} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              statusConfig[status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {paymentStatusLabels[status as PaymentStatus] || status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">{data.count}</td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {formatCurrency(data.amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {Object.keys(report.byPaymentStatus).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
