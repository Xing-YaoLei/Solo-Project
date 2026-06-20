import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { BookOpen, X, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { verificationApi } from '@/api/modules/verification';
import type {
  VerificationEfficiency,
  VerificationDatePoint,
  VerificationAreaItem,
  VerificationDefinition,
} from '@/types';
import { cn } from '@/lib/utils';

type TabKey = 'efficiency' | 'trend' | 'area';

const MOCK_EFFICIENCY: VerificationEfficiency[] = [
  { gateNo: 'GATE-01', totalCheckins: 12453, avgProcessingSeconds: 0.85, efficiencyScore: 96.5, group: '主入口' },
  { gateNo: 'GATE-02', totalCheckins: 10892, avgProcessingSeconds: 0.92, efficiencyScore: 94.8, group: '主入口' },
  { gateNo: 'GATE-03', totalCheckins: 8734, avgProcessingSeconds: 1.12, efficiencyScore: 91.2, group: 'VIP通道' },
  { gateNo: 'GATE-04', totalCheckins: 6521, avgProcessingSeconds: 1.08, efficiencyScore: 92.0, group: 'VIP通道' },
  { gateNo: 'GATE-05', totalCheckins: 15234, avgProcessingSeconds: 0.78, efficiencyScore: 97.2, group: '快速通道' },
  { gateNo: 'GATE-06', totalCheckins: 13108, avgProcessingSeconds: 0.81, efficiencyScore: 96.8, group: '快速通道' },
];

const MOCK_DATE_TREND: VerificationDatePoint[] = [
  { date: '06-15', checkinCount: 18234, checkinRate: 88.5 },
  { date: '06-16', checkinCount: 21567, checkinRate: 90.2 },
  { date: '06-17', checkinCount: 19876, checkinRate: 87.8 },
  { date: '06-18', checkinCount: 25432, checkinRate: 92.1 },
  { date: '06-19', checkinCount: 28910, checkinRate: 93.5 },
  { date: '06-20', checkinCount: 26789, checkinRate: 91.8 },
  { date: '06-21', checkinCount: 15623, checkinRate: 85.3 },
];

const MOCK_AREAS: VerificationAreaItem[] = [
  { areaCode: 'A1', areaName: 'A区-主会场', checkinCount: 12456, checkinRate: 95.2 },
  { areaCode: 'A2', areaName: 'A区-分会场A', checkinCount: 8234, checkinRate: 91.8 },
  { areaCode: 'B1', areaName: 'B区-展览厅', checkinCount: 15678, checkinRate: 89.5 },
  { areaCode: 'B2', areaName: 'B区-互动区', checkinCount: 6789, checkinRate: 88.2 },
  { areaCode: 'C1', areaName: 'C区-VIP休息区', checkinCount: 3456, checkinRate: 97.8 },
  { areaCode: 'C2', areaName: 'C区-餐饮区', checkinCount: 9876, checkinRate: 86.3 },
  { areaCode: 'D1', areaName: 'D区-户外区', checkinCount: 5432, checkinRate: 82.1 },
  { areaCode: 'E1', areaName: 'E区-停车场', checkinCount: 11234, checkinRate: 94.5 },
];

const MOCK_DEFINITIONS: VerificationDefinition[] = [
  {
    id: 'rule-001',
    title: '入场核销规则',
    formula: `SUCCESS = (ticket_valid = true)
  AND (status = 'paid')
  AND (event_date = current_date)
  AND (usage_count < max_usage)
  AND (not_expired = true)`,
    dataSource: '订单服务 (order_service.tickets) + 票据中心 (ticket_center.validations) + 日历配置 (event_config.calendar)',
    exceptionRules: [
      '票已使用 → 抛出 DUPLICATE_SCAN 异常，记录重复扫描日志',
      '票未支付 → 抛出 UNPAID_TICKET 异常，引导至支付窗口',
      '票已过期 → 抛出 EXPIRED_TICKET 异常，引导至服务台',
      '日期不匹配 → 抛出 DATE_MISMATCH 异常，提示正确日期',
    ],
    example: '票号 T20260621001234：已支付、未使用、日期匹配 → 核销成功，闸机开启，耗时 0.82s',
  },
  {
    id: 'rule-002',
    title: 'VIP通道核销规则',
    formula: `VIP_SUCCESS = (vip_level >= required_level)
  AND (ticket_valid = true)
  AND (verification_method IN ('face', 'qr', 'nfc'))
  AND (whitelist_match OR invitation_verified)`,
    dataSource: 'VIP系统 (vip_service.members) + 权限矩阵 (access_matrix.permissions) + 邀请名单 (invitation_list.entries)',
    exceptionRules: [
      'VIP等级不足 → 抛出 INSUFFICIENT_LEVEL 异常，转至普通通道',
      '不在白名单 → 抛出 NOT_IN_WHITELIST 异常，人工审核',
      '验证方式不匹配 → 要求切换验证方式',
    ],
    example: 'VIP会员张某某：钻石卡、人脸识别通过、在白名单 → VIP通道进入，耗时 0.56s',
  },
  {
    id: 'rule-003',
    title: '停车核销规则',
    formula: `PARKING_SUCCESS = (parking_ticket_valid)
  AND (exit_time - entry_time <= max_duration_hours)
  AND (event_ticket_paid OR parking_fee_settled)
  AND (plate_match OR ticket_bind)`,
    dataSource: '停车系统 (parking_service.records) + 车牌识别 (lpr_system.plate_logs) + 费用中心 (billing.payments)',
    exceptionRules: [
      '超时未缴费 → 抛出 OVERTIME_UNPAID 异常，显示补缴金额',
      '车牌不匹配 → 要求输入票据号后四位验证',
      '无入场记录 → 抛出 NO_ENTRY_RECORD 异常，人工介入',
    ],
    example: '车牌沪A12345：入场3小时20分、关联票据已支付 → 抬杆放行，补缴 ¥0',
  },
  {
    id: 'rule-004',
    title: '周边商品核销规则',
    formula: `MERCH_SUCCESS = (redemption_ticket_valid)
  AND (sku_in_exchange_list)
  AND (stock_available > 0)
  AND (exchange_count < limit_per_person)
  AND (within_redemption_window)`,
    dataSource: '商品系统 (merch_service.inventory) + 兑换库存 (inventory.stock) + 兑换记录 (redemption_logs)',
    exceptionRules: [
      '库存不足 → 抛出 OUT_OF_STOCK 异常，推荐替代SKU',
      '超出限购 → 抛出 EXCEED_LIMIT 异常，显示已兑换数量',
      '不在兑换窗口 → 提示兑换时间段',
    ],
    example: '兑换券 MR001：限定款T恤 M码、库存剩余12件、首次兑换 → 核销成功，打印取货单',
  },
  {
    id: 'rule-005',
    title: '二次入场核销规则',
    formula: `REENTRY_SUCCESS = (initial_checkin_exists)
  AND (reentry_count < max_reentries)
  AND (reentry_within_grace_period)
  AND (same_gate_group OR all_access_pass)
  AND (biometric_verification_passed)`,
    dataSource: '出入记录 (gate_logs.checkin_records) + 生物比对 (biometric.match) + 通行证配置 (pass_config)',
    exceptionRules: [
      '重入次数超限 → 抛出 REENTRY_LIMIT 异常，引导升级全通票',
      '超出宽限期 → 抛出 GRACE_PERIOD_EXPIRED 异常，需重新购票',
      '生物比对失败 → 人工核验 + 身份证验证',
    ],
    example: '票号 T20260621000897：14:32首次入场，16:45返回（间隔2h13m<4h），人脸识别通过 → 二次入场成功',
  },
];

const TABS: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: 'efficiency', label: '效率对比', icon: Clock },
  { key: 'trend', label: '日期趋势', icon: CheckCircle2 },
  { key: 'area', label: '区域比较', icon: AlertTriangle },
];

