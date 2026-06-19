import type { ReworkCalculationInput, ReworkResult, WorkOrder } from '../types';

const SKILL_MISMATCH_RISK = 0.3;
const ALTERNATIVE_PART_RISK = 0.15;
const SKIPPED_STEPS_RISK = 0.4;
const SEVERITY_RISK_MULTIPLIER: Record<string, number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.3,
  critical: 1.6,
};

const REWORK_REASONS_BY_SKILL = {
  engine: [
    '装配扭矩不达标导致异响',
    '正时校准偏差，动力输出不稳定',
    '密封件安装不当，出现渗油',
    '电控单元参数匹配错误',
  ],
  transmission: [
    '换挡顿挫，同步器调校异常',
    '液压系统存在空气，响应迟缓',
    '离合器压盘压力不均，打滑',
    '油封安装不到位，漏油',
  ],
  brakes: [
    '刹车盘跳动量超标，高速抖动',
    '制动片磨损不均匀，偏磨',
    'ABS 传感器信号异常',
    '油管接头渗油，制动力下降',
  ],
  brake: [
    '刹车盘跳动量超标，高速抖动',
    '制动片磨损不均匀，偏磨',
    'ABS 传感器信号异常',
    '油管接头渗油，制动力下降',
  ],
  suspension: [
    '四轮定位参数偏差，方向跑偏',
    '减震器异响，阻尼系数不符',
    '弹簧预紧力调整不当',
    '球头防尘罩破损，进水锈蚀',
  ],
  electrical: [
    '线束接头接触不良，时好时坏',
    '保险丝规格不匹配，频繁熔断',
    '接地回路阻抗过高，功能失效',
    '控制模块程序版本错误',
  ],
  body: [
    '钣金平整度不足，缝隙不均',
    '漆面流挂/桔皮，需要重喷',
    '焊点防锈处理不到位',
    '装饰件卡扣断裂，异响',
  ],
  tires: [
    '轮胎动平衡超差，高速抖动',
    '气门嘴密封不良，缓慢漏气',
    '胎压监测传感器未匹配',
    '轮辋划痕未处理，影响美观',
  ],
  ac: [
    '制冷剂加注量不足，制冷效果差',
    '系统存在微漏，压力缓慢下降',
    '压缩机离合器间隙过大',
    '温控传感器校准偏差',
  ],
  exhaust: [
    '排气管路接口密封不严，漏气异响',
    '三元催化器安装扭矩不足',
    '氧传感器信号异常',
    '消音器焊接点开裂',
  ],
  cooling: [
    '冷却系统残留空气，水温波动',
    '水管卡箍未到位，渗漏防冻液',
    '节温器开启温度偏差',
    '电子风扇控制器匹配异常',
  ],
  fuel: [
    '燃油管路接头渗油，有安全隐患',
    '燃油压力调节器调校偏差',
    '喷油嘴密封圈安装不当',
    '碳罐电磁阀工作异常',
  ],
  diagnosis: [
    '误判故障点，返修排查',
    '软件刷新版本不兼容',
    '匹配流程未完整执行',
    '隐藏故障码未清除',
  ],
};

const ALTERNATIVE_PART_REASONS = [
  '替代配件规格略有差异，出现兼容性问题',
  '副厂配件品质不稳定，提前失效',
  '替代件接口需额外调整，留下隐患',
];

const SKIPPED_STEPS_REASONS = [
  '跳过必要检测工序，故障未彻底排除',
  '省略预处理步骤，影响主工序质量',
  '未按流程校验，参数存在偏差',
];

export function calculateReworkRisk(input: ReworkCalculationInput): ReworkResult {
  const { diagnosis, skillMatched, usedAlternative, skippedSteps, additionalRisk } = input;

  const riskFactors: string[] = [];
  let totalRisk = diagnosis.reworkRisk;

  const severityMultiplier = SEVERITY_RISK_MULTIPLIER[diagnosis.severity] || 1;
  totalRisk *= severityMultiplier;
  if (severityMultiplier > 1) {
    riskFactors.push(`故障严重等级「${severityToText(diagnosis.severity)}」增加返修风险`);
  }

  if (!skillMatched) {
    totalRisk += SKILL_MISMATCH_RISK;
    riskFactors.push('工位技能不匹配');
  }

  if (usedAlternative) {
    totalRisk += ALTERNATIVE_PART_RISK;
    riskFactors.push('使用替代配件');
  }

  if (skippedSteps) {
    totalRisk += SKIPPED_STEPS_RISK;
    riskFactors.push('跳过了部分工序');
  }

  if (additionalRisk && additionalRisk > 0) {
    totalRisk += additionalRisk;
  }

  totalRisk = Math.max(0, Math.min(1, totalRisk));

  const willRework = Math.random() < totalRisk;
  let reworkReason: string | undefined;

  if (willRework) {
    reworkReason = pickReworkReason(diagnosis, skillMatched, usedAlternative, skippedSteps);
  }

  return {
    reworkProbability: totalRisk,
    riskFactors,
    willRework,
    reworkReason,
  };
}

