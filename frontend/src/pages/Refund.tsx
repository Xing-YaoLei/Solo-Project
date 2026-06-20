import { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  X, FileX, AlertOctagon, Gauge, CheckSquare,
  User, CreditCard, ScanLine, Clock, CheckCircle2,
  ShoppingCart, ShieldAlert, BadgeCheck, Ban,
} from 'lucide-react';
import { refundApi } from '@/api/modules/refund';
import type {
  RefundDistributionPoint,
  RefundSample,
  RefundSummary,
  DisputedPointMeta,
  OperationLog,
} from '@/types';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const MOCK_SUMMARY: RefundSummary = {
  totalCount: 1287,
  totalAmount: 386100,
  disputedCount: 87,
  disputedResolutionRate: 73.6,
};

const MOCK_DISTRIBUTION: RefundDistributionPoint[] = [
  { date: '06-15', refundCount: 142, refundAmount: 42600, disputedCount: 8, disputedPoints: [
    { id: 'd1', refundId: 'RF20260615001', reason: '已核销但声称未入场', isDisputed: true, amount: 299 },
    { id: 'd2', refundId: 'RF20260615002', reason: '退票金额争议', isDisputed: true, amount: 499 },
  ]},
  { date: '06-16', refundCount: 168, refundAmount: 50400, disputedCount: 11, disputedPoints: [
    { id: 'd3', refundId: 'RF20260616001', reason: 'VIP权益未兑现', isDisputed: true, amount: 1288 },
    { id: 'd4', refundId: 'RF20260616002', reason: '强制收取服务费', isDisputed: true, amount: 299 },
    { id: 'd5', refundId: 'RF20260616003', reason: '退票到账延迟', isDisputed: true, amount: 499 },
  ]},
  { date: '06-17', refundCount: 135, refundAmount: 40500, disputedCount: 6, disputedPoints: [
    { id: 'd6', refundId: 'RF20260617001', reason: '重复扣款', isDisputed: true, amount: 888 },
  ]},
  { date: '06-18', refundCount: 198, refundAmount: 59400, disputedCount: 15, disputedPoints: [
    { id: 'd7', refundId: 'RF20260618001', reason: '活动取消但未全额退', isDisputed: true, amount: 699 },
    { id: 'd8', refundId: 'RF20260618002', reason: '虚假宣传权益不符', isDisputed: true, amount: 1288 },
    { id: 'd9', refundId: 'RF20260618003', reason: '已退票但仍收到催款', isDisputed: true, amount: 299 },
  ]},
  { date: '06-19', refundCount: 234, refundAmount: 70200, disputedCount: 19, disputedPoints: [
    { id: 'd10', refundId: 'RF20260619001', reason: '退票手续费过高', isDisputed: true, amount: 499 },
    { id: 'd11', refundId: 'RF20260619002', reason: '工作人员态度恶劣', isDisputed: true, amount: 299 },
    { id: 'd12', refundId: 'RF20260619003', reason: '订单被恶意退款', isDisputed: true, amount: 1288 },
    { id: 'd13', refundId: 'RF20260619004', reason: '套票拆分退款遭拒', isDisputed: true, amount: 699 },
  ]},
  { date: '06-20', refundCount: 221, refundAmount: 66300, disputedCount: 17, disputedPoints: [
    { id: 'd14', refundId: 'RF20260620001', reason: '现场环境与宣传不符', isDisputed: true, amount: 499 },
    { id: 'd15', refundId: 'RF20260620002', reason: '票号错误无法入场', isDisputed: true, amount: 888 },
  ]},
  { date: '06-21', refundCount: 189, refundAmount: 56700, disputedCount: 11, disputedPoints: [
    { id: 'd16', refundId: 'RF20260621001', reason: '临时有事要求全额退', isDisputed: true, amount: 299 },
    { id: 'd17', refundId: 'RF20260621002', reason: '学生票核验不通过', isDisputed: true, amount: 149 },
  ]},
];