const CHECKIN_RATE_THRESHOLD = 85;

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('efficiency');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [definitions, setDefinitions] = useState<VerificationDefinition[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<VerificationEfficiency[]>([]);
  const [trendData, setTrendData] = useState<VerificationDatePoint[]>([]);
  const [areaData, setAreaData] = useState<VerificationAreaItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [eff, trend, area, defs] = await Promise.all([
          verificationApi.getEfficiency().catch(() => MOCK_EFFICIENCY),
          verificationApi.getDateTrend().catch(() => MOCK_DATE_TREND),
          verificationApi.getAreaCompare().catch(() => MOCK_AREAS),
          verificationApi.getDefinition().catch(() => MOCK_DEFINITIONS),
        ]);
        setEfficiencyData(eff);
        setTrendData(trend);
        setAreaData(area);
        setDefinitions(defs);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const efficiencyOption: EChartsOption = useMemo(() => {
    const gates = efficiencyData.map((d) => d.gateNo);
    const avgTimes = efficiencyData.map((d) => d.avgProcessingSeconds);
    const passRates = efficiencyData.map((d) => d.efficiencyScore);

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
          const p = params as Array<{ axisValue: string; seriesName: string; value: number; data: VerificationEfficiency }>;
          if (!p || p.length === 0) return '';
          const gate = efficiencyData.find((g) => g.gateNo === p[0].axisValue);
          if (!gate) return '';
          return `
            <div style="padding:4px 2px;font-family:Inter">
              <div style="font-weight:600;font-size:14px;color:#00F0FF;margin-bottom:8px;font-family:'Chakra Petch'">
                通道 ${gate.gateNo} · ${gate.group}
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">总核销数</span>
                <span style="color:#fff;font-weight:500">${gate.totalCheckins.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">平均耗时</span>
                <span style="color:#00D4FF;font-weight:500">${gate.avgProcessingSeconds.toFixed(2)}s</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">通过评分</span>
                <span style="color:#00E396;font-weight:500">${gate.efficiencyScore.toFixed(1)}%</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: ['平均耗时 (s)', '通过评分 (%)'],
        textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
        top: 0,
        right: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: gates,
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '耗时(s)',
          nameTextStyle: { color: '#94a3b8', fontFamily: 'Inter' },
          axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
          splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)' } },
        },
        {
          type: 'value',
          name: '评分(%)',
          nameTextStyle: { color: '#94a3b8', fontFamily: 'Inter' },
          min: 80,
          max: 100,
          axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '平均耗时 (s)',
          type: 'bar',
          barWidth: 32,
          data: avgTimes,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#00D4FF' },
                { offset: 1, color: 'rgba(0, 212, 255, 0.3)' },
              ],
            },
          },
        },
        {
          name: '通过评分 (%)',
          type: 'bar',
          yAxisIndex: 1,
          barWidth: 32,
          data: passRates,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#00E396' },
                { offset: 1, color: 'rgba(0, 227, 150, 0.3)' },
              ],
            },
          },
        },
      ],
    };
  }, [efficiencyData]);

  const trendOption: EChartsOption = useMemo(() => {
    const dates = trendData.map((d) => d.date);
    const counts = trendData.map((d) => d.checkinCount);
    const rates = trendData.map((d) => d.checkinRate);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(6, 18, 41, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontFamily: 'Inter' },
        formatter: (params: unknown) => {
          const p = params as Array<{ axisValueLabel: string; seriesName: string; value: number }>;
          if (!p || p.length === 0) return '';
          const date = p[0].axisValueLabel;
          const cnt = p.find((x) => x.seriesName === '核销数量')?.value ?? 0;
          const rt = p.find((x) => x.seriesName === '核销率')?.value ?? 0;
          const below = (rt as number) < CHECKIN_RATE_THRESHOLD;
          return `
            <div style="padding:4px 2px;font-family:Inter">
              <div style="font-weight:600;font-size:14px;color:#00F0FF;margin-bottom:8px;font-family:'Chakra Petch'">
                2026-${date}
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">核销数量</span>
                <span style="color:#00D4FF;font-weight:500">${(cnt as number).toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">核销率</span>
                <span style="color:${below ? '#FF3D57' : '#00E396'};font-weight:500">${(rt as number).toFixed(1)}% ${below ? '⚠ 低于阈值' : ''}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">健康阈值</span>
                <span style="color:#FF8A00;font-weight:500">${CHECKIN_RATE_THRESHOLD}%</span>
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: ['核销数量', '核销率', '阈值参考线'],
        textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
        top: 0,
        right: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '核销数',
          nameTextStyle: { color: '#94a3b8', fontFamily: 'Inter' },
          axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
          splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)' } },
        },
        {
          type: 'value',
          name: '核销率(%)',
          nameTextStyle: { color: '#94a3b8', fontFamily: 'Inter' },
          min: 70,
          max: 100,
          axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
          axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '核销数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#00D4FF' },
          itemStyle: { color: '#00D4FF', borderColor: '#061229', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 212, 255, 0)' },
              ],
            },
          },
          data: counts,
        },
        {
          name: '核销率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#00E396' },
          itemStyle: { color: '#00E396', borderColor: '#061229', borderWidth: 2 },
          data: rates,
          markLine: {
            name: '阈值参考线',
            silent: false,
            symbol: 'none',
            lineStyle: { color: '#FF8A00', type: 'dashed', width: 2 },
            label: {
              formatter: '阈值 {c}%',
              color: '#FF8A00',
              fontFamily: 'Inter',
              fontSize: 12,
            },
            data: [{ yAxis: CHECKIN_RATE_THRESHOLD, name: '健康阈值' }],
          },
        },
      ],
    };
  }, [trendData]);

  const areaOption: EChartsOption = useMemo(() => {
    const sorted = [...areaData].sort((a, b) => b.checkinRate - a.checkinRate);
    const names = sorted.map((d) => d.areaName);
    const rates = sorted.map((d) => d.checkinRate);

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
          const p = params as Array<{ axisValue: string; value: number }>;
          if (!p || p.length === 0) return '';
          const area = sorted.find((a) => a.areaName === p[0].axisValue);
          if (!area) return '';
          return `
            <div style="padding:4px 2px;font-family:Inter">
              <div style="font-weight:600;font-size:14px;color:#00F0FF;margin-bottom:8px;font-family:'Chakra Petch'">
                ${area.areaName}
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">区域编码</span>
                <span style="color:#fff;font-weight:500">${area.areaCode}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">核销数量</span>
                <span style="color:#fff;font-weight:500">${area.checkinCount.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;font-size:12px;margin:4px 0">
                <span style="color:#94a3b8">核销率</span>
                <span style="color:#00E396;font-weight:500">${area.checkinRate.toFixed(2)}%</span>
              </div>
            </div>
          `;
        },
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: 20, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontFamily: 'Inter', formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
        axisLabel: { color: '#e2e8f0', fontFamily: 'Inter' },
        axisTick: { show: false },
        inverse: true,
      },
      series: [
        {
          type: 'bar',
          barWidth: 22,
          data: rates,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (params: unknown) => {
              const pm = params as { dataIndex: number; value: number };
              const ratio = (pm.value - 80) / 20;
              const r = Math.round(0 + (139 - 0) * ratio);
              const g = Math.round(227 + (92 - 227) * ratio);
              const b = Math.round(150 + (246 - 150) * ratio);
              return {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: `rgba(${r}, ${g}, ${b}, 0.4)` },
                  { offset: 1, color: `rgb(${r}, ${g}, ${b})` },
                ],
              };
            },
          },
          label: {
            show: true,
            position: 'right',
            color: '#e2e8f0',
            fontFamily: 'Inter',
            fontWeight: 500,
            formatter: '{c}%',
          },
        },
      ],
    };
  }, [areaData]);

  const getActiveOption = () => {
    switch (activeTab) {
      case 'efficiency': return efficiencyOption;
      case 'trend': return trendOption;
      case 'area': return areaOption;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="panel">
        <div className="panel-header flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="panel-title glow-text">核销报表</h2>
            {loading && (
              <span className="chip chip-active animate-pulse">加载中…</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-panel-border p-1 bg-ocean-dark/40">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    activeTab === key
                      ? 'bg-cyan-primary/20 text-cyan-glow shadow-glow-cyan'
                      : 'text-white/60 hover:text-white/90'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-sponsor/20 border border-purple-sponsor/40 text-purple-200 hover:bg-purple-sponsor/30 hover:shadow-glow-purple transition-all duration-200 font-medium text-sm"
            >
              <BookOpen size={16} />
              核销口径
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="h-[520px] w-full">
            <ReactECharts
              option={getActiveOption()}
              style={{ height: '100%', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="w-[560px] max-w-[92vw] bg-ocean-dark border-l border-panel-border shadow-card animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-panel-border bg-ocean-dark/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-sponsor/20 border border-purple-sponsor/40 flex items-center justify-center shadow-glow-purple">
                  <BookOpen size={20} className="text-purple-200" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">核销口径说明</h3>
                  <p className="text-xs text-white/50">共 {definitions.length} 条规则定义</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {definitions.map((rule, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-panel-border bg-panel-bg/50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-panel-border/60 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-md bg-cyan-primary/20 border border-cyan-primary/40 flex items-center justify-center text-cyan-glow font-display text-sm font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="font-display font-semibold text-white">{rule.title}</h4>
                  </div>
                  <div className="p-4 space-y-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-white/70 font-medium mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-primary" />
                        计算公式
                      </div>
                      <pre className="rounded-lg bg-ocean-dark border border-panel-border/60 px-4 py-3 overflow-x-auto text-cyan-glow/90 font-mono text-xs leading-relaxed">
{rule.formula}
                      </pre>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white/70 font-medium mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-sponsor" />
                        数据源
                      </div>
                      <p className="text-white/80 leading-relaxed">{rule.dataSource}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white/70 font-medium mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-warning" />
                        异常处理
                      </div>
                      <ul className="space-y-1.5">
                        {rule.exceptionRules.map((ex, i) => (
                          <li key={i} className="flex gap-2 text-white/80 leading-relaxed">
                            <span className="text-orange-warning shrink-0 mt-0.5">▸</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white/70 font-medium mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-success" />
                        示例
                      </div>
                      <p className="text-green-success/90 leading-relaxed bg-green-success/5 border border-green-success/20 rounded-lg px-3 py-2">
                        {rule.example}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
