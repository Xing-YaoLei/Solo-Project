'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCases } from '@/lib/hooks';
import { CaseType, CaseStatus, PaymentStatus } from '@legal/shared';
import StatusBadge from '@/components/StatusBadge';

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

const statusLabels: Record<CaseStatus, string> = {
  [CaseStatus.MATERIAL_SUBMITTED]: '材料已提交',
  [CaseStatus.ASSISTANT_REVIEWING]: '助理审核中',
  [CaseStatus.IDENTITY_VERIFIED]: '身份已核验',
  [CaseStatus.CONFLICT_CHECKING]: '冲突检查中',
  [CaseStatus.CONFLICT_PASSED]: '冲突检查通过',
  [CaseStatus.CONFLICT_FAILED]: '冲突检查未通过',
  [CaseStatus.EVIDENCE_REVIEWING]: '证据审查中',
  [CaseStatus.MATERIAL_INCOMPLETE]: '材料不完整',
  [CaseStatus.LAWYER_ASSIGNING]: '律师指派中',
  [CaseStatus.LAWYER_SUPPLEMENTING]: '律师补充中',
  [CaseStatus.CASE_ACTIVE]: '案件进行中',
  [CaseStatus.CASE_CLOSED]: '已结案',
  [CaseStatus.CASE_ARCHIVED]: '已归档',
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  [PaymentStatus.UNPAID]: { label: '未付款', className: 'bg-slate-100 text-slate-600' },
  [PaymentStatus.PARTIAL]: { label: '部分付款', className: 'bg-amber-100 text-amber-700' },
  [PaymentStatus.PAID]: { label: '已付款', className: 'bg-green-100 text-green-700' },
  [PaymentStatus.OVERDUE]: { label: '逾期', className: 'bg-red-100 text-red-700' },
  [PaymentStatus.REFUNDED]: { label: '已退款', className: 'bg-gray-100 text-gray-600' },
};

export default function CasesPage() {
  const [filters, setFilters] = useState<{
    caseType?: CaseType;
    status?: CaseStatus;
    search?: string;
    page: number;
  }>({ page: 1 });

  const { data, loading } = useCases({
    ...filters,
    limit: 10,
  });

  const cases = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">案件管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理所有案件委托</p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          新建委托
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.caseType || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  caseType: (e.target.value as CaseType) || undefined,
                  page: 1,
                })
              }
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="">全部类型</option>
              {Object.entries(caseTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as CaseStatus) || undefined,
                  page: 1,
                })
              }
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="搜索案件名称或编号..."
                value={filters.search || ''}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value || undefined, page: 1 })
                }
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-500">案件编号</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">案件名称</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">案由</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">状态</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">委托人</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">承办律师</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">庭审日期</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">回款状态</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              )}
              {!loading && cases.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    暂无案件数据
                  </td>
                </tr>
              )}
              {cases.map((caseItem) => {
                const paymentConfig = paymentStatusConfig[caseItem.paymentStatus] || {
                  label: caseItem.paymentStatus,
                  className: 'bg-gray-100 text-gray-600',
                };

                return (
                  <tr key={caseItem.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">
                      {caseItem.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {caseItem.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {caseTypeLabels[caseItem.caseType] || caseItem.caseType}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={caseItem.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{caseItem.clientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {caseItem.lawyerName || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {caseItem.nextTrialDate
                        ? new Date(caseItem.nextTrialDate).toLocaleDateString('zh-CN')
                        : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentConfig.className}`}
                      >
                        {paymentConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              共 {total} 条记录，第 {filters.page}/{totalPages} 页
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page <= 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
                disabled={filters.page >= totalPages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