const MOCK_SAMPLES: Record<string, RefundSample> = {
  d1: {
    id: 'RF20260615001',
    paymentId: 'PAY20260610001234',
    registrationId: 'REG20260610001',
    registrantName: '李明',
    registrantPhone: '138****8812',
    ticketType: '单日全通票',
    originalAmount: 299,
    refundAmount: 299,
    reason: '已核销但声称未入场',
    isDisputed: true,
    disputeNote: '用户声称当天未入场，但闸机记录显示09:45已核销，面部识别比对通过',
    refundedAt: '2026-06-15 18:23:45',
    orderNo: 'ORD20260610002341',
    paymentChannel: '微信支付',
    paidAt: '2026-06-10 14:32:10',
    gateRecord: {
      gateNo: 'GATE-01',
      checkinTime: '2026-06-15 09:45:32',
      deviceId: 'DEV-G01-007',
      status: '已核销',
    },
    operationLogs: [
      { stage: '订单创建', time: '2026-06-10 14:30:05', operator: '系统' },
      { stage: '支付完成', time: '2026-06-10 14:32:10', operator: '微信支付', note: '支付单号 PAY20260610001234' },
      { stage: '核销申请', time: '2026-06-15 09:45:32', operator: 'GATE-01闸机', note: '人脸识别通过' },
      { stage: '退票申请', time: '2026-06-15 17:55:12', operator: '用户本人', note: '声称未到场' },
      { stage: '退票争议发起', time: '2026-06-15 18:05:30', operator: '用户本人', note: '对系统判定有异议' },
    ],
    processed: false,
  },
  d2: {
    id: 'RF20260615002',
    paymentId: 'PAY20260611000876',
    registrationId: 'REG20260611002',
    registrantName: '王芳',
    registrantPhone: '139****3344',
    ticketType: '双日通票',
    originalAmount: 499,
    refundAmount: 399,
    reason: '退票金额争议',
    isDisputed: true,
    disputeNote: '用户认为应全额退款，根据规则已使用1天需扣除20%手续费',
    refundedAt: '2026-06-15 20:10:22',
    orderNo: 'ORD20260611001876',
    paymentChannel: '支付宝',
    paidAt: '2026-06-11 09:15:44',
    gateRecord: {
      gateNo: 'GATE-02',
      checkinTime: '2026-06-14 10:22:18',
      deviceId: 'DEV-G02-003',
      status: '已核销',
    },
    operationLogs: [
      { stage: '订单创建', time: '2026-06-11 09:12:00', operator: '系统' },
      { stage: '支付完成', time: '2026-06-11 09:15:44', operator: '支付宝', note: '支付单号 PAY20260611000876' },
      { stage: '核销申请', time: '2026-06-14 10:22:18', operator: 'GATE-02闸机', note: '第一日入场' },
      { stage: '退票申请', time: '2026-06-15 16:40:00', operator: '用户本人', note: '第二日无法前往' },
      { stage: '退票争议发起', time: '2026-06-15 19:55:00', operator: '用户本人', note: '不认可手续费' },
    ],
    processed: false,
  },
  d3: {
    id: 'RF20260616001',
    paymentId: 'PAY20260605000111',
    registrationId: 'REG20260605003',
    registrantName: '张伟',
    registrantPhone: '137****9988',
    ticketType: 'VIP尊享票',
    originalAmount: 1288,
    refundAmount: 1288,
    reason: 'VIP权益未兑现',
    isDisputed: true,
    disputeNote: '用户反映VIP休息区关闭且未拿到限定纪念品，现场工作人员未给予解决方案',
    refundedAt: '2026-06-16 22:05:10',
    orderNo: 'ORD20260605000998',
    paymentChannel: '信用卡',
    paidAt: '2026-06-05 16:20:33',
    gateRecord: {
      gateNo: 'GATE-03',
      checkinTime: '2026-06-16 11:05:44',
      deviceId: 'DEV-G03-001',
      status: '已核销',
    },
    operationLogs: [
      { stage: '订单创建', time: '2026-06-05 16:18:00', operator: '系统' },
      { stage: '支付完成', time: '2026-06-05 16:20:33', operator: '招商银行', note: '支付单号 PAY20260605000111' },
      { stage: '核销申请', time: '2026-06-16 11:05:44', operator: 'GATE-03闸机', note: 'VIP通道核验' },
      { stage: '退票申请', time: '2026-06-16 18:30:00', operator: '用户本人', note: 'VIP服务缺失' },
      { stage: '退票争议发起', time: '2026-06-16 21:00:00', operator: '用户本人', note: '要求赔偿并公开致歉' },
    ],
    processed: false,
  },
};

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: typeof FileX;
  color: 'cyan' | 'purple' | 'orange' | 'green';
  trend?: { value: string; isUp: boolean };
}

