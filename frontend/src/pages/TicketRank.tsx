import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { BarChart3, PieChart, ChevronDown, ChevronUp, Tag, DollarSign, MapPin, Shield } from 'lucide-react';
import { ticketApi } from '@/api/modules/ticket';
import type { TicketRankItem } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'absolute' | 'ratio';

const MOCK_RANK: TicketRankItem[] = [
  {
    ruleId: 'R001',
    ruleName: '单日全通票',
    ticketType: '标准票',
    price: 299,
    soldCount: 12456,
    soldRatio: 31.2,
    rank: 1,
    purchaseLimit: '每账号限购4张',
    restrictionConditions: '限指定单日使用，不可转让，一经核销不退',
    applicableAreas: 'A区/B区/C区/D区/E区 全场通行',
  },
  {
    ruleId: 'R002',
    ruleName: '双日通票',
    ticketType: '标准票',
    price: 499,
    soldCount: 8934,
    soldRatio: 22.4,
    rank: 2,
    purchaseLimit: '每账号限购2张',
    restrictionConditions: '连续两日有效，每日限入场1次',
    applicableAreas: 'A区/B区/C区/D区/E区 全场通行',
  },
  {
    ruleId: 'R003',
    ruleName: 'VIP尊享票',
    ticketType: 'VIP票',
    price: 1288,
    soldCount: 3456,
    soldRatio: 8.7,
    rank: 3,
    purchaseLimit: '每账号限购1张，需实名认证',
    restrictionConditions: '专属通道入场，VIP休息区，限定纪念品',
    applicableAreas: 'A区主会场前排 / C区VIP休息室 / B区优先',
  },
  {
    ruleId: 'R004',
    ruleName: '早鸟优惠票',
    ticketType: '优惠票',
    price: 199,
    soldCount: 6723,
    soldRatio: 16.8,
    rank: 4,
    purchaseLimit: '每账号限购2张，早鸟期限量',
    restrictionConditions: '早鸟期内购买有效，不退不换',
    applicableAreas: 'A区/B区/D区/E区',
  },
  {
    ruleId: 'R005',
    ruleName: '学生票',
    ticketType: '优惠票',
    price: 149,
    soldCount: 4128,
    soldRatio: 10.3,
    rank: 5,
    purchaseLimit: '每学生限购1张，需持学生证入场',
    restrictionConditions: '入场需核验有效学生证，仅限本人',
    applicableAreas: 'A区/B区/D区/E区',
  },
  {
    ruleId: 'R006',
    ruleName: '家庭套票(2大1小)',
    ticketType: '套票',
    price: 699,
    soldCount: 1876,
    soldRatio: 4.7,
    rank: 6,
    purchaseLimit: '每账号限购1套，儿童限12岁以下',
    restrictionConditions: '需同时入场，儿童需成年人陪同',
    applicableAreas: 'A区/B区/C区/D区/E区 全场通行',
  },
  {
    ruleId: 'R007',
    ruleName: '专业观众票',
    ticketType: '专业票',
    price: 888,
    soldCount: 1234,
    soldRatio: 3.1,
    rank: 7,
    purchaseLimit: '需提交工作证明审核',
    restrictionConditions: '专属商务洽谈区，参加行业论坛',
    applicableAreas: 'A区/B区/C区商务中心',
  },
  {
    ruleId: 'R008',
    ruleName: '展览票(不含主会场)',
    ticketType: '标准票',
    price: 128,
    soldCount: 1123,
    soldRatio: 2.8,
    rank: 8,
    purchaseLimit: '不限购',
    restrictionConditions: '仅B区展览厅、D区户外区可用',
    applicableAreas: 'B区展览厅 / D区户外互动区',
  },
];

const TICKET_COLORS = [
  '#00D4FF',
  '#8B5CF6',
  '#FF8A00',
  '#00E396',
  '#F472B6',
  '#38BDF8',
  '#FBBF24',
  '#A78BFA',
];

