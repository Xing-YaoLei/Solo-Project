'use client';

import Link from 'next/link';
import { useCases } from '@/lib/hooks';
import { CaseStatus, TimelineEventType } from '@legal/shared';

const summaryCards = [
  {
    title: '待审核案件数',
    value: '12',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-600',
    iconBg: 'bg-amber-100',
  },
  {
    title: '进行中案件数',
    value: '38',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-600',
    iconBg: 'bg-blue-100',
  },
  {
    title: '本月回款',
    value: '¥128,500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: 'bg-green-50 text-green-600',
    iconBg: 'bg-green-100',
  },
  {
    title: '冲突检查待办',
    value: '5',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'bg-red-50 text-red-600',
    iconBg: 'bg-red-100',
  },
];

const recentEvents = [
  { type: TimelineEventType.CASE_CREATED, title: '新建案件委托', content: '张三诉李四合同纠纷案已提交', time: '10分钟前', operator: '王律师' },
  { type: TimelineEventType.CONFLICT_CHECK_PASSED, title: '冲突检查通过', content: '案件A-2024-0015冲突检查已通过', time: '30分钟前', operator: '系统' },
  { type: TimelineEventType.MATERIAL_INCOMPLETE_NOTICE, title: '材料不完整通知', content: '案件A-2024-0013缺少授权委托书', time: '1小时前', operator: '刘助理' },
  { type: TimelineEventType.LAWYER_ASSIGNED, title: '律师已指派', content: '陈律师已承接案件A-2024-0012', time: '2小时前', operator: '管理员' },
  { type: TimelineEventType.TRIAL_SCHEDULED, title: '庭审已排期', content: '案件A-2024-0010庭审日期：2024年8月15日', time: '3小时前', operator: '陈律师' },
  { type: TimelineEventType.CASE_CLOSED, title: '案件已结案', content: '案件A-2024-0008已结案', time: '5小时前', operator: '陈律师' },
];

const eventTypeColors: Record<string, string> = {
  [TimelineEventType.CASE_CREATED]: 'border-blue-400 bg-blue-50',
  [TimelineEventType.CONFLICT_CHECK_PASSED]: 'border-green-400 bg-green-50',
  [TimelineEventType.MATERIAL_INCOMPLETE_NOTICE]: 'border-orange-400 bg-orange-50',
  [TimelineEventType.LAWYER_ASSIGNED]: 'border-violet-400 bg-violet-50',
  [TimelineEventType.TRIAL_SCHEDULED]: 'border-sky-400 bg-sky-50',
  [TimelineEventType.CASE_CLOSED]: 'border-slate-400 bg-slate-50',
};

export default function DashboardPage() {
  const { data: casesData } = useCases({ limit: 5 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
          <p className="text-sm text-slate-500 mt-1">欢迎回来，管理员</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg} ${card.color.split(' ')[1]}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-3">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">最近动态</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEvents.map((event, index) => (
              <div
                key={index}
                className={`px-5 py-3.5 flex items-start gap-3 border-l-4 ${eventTypeColors[event.type] || 'border-slate-300 bg-slate-50'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.content}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{event.time}</p>
                  <p className="text-xs text-slate-400">{event.operator}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">待处理案件</h2>
            <Link href="/cases" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              查看全部 →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(casesData?.items || []).map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/cases/${caseItem.id}`}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{caseItem.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{caseItem.clientName}</p>
                </div>
                <span
                  className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${
                    caseItem.status === CaseStatus.ASSISTANT_REVIEWING
                      ? 'bg-indigo-100 text-indigo-700'
                      : caseItem.status === CaseStatus.CONFLICT_CHECKING
                      ? 'bg-amber-100 text-amber-700'
                      : caseItem.status === CaseStatus.MATERIAL_INCOMPLETE
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {caseItem.status === CaseStatus.ASSISTANT_REVIEWING && '助理审核中'}
                  {caseItem.status === CaseStatus.CONFLICT_CHECKING && '冲突检查中'}
                  {caseItem.status === CaseStatus.MATERIAL_INCOMPLETE && '材料不完整'}
                  {caseItem.status === CaseStatus.LAWYER_ASSIGNING && '律师指派中'}
                </span>
              </Link>
            ))}
            {!casesData?.items?.length && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无待处理案件</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