function KpiCard({ label, value, unit, icon: Icon, color, trend }: KpiCardProps) {
  const colorMap = {
    cyan: 'from-cyan-primary/20 to-cyan-primary/5 border-cyan-primary/40 shadow-glow-cyan',
    purple: 'from-purple-sponsor/20 to-purple-sponsor/5 border-purple-sponsor/40 shadow-glow-purple',
    orange: 'from-orange-warning/20 to-orange-warning/5 border-orange-warning/40 shadow-glow-orange',
    green: 'from-green-success/20 to-green-success/5 border-green-success/40 shadow-glow-green',
  };
  const iconColorMap = {
    cyan: 'text-cyan-glow bg-cyan-primary/20 border-cyan-primary/40',
    purple: 'text-purple-200 bg-purple-sponsor/20 border-purple-sponsor/40',
    orange: 'text-orange-300 bg-orange-warning/20 border-orange-warning/40',
    green: 'text-green-300 bg-green-success/20 border-green-success/40',
  };
  const valueColorMap = {
    cyan: 'text-cyan-glow',
    purple: 'text-purple-200',
    orange: 'text-orange-300',
    green: 'text-green-300',
  };

  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-transform hover:scale-[1.02]',
      colorMap[color],
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-white/55 uppercase tracking-wider font-medium mb-1">
            {label}
          </div>
          <div className={cn('font-display font-bold text-3xl', valueColorMap[color])}>
            {value}
            {unit && <span className="text-sm font-medium text-white/60 ml-1">{unit}</span>}
          </div>
        </div>
        <div className={cn(
          'w-11 h-11 rounded-xl border flex items-center justify-center',
          iconColorMap[color],
        )}>
          <Icon size={22} />
        </div>
      </div>
      {trend && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
          trend.isUp
            ? 'bg-red-danger/15 text-red-danger border border-red-danger/30'
            : 'bg-green-success/15 text-green-success border border-green-success/30',
        )}>
          {trend.isUp ? '↑' : '↓'} {trend.value} 较昨日
        </div>
      )}
    </div>
  );
}

const TIMELINE_ICONS: Record<string, typeof ShoppingCart> = {
  '订单创建': ShoppingCart,
  '支付完成': CreditCard,
  '核销申请': ScanLine,
  '退票申请': FileX,
  '退票争议发起': ShieldAlert,
};

