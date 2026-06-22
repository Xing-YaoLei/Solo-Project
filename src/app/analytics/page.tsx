import { redirect } from 'next/navigation';
import { getAnalytics } from '@/app/actions/analytics';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  DispatchPieChart,
  StatusFunnelChart,
  ReviewCommentsBarChart,
  CloseReasonsAreaChart,
} from '@/components/charts/AnalyticsCharts';
import { cn, formatNumber } from '@/lib/utils';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const rangeDays = searchParams.range === '30' ? 30 : searchParams.range === '90' ? 90 : 0;
  try {
    const { user, dispatch, funnel, comments, closeReasons } = await getAnalytics(rangeDays);
    if (user.role === 'EXECUTOR') redirect('/my-tasks');

    return (
      <div className="p-6 space-y-6 animate-slide-up">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              { k: '', label: '全局数据' },
              { k: '30', label: '近 30 天' },
              { k: '90', label: '近 90 天' },
            ].map((t) => (
              <a
                key={t.k}
                href={`/analytics${t.k ? `?range=${t.k}` : ''}`}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-medium transition',
                  (searchParams.range ?? '') === t.k
                    ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-800',
                )}
              >
                {t.label}
              </a>
            ))}
          </div>
          <div className="text-xs text-slate-400 ml-auto">
            覆盖 <span className="font-mono text-slate-600">{dispatch.reduce((s, d) => s + d.value, 0)}</span> 条整改项
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard title="派工规则分布" description="各派工规则项下整改项数量与占比">
            <DispatchPieChart data={dispatch} />
          </ChartCard>

          <ChartCard
            title="处理时限漏斗"
            description="创建 → 派工 → 整改 → 待复核 → 已关闭各阶段转化（单位：项）"
          >
            <StatusFunnelChart data={funnel} />
          </ChartCard>

          <ChartCard
            title="复核意见排行"
            description="复核不通过常见原因 Top N（次数越高需重点治理）"
          >
            <ReviewCommentsBarChart data={comments} />
          </ChartCard>

          <ChartCard
            title="关闭原因变化"
            description="近 12 周各关闭原因的周变化趋势（堆叠面积）"
          >
            <CloseReasonsAreaChart reasons={closeReasons.reasons} weeks={closeReasons.weeks} />
          </ChartCard>
        </div>
      </div>
    );
  } catch (e: any) {
    if (e.message?.includes('无权')) redirect('/my-tasks?forbidden=analytics');
    throw e;
  }
}