function pickReworkReason(
  diagnosis: { requiredSkill?: string; requiredSkills?: string[]; faultName: string },
  skillMatched: boolean,
  usedAlternative: boolean,
  skippedSteps: boolean
): string {
  const reasonPools: string[] = [];
  const rawKey = diagnosis.requiredSkill ?? diagnosis.requiredSkills?.[0] ?? 'diagnosis';
  const skillKey = (rawKey === 'brake' ? 'brakes' : rawKey) as keyof typeof REWORK_REASONS_BY_SKILL;

  if (skippedSteps) {
    reasonPools.push(...SKIPPED_STEPS_REASONS);
  }

  if (usedAlternative) {
    reasonPools.push(...ALTERNATIVE_PART_REASONS);
  }

  if (!skillMatched) {
    reasonPools.push(...(REWORK_REASONS_BY_SKILL[skillKey] || []));
    reasonPools.push(`因操作不熟练导致「${diagnosis.faultName}」返修`);
  }

  reasonPools.push(...(REWORK_REASONS_BY_SKILL[skillKey] || []));

  if (reasonPools.length === 0) {
    return `${diagnosis.faultName} 未完全修复，需要重新处理`;
  }

  return reasonPools[Math.floor(Math.random() * reasonPools.length)];
}

export function calculateReworkRate(orders: WorkOrder[]): number {
  const completed = orders.filter(
    (o) => o.status === 'completed' || o.status === 'reworked' || o.status === 'skipped'
  );

  if (completed.length === 0) {
    return 0;
  }

  const reworkedCount = completed.filter((o) => o.reworked).length;
  return reworkedCount / completed.length;
}

export function calculateVehicleLevelReworkRate(
  vehicleId: string,
  orders: WorkOrder[]
): number {
  const vehicleOrders = orders.filter(
    (o) =>
      o.vehicleId === vehicleId &&
      (o.status === 'completed' || o.status === 'reworked' || o.status === 'skipped')
  );

  if (vehicleOrders.length === 0) {
    return 0;
  }

  const reworked = vehicleOrders.filter((o) => o.reworked).length;
  return reworked / vehicleOrders.length;
}

export interface ShortageSolutionBreakdown {
  wait: { count: number; reworkCount: number; reworkRate: number };
  alternative: { count: number; reworkCount: number; reworkRate: number };
  skip: { count: number; reworkCount: number; reworkRate: number };
  noShortage: { count: number; reworkCount: number; reworkRate: number };
}

export function calculateShortageBreakdown(orders: WorkOrder[]): ShortageSolutionBreakdown {
  const filterBySolution = (solution: string | undefined, hasShortage: boolean) =>
    orders.filter((o) => {
      if (hasShortage) {
        return o.shortageHandled && o.shortageSolution === solution;
      }
      return !o.shortageHandled && (o.status === 'completed' || o.status === 'reworked');
    });

  const calc = (list: WorkOrder[]) => ({
    count: list.length,
    reworkCount: list.filter((o) => o.reworked).length,
    reworkRate: list.length > 0 ? list.filter((o) => o.reworked).length / list.length : 0,
  });

  return {
    wait: calc(filterBySolution('wait', true)),
    alternative: calc(filterBySolution('alternative', true)),
    skip: calc(filterBySolution('skip', true)),
    noShortage: calc(filterBySolution(undefined, false)),
  };
}

export function getRiskLevel(probability: number): {
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  label: string;
} {
  if (probability <= 0.1) {
    return { level: 'low', color: 'text-green-500', label: '极低风险' };
  }
  if (probability <= 0.25) {
    return { level: 'medium', color: 'text-yellow-500', label: '中等风险' };
  }
  if (probability <= 0.45) {
    return { level: 'high', color: 'text-orange-500', label: '较高风险' };
  }
  return { level: 'critical', color: 'text-red-500', label: '高风险' };
}

export function getReworkPenaltyMinutes(diagnosis: { estimatedMinutes: number }): number {
  return Math.ceil(diagnosis.estimatedMinutes * 0.5);
}

function severityToText(severity: string): string {
  const map: Record<string, string> = {
    low: '轻微',
    medium: '一般',
    high: '严重',
    critical: '致命',
  };
  return map[severity] || severity;
}