export default function RefundPage() {
  const [summary, setSummary] = useState<RefundSummary>(MOCK_SUMMARY);
  const [distribution, setDistribution] = useState<RefundDistributionPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSample, setActiveSample] = useState<RefundSample | null>(null);
  const [processingMark, setProcessingMark] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [s, d] = await Promise.all([
          refundApi.getSummary().catch(() => MOCK_SUMMARY),
          refundApi.getDistribution().catch(() => MOCK_DISTRIBUTION),
        ]);
        setSummary(s);
        setDistribution(d);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalTicketSoldEstimate = useMemo(() => 48230, []);
  const refundRate = useMemo(() => {
    const rate = (summary.totalCount / totalTicketSoldEstimate) * 100;
    return rate.toFixed(2);
  }, [summary.totalCount, totalTicketSoldEstimate]);

  const chartOption: EChartsOption = useMemo(() => {
    const dates = distribution.map((d) => d.date);
    const counts = distribution.map((d) => d.refundCount);

    const scatterData: any[] = [];
    distribution.forEach((dp, di) => {
      dp.disputedPoints.forEach((meta) => {
        const jitter = (Math.random() - 0.5) * 10;
        scatterData.push([di, dp.refundCount + 8 + jitter, meta] as any);
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontFamily: 'Inter' },
        formatter: (params: unknown) => {
          const arr = params as Array<{
            seriesName: string;
            axisValueLabel: string;
            value: number | [number, number, DisputedPointMeta];
            dataIndex: number;
          }>;
          if (!arr || arr.length === 0) return '';
          const date = arr[0].axisValueLabel;
          const dp = distribution.find((x) => x.date === date);
          if (!dp) return '';

          let html = `
            <div style="padding:4px 2px;font-family:Inter">
              <div style="font-weight:600;font-size:14px;color:#00F0FF;margin-bottom:8px;font-family:'Chakra Petch'">
                2026-${date}
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">退票数量</span>
                <span style="color:#00D4FF;font-weight:500">${dp.refundCount.toLocaleString()} 笔</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">退票金额</span>
                <span style="color:#fff;font-weight:500">¥${dp.refundAmount.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">争议数量</span>
                <span style="color:#FF3D57;font-weight:500">${dp.disputedCount} 笔</span>
              </div>
          `;

          const scatter = arr.filter((p) => p.seriesName === '争议点');
          if (scatter.length > 0) {
            html += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,61,87,0.25)">
              <div style="font-size:12px;color:#FF3D57;font-weight:600;margin-bottom:6px">● 争议样本</div>`;
            scatter.forEach((s) => {
              const meta = (s.value as [number, number, DisputedPointMeta])[2];
              html += `
                <div style="font-size:11px;padding:5px 7px;margin:3px 0;background:rgba(255,61,87,0.1);border:1px solid rgba(255,61,87,0.25);border-radius:6px;cursor:pointer;transition:all .2s">
                  <div style="display:flex;justify-content:space-between">
                    <span style="color:#FFD4D9;font-weight:500">${meta.refundId}</span>
                    <span style="color:#fff">¥${meta.amount}</span>
                  </div>
                  <div style="color:#cbd5e1;margin-top:2px">${meta.reason}</div>
                </div>
              `;
            });
            html += '</div>';
          }

          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['每日退票量', '争议点'],
        textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
        top: 0,
        right: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '退票数量 (笔)',
        nameTextStyle: { color: '#94a3b8', fontFamily: 'Inter' },
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)' } },
      },
      series: [
        {
          name: '每日退票量',
          type: 'bar',
          barWidth: 38,
          data: counts,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.95)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.3)' },
              ],
            },
          },
          emphasis: { itemStyle: { shadowBlur: 18, shadowColor: 'rgba(139, 92, 246, 0.5)' } },
        },
        {
          name: '争议点',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbolSize: (val: unknown) => {
            const v = val as [number, number, DisputedPointMeta];
            const base = Math.min(v[2].amount / 80, 12);
            return 20 + base;
          },
          symbol: 'circle',
          itemStyle: {
            color: '#FF3D57',
            borderColor: '#FF6B80',
            borderWidth: 2,
            shadowBlur: 20,
            shadowColor: 'rgba(255, 61, 87, 0.75)',
            opacity: 0.95,
          },
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 32,
              shadowColor: 'rgba(255, 61, 87, 1)',
            },
          },
          animation: true,
          animationDuration: 800,
          animationEasing: 'elasticOut',
          data: scatterData,
        },
      ] as any,
    } as EChartsOption;
  }, [distribution]);

  const handleChartClick = useCallback((e: unknown) => {
    const ev = e as {
      seriesName?: string;
      value?: [number, number, DisputedPointMeta];
    };
    if (ev.seriesName === '争议点' && ev.value) {
      const meta = ev.value[2];
      const sample = MOCK_SAMPLES[meta.id];
      if (sample) {
        setActiveSample(sample);
        setDrawerOpen(true);
      } else {
        refundApi.getSampleById(meta.refundId)
          .then((s) => { setActiveSample(s); setDrawerOpen(true); })
          .catch(() => {
            const fallback: RefundSample = {
              id: meta.refundId,
              paymentId: 'PAY-FALLBACK',
              registrationId: 'REG-FALLBACK',
              registrantName: '未知用户',
              registrantPhone: '138****0000',
              ticketType: '未知票种',
              originalAmount: meta.amount,
              refundAmount: meta.amount,
              reason: meta.reason,
              isDisputed: meta.isDisputed,
              disputeNote: '样本详情需从服务端加载',
              refundedAt: new Date().toISOString(),
              orderNo: 'ORD-FALLBACK',
              paymentChannel: '未知渠道',
              paidAt: new Date().toISOString(),
              operationLogs: [
                { stage: '订单创建', time: '2026-06-01 10:00:00', operator: '系统' },
                { stage: '退票争议发起', time: new Date().toISOString(), operator: '用户' },
              ],
              processed: false,
            };
            setActiveSample(fallback);
            setDrawerOpen(true);
          });
      }
    }
  }, []);

  const handleMarkProcessed = async () => {
    if (!activeSample) return;
    setProcessingMark(true);
    try {
      const res = await refundApi.markProcessed(activeSample.id).catch(() => ({
        ...activeSample,
        processed: true,
      }));
      setActiveSample({ ...res, processed: true });
    } finally {
      setProcessingMark(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="总退票量"
          value={summary.totalCount.toLocaleString()}
          unit="笔"
          icon={FileX}
          color="purple"
          trend={{ value: '5.2%', isUp: true }}
        />
        <KpiCard
          label="退票率"
          value={refundRate}
          unit="%"
          icon={Gauge}
          color="orange"
          trend={{ value: '0.3pt', isUp: true }}
        />
        <KpiCard
          label="争议数"
          value={summary.disputedCount.toLocaleString()}
          unit="笔"
          icon={AlertOctagon}
          color="cyan"
          trend={{ value: '12.8%', isUp: true }}
        />
        <KpiCard
          label="争议处理率"
          value={summary.disputedResolutionRate.toFixed(1)}
          unit="%"
          icon={CheckSquare}
          color="green"
          trend={{ value: '3.4pt', isUp: false }}
        />
      </div>

      <div className="panel">
        <div className="panel-header flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="panel-title glow-text">退票分布</h2>
            {loading && <span className="chip chip-active animate-pulse">加载中…</span>}
            <span className="chip chip-inactive">点击红色散点查看争议样本</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="w-3 h-3 rounded-full bg-purple-sponsor border border-white/20" />
            退票量
            <span className="ml-4 w-3 h-3 rounded-full bg-red-danger shadow-[0_0_12px_rgba(255,61,87,0.7)] animate-pulse-glow" />
            争议点
          </div>
        </div>
        <div className="panel-body">
          <div className="h-[500px] w-full">
            <ReactECharts
              option={chartOption}
              style={{ height: '100%', width: '100%' }}
              notMerge
              lazyUpdate
              onEvents={{ click: handleChartClick }}
            />
          </div>
        </div>
      </div>

      {drawerOpen && activeSample && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="w-[640px] max-w-[95vw] bg-ocean-dark border-l border-panel-border shadow-card animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-panel-border bg-ocean-dark/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg border flex items-center justify-center',
                  activeSample.processed
                    ? 'bg-green-success/20 border-green-success/40 shadow-glow-green'
                    : 'bg-red-danger/20 border-red-danger/40 shadow-glow-red',
                )}>
                  {activeSample.processed
                    ? <CheckCircle2 size={20} className="text-green-300" />
                    : <ShieldAlert size={20} className="text-red-300" />}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white text-lg flex items-center gap-2">
                    样本详情
                    {activeSample.processed && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-success/15 border border-green-success/30 text-green-300">
                        已处理
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/50 font-mono">{activeSample.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-panel-border bg-panel-bg/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-md bg-cyan-primary/15 border border-cyan-primary/30 flex items-center justify-center">
                      <User size={16} className="text-cyan-glow" />
                    </div>
                    <span className="text-xs text-white/60 font-medium">报名信息</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">姓名</span>
                      <span className="text-white font-medium truncate">{activeSample.registrantName}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">手机</span>
                      <span className="text-white/85 font-mono">{activeSample.registrantPhone}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">票种</span>
                      <span className="text-cyan-glow font-medium truncate">{activeSample.ticketType}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">报名ID</span>
                      <span className="text-white/75 font-mono text-xs truncate">{activeSample.registrationId}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-panel-border bg-panel-bg/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-md bg-purple-sponsor/15 border border-purple-sponsor/30 flex items-center justify-center">
                      <CreditCard size={16} className="text-purple-200" />
                    </div>
                    <span className="text-xs text-white/60 font-medium">支付流水</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">订单号</span>
                      <span className="text-white/85 font-mono text-xs truncate" title={activeSample.orderNo}>{activeSample.orderNo}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">渠道</span>
                      <span className="text-white/85 text-xs">{activeSample.paymentChannel}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">原价</span>
                      <span className="text-white font-medium">¥{activeSample.originalAmount}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">退款</span>
                      <span className="text-red-danger font-medium">¥{activeSample.refundAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-panel-border bg-panel-bg/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-md bg-orange-warning/15 border border-orange-warning/30 flex items-center justify-center">
                      <ScanLine size={16} className="text-orange-300" />
                    </div>
                    <span className="text-xs text-white/60 font-medium">闸机记录</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">通道</span>
                      <span className="text-white/85 font-medium">{activeSample.gateRecord?.gateNo ?? '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">设备</span>
                      <span className="text-white/75 text-xs truncate">{activeSample.gateRecord?.deviceId ?? '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">时间</span>
                      <span className="text-cyan-glow text-xs font-mono">
                        {activeSample.gateRecord?.checkinTime
                          ? dayjs(activeSample.gateRecord.checkinTime).format('MM-DD HH:mm')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50 shrink-0">状态</span>
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        activeSample.gateRecord?.status === '已核销'
                          ? 'bg-green-success/15 text-green-300'
                          : 'bg-white/5 text-white/60',
                      )}>
                        {activeSample.gateRecord?.status ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-danger/30 bg-red-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-red-danger/15 border border-red-danger/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Ban size={16} className="text-red-danger" />
                  </div>
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-red-danger font-semibold">争议原因</span>
                      <span className="text-xs text-white/50">{activeSample.reason}</span>
                    </div>
                    <p className="text-white/80 leading-relaxed pt-1">
                      {activeSample.disputeNote}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-cyan-primary" />
                  <span className="text-white/70 font-medium text-sm">操作时间轴</span>
                </div>
                <div className="relative pl-2 space-y-4">
                  <div className="absolute left-[17px] top-1 bottom-1 w-px bg-gradient-to-b from-cyan-primary/50 via-purple-sponsor/40 to-red-danger/40" />
                  {activeSample.operationLogs.map((log: OperationLog, i: number) => {
                    const Icon = TIMELINE_ICONS[log.stage] ?? CheckCircle2;
                    const isLast = i === activeSample.operationLogs.length - 1;
                    const colors = [
                      { dot: 'bg-cyan-primary ring-cyan-primary/40', icon: 'text-cyan-glow' },
                      { dot: 'bg-green-success ring-green-success/40', icon: 'text-green-300' },
                      { dot: 'bg-purple-sponsor ring-purple-sponsor/40', icon: 'text-purple-200' },
                      { dot: 'bg-orange-warning ring-orange-warning/40', icon: 'text-orange-300' },
                      { dot: 'bg-red-danger ring-red-danger/50', icon: 'text-red-danger' },
                    ];
                    const c = colors[i % colors.length];
                    return (
                      <div key={i} className="relative flex gap-4">
                        <div className={cn(
                          'relative z-10 w-9 h-9 rounded-full border-2 border-ocean-dark ring-4 flex items-center justify-center shrink-0',
                          c.dot,
                        )}>
                          <Icon size={15} className={cn('text-white', !isLast && c.icon)} />
                        </div>
                        <div className={cn(
                          'flex-1 rounded-xl border px-4 py-3 bg-panel-bg/40 transition-all',
                          isLast
                            ? 'border-red-danger/30 bg-red-danger/5'
                            : 'border-panel-border/60',
                        )}>
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className={cn(
                              'font-display font-semibold',
                              isLast ? 'text-red-danger' : 'text-white',
                            )}>
                              {log.stage}
                            </span>
                            <span className="text-xs text-white/50 font-mono shrink-0">
                              {log.time}
                            </span>
                          </div>
                          {log.operator && (
                            <div className="text-xs text-white/55 mb-1">
                              操作方：<span className="text-white/75">{log.operator}</span>
                            </div>
                          )}
                          {log.note && (
                            <div className="text-xs text-white/70 leading-relaxed bg-ocean-dark/50 rounded-md px-2.5 py-1.5 border border-white/5">
                              {log.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-ocean-dark/80 -mx-6 px-6 py-4 border-t border-panel-border backdrop-blur">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors font-medium text-sm"
                >
                  关闭
                </button>
                <button
                  onClick={handleMarkProcessed}
                  disabled={activeSample.processed || processingMark}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                    activeSample.processed
                      ? 'bg-green-success/20 border border-green-success/40 text-green-300 cursor-default'
                      : 'bg-cyan-primary/20 border border-cyan-primary/50 text-cyan-glow hover:shadow-glow-cyan',
                  )}
                >
                  <BadgeCheck size={16} />
                  {activeSample.processed ? '已标记处理' : processingMark ? '标记中…' : '标记已处理'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