export default function TicketRankPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('absolute');
  const [rankData, setRankData] = useState<TicketRankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await ticketApi.getRank().catch(() => MOCK_RANK);
        setRankData([...data].sort((a, b) => b.soldCount - a.soldCount));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const barOption: EChartsOption = useMemo(() => {
    const sorted = [...rankData].sort((a, b) => {
      if (viewMode === 'absolute') return b.soldCount - a.soldCount;
      return b.soldRatio - a.soldRatio;
    });
    const names = sorted.map((d) => d.ruleName);
    const values = sorted.map((d, i) => ({
      value: viewMode === 'absolute' ? d.soldCount : d.soldRatio,
      itemStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: TICKET_COLORS[i % TICKET_COLORS.length] },
            { offset: 1, color: `${TICKET_COLORS[i % TICKET_COLORS.length]}33` },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      ruleId: sorted[i].ruleId,
    })) as any;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontFamily: 'Inter' },
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ axisValue: string; data: { ruleId: string; value: number } }>;
          if (!p || p.length === 0) return '';
          const rule = sorted.find((r) => r.ruleName === p[0].axisValue);
          if (!rule) return '';
          return `
            <div style="padding:4px 2px;font-family:Inter">
              <div style="font-weight:600;font-size:14px;color:#00F0FF;margin-bottom:8px;font-family:'Chakra Petch'">
                排名 #${rule.rank} · ${rule.ruleName}
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">票种类型</span>
                <span style="color:#fff;font-weight:500">${rule.ticketType}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">单价</span>
                <span style="color:#fff;font-weight:500">¥${rule.price.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">销量</span>
                <span style="color:#00D4FF;font-weight:500">${rule.soldCount.toLocaleString()} 张</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">占比</span>
                <span style="color:#8B5CF6;font-weight:500">${rule.soldRatio.toFixed(1)}%</span>
              </div>
              <div style="font-size:11px;color:#FF8A00;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,138,0,0.2)">
                ▸ 点击柱条查看规则详情
              </div>
            </div>
          `;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 20, containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: {
          color: '#94a3b8',
          fontFamily: 'Inter',
          interval: 0,
          rotate: 25,
          fontSize: 11,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: viewMode === 'absolute' ? '销量 (张)' : '占比 (%)',
        nameTextStyle: { color: '#94a3b8', fontFamily: 'Inter' },
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)' } },
      },
      series: [
        {
          type: 'bar',
          barWidth: 40,
          data: values,
          emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 212, 255, 0.5)' } },
        },
      ] as any,
    } as EChartsOption;
  }, [rankData, viewMode]);

  const pieOption: EChartsOption = useMemo(() => {
    const data = rankData.map((d, i) => ({
      name: d.ruleName,
      value: viewMode === 'absolute' ? d.soldCount : d.soldRatio,
      itemStyle: { color: TICKET_COLORS[i % TICKET_COLORS.length] },
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontFamily: 'Inter' },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `
            <div style="padding:4px 2px;font-family:Inter">
              <div style="font-weight:600;font-size:13px;color:#00F0FF;margin-bottom:6px;font-family:'Chakra Petch'">
                ${p.name}
              </div>
              <div style="font-size:12px;margin:3px 0;color:#94a3b8">
                ${viewMode === 'absolute' ? `销量: <b style="color:#fff">${p.value.toLocaleString()}</b>` : `占比: <b style="color:#fff">${p.value.toFixed(1)}%</b>`}
              </div>
              <div style="font-size:12px;margin:3px 0;color:#94a3b8">
                占比: <b style="color:#8B5CF6">${p.percent.toFixed(1)}%</b>
              </div>
            </div>
          `;
        },
      },
      legend: {
        orient: 'vertical',
        right: 5,
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        textStyle: { color: '#94a3b8', fontFamily: 'Inter', fontSize: 11 },
        formatter: (name: string) => {
          const item = rankData.find((r) => r.ruleName === name);
          return item ? `${name.substring(0, 8)}${name.length > 8 ? '…' : ''}` : name;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['32%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#061229',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, color: '#fff', fontFamily: 'Inter', fontWeight: 600 },
            scale: true,
            scaleSize: 8,
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 212, 255, 0.4)' },
          },
          labelLine: { show: false },
          data,
        },
      ] as any,
    } as EChartsOption;
  }, [rankData, viewMode]);

  const totalSold = useMemo(() => rankData.reduce((s, r) => s + r.soldCount, 0), [rankData]);
  const totalRevenue = useMemo(
    () => rankData.reduce((s, r) => s + r.soldCount * r.price, 0),
    [rankData]
  );

  const handleChartClick = (e: unknown) => {
    const ev = e as { data?: { ruleId?: string } };
    if (ev.data?.ruleId) {
      setExpandedRuleId((prev) => (prev === ev.data!.ruleId ? null : ev.data!.ruleId));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="panel-header flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="panel-title glow-text">票种排行</h2>
            {loading && <span className="chip chip-active animate-pulse">加载中…</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm text-white/60">
              <div>
                总销量：
                <span className="font-display font-bold text-white ml-1">
                  {totalSold.toLocaleString()}
                </span>
              </div>
              <div>
                总营收：
                <span className="font-display font-bold text-cyan-glow ml-1">
                  ¥{totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex rounded-lg border border-panel-border p-1 bg-ocean-dark/40 shadow-glow-cyan/30">
              <button
                onClick={() => setViewMode('absolute')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'absolute'
                    ? 'bg-cyan-primary/20 text-cyan-glow shadow-glow-cyan border border-cyan-primary/40 -m-[1px]'
                    : 'text-white/60 hover:text-white/90'
                )}
              >
                <BarChart3 size={16} />
                绝对值
              </button>
              <button
                onClick={() => setViewMode('ratio')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'ratio'
                    ? 'bg-purple-sponsor/20 text-purple-200 shadow-glow-purple border border-purple-sponsor/40 -m-[1px]'
                    : 'text-white/60 hover:text-white/90'
                )}
              >
                <PieChart size={16} />
                占比
              </button>
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-8">
              <div className="h-[420px] w-full">
                <ReactECharts
                  option={barOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                  onEvents={{ click: handleChartClick }}
                />
              </div>
              {expandedRuleId && (() => {
                const rule = rankData.find((r) => r.ruleId === expandedRuleId);
                if (!rule) return null;
                return (
                  <div className="mt-5 rounded-xl border border-cyan-primary/40 bg-cyan-primary/5 shadow-glow-cyan animate-fade-in overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-primary/20 bg-cyan-primary/10">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-cyan-primary/20 border border-cyan-primary/40 flex items-center justify-center text-cyan-glow font-display font-bold">
                          #{rule.rank}
                        </span>
                        <div>
                          <div className="font-display font-semibold text-white">{rule.ruleName}</div>
                          <div className="text-xs text-white/50">{rule.ruleId} · {rule.ticketType}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedRuleId(null)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {expandedRuleId === rule.ruleId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border border-panel-border bg-panel-bg/40 p-4">
                        <div className="flex items-center gap-2 text-white/70 font-medium mb-3">
                          <DollarSign size={16} className="text-green-success" />
                          价格 / 限购
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white/50">单价</span>
                            <span className="text-cyan-glow font-display font-bold text-lg">¥{rule.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">累计销量</span>
                            <span className="text-white font-medium">{rule.soldCount.toLocaleString()} 张</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">占比</span>
                            <span className="text-purple-sponsor font-medium">{rule.soldRatio.toFixed(1)}%</span>
                          </div>
                          <div className="pt-2 border-t border-white/5 mt-2">
                            <div className="text-white/50 mb-1">限购规则</div>
                            <div className="text-white/85 leading-relaxed">{rule.purchaseLimit}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-panel-border bg-panel-bg/40 p-4">
                        <div className="flex items-center gap-2 text-white/70 font-medium mb-3">
                          <Shield size={16} className="text-orange-warning" />
                          限制条件
                        </div>
                        <p className="text-white/85 leading-relaxed">{rule.restrictionConditions}</p>
                      </div>
                      <div className="rounded-lg border border-panel-border bg-panel-bg/40 p-4 md:col-span-2">
                        <div className="flex items-center gap-2 text-white/70 font-medium mb-3">
                          <MapPin size={16} className="text-cyan-primary" />
                          适用区域
                        </div>
                        <p className="text-white/85 leading-relaxed">{rule.applicableAreas}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="h-[420px] w-full">
                <ReactECharts
                  option={pieOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">票种规则明细表</h2>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-cyan-primary" />
            <span className="text-xs text-white/50">共 {rankData.length} 条规则</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel-border bg-ocean-dark/60 text-white/60 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">排名</th>
                <th className="px-5 py-3 text-left font-medium">规则名称</th>
                <th className="px-5 py-3 text-left font-medium">票种类型</th>
                <th className="px-5 py-3 text-right font-medium">单价</th>
                <th className="px-5 py-3 text-right font-medium">销量</th>
                <th className="px-5 py-3 text-right font-medium">占比</th>
                <th className="px-5 py-3 text-left font-medium">限购</th>
                <th className="px-5 py-3 text-left font-medium">适用区域</th>
              </tr>
            </thead>
            <tbody>
              {rankData.map((r, i) => (
                <tr
                  key={r.ruleId}
                  className={cn(
                    'border-b border-panel-border/40 transition-colors',
                    i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]',
                    expandedRuleId === r.ruleId ? 'bg-cyan-primary/10' : 'hover:bg-white/[0.04]',
                  )}
                >
                  <td className="px-5 py-3">
                    <span className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-cyan-primary/20 border border-cyan-primary/30 text-cyan-glow font-display font-bold text-xs">
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-white">{r.ruleName}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-medium border"
                      style={{
                        color: TICKET_COLORS[i % TICKET_COLORS.length],
                        borderColor: `${TICKET_COLORS[i % TICKET_COLORS.length]}55`,
                        backgroundColor: `${TICKET_COLORS[i % TICKET_COLORS.length]}15`,
                      }}
                    >
                      {r.ticketType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-display font-semibold text-cyan-glow">
                    ¥{r.price}
                  </td>
                  <td className="px-5 py-3 text-right text-white font-medium">
                    {r.soldCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-purple-200 font-medium">
                    {r.soldRatio.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3 text-white/70 text-xs max-w-[180px] truncate" title={r.purchaseLimit}>
                    {r.purchaseLimit}
                  </td>
                  <td className="px-5 py-3 text-white/70 text-xs max-w-[220px] truncate" title={r.applicableAreas}>
                    {r.applicableAreas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
