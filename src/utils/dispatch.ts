import type {
  Station,
  WorkOrder,
  Diagnosis,
  DispatchConstraintResult,
  SkillType,
} from '../types';

const SKILL_MISMATCH_REWORK_RISK_INCREASE = 0.3;

const skillAliasMap: Record<string, SkillType> = {
  brake: 'brakes',
  brakes: 'brakes',
};

function normalizeSkill(skill: string): SkillType {
  return (skillAliasMap[skill] || skill) as SkillType;
}

export function checkSkillMatch(
  station: Station,
  diagnosis: Diagnosis
): { matched: boolean; matchRate: number } {
  const skill = diagnosis.requiredSkill ?? diagnosis.requiredSkills[0] ?? 'diagnosis';
  const requiredSkill = normalizeSkill(skill);
  const stationSkills = station.skills.map(normalizeSkill);
  const hasSkill = stationSkills.includes(requiredSkill);

  let matchRate = 0;
  if (hasSkill) {
    matchRate = 1;
  } else {
    const relatedSkills = getRelatedSkills(requiredSkill);
    const matchedRelated = stationSkills.filter((s) => relatedSkills.includes(s)).length;
    matchRate = matchedRelated > 0 ? 0.5 : 0;
  }

  return { matched: hasSkill, matchRate };
}

function getRelatedSkills(skill: SkillType): SkillType[] {
  const relatedMap: Record<SkillType, SkillType[]> = {
    engine: ['transmission', 'diagnosis'],
    transmission: ['engine', 'diagnosis'],
    brakes: ['suspension', 'tires'],
    suspension: ['brakes', 'tires'],
    electrical: ['ac', 'diagnosis'],
    body: [],
    tires: ['brakes', 'suspension'],
    ac: ['electrical'],
    diagnosis: ['engine', 'transmission', 'electrical', 'ac'],
    brake: ['suspension', 'tires'],
    exhaust: [],
    cooling: ['engine'],
    fuel: ['engine'],
  };
  return relatedMap[skill] || [];
}

export function checkTimeConflict(
  station: Station,
  diagnosis: Diagnosis,
  stationOrders: WorkOrder[],
  currentTime: number
): { conflict: boolean; conflictingOrder?: WorkOrder; earliestAvailable: number } {
  if (!station.busy) {
    return { conflict: false, earliestAvailable: currentTime };
  }

  const activeOrder = stationOrders.find(
    (o) =>
      o.stationId === station.id &&
      (o.status === 'in_progress' || o.status === 'pending') &&
      o.startTime !== null
  );

  if (!activeOrder || activeOrder.startTime === null || activeOrder.endTime === null) {
    return { conflict: false, earliestAvailable: currentTime };
  }

  const conflict = activeOrder.endTime > currentTime;
  return {
    conflict,
    conflictingOrder: activeOrder,
    earliestAvailable: Math.max(activeOrder.endTime, currentTime),
  };
}

export function checkDependencies(
  diagnosis: Diagnosis,
  allDiagnoses: Diagnosis[],
  completedOrders: WorkOrder[]
): { met: boolean; pendingDependencies: string[] } {
  if (!diagnosis.dependencies || diagnosis.dependencies.length === 0) {
    return { met: true, pendingDependencies: [] };
  }

  const completedDiagnosisIds = new Set(
    completedOrders
      .filter((o) => o.status === 'completed' || o.status === 'reworked')
      .map((o) => o.diagnosisId)
  );

  const pendingDependencies: string[] = [];

  for (const depId of diagnosis.dependencies) {
    if (!completedDiagnosisIds.has(depId)) {
      const depDiagnosis = allDiagnoses.find((d) => d.id === depId);
      if (depDiagnosis) {
        pendingDependencies.push(depDiagnosis.faultName);
      } else {
        pendingDependencies.push(depId);
      }
    }
  }

  return {
    met: pendingDependencies.length === 0,
    pendingDependencies,
  };
}

export function checkDispatchConstraints(params: {
  station: Station;
  diagnosis: Diagnosis;
  allDiagnoses: Diagnosis[];
  stationOrders: WorkOrder[];
  completedOrders: WorkOrder[];
  currentTime: number;
}): DispatchConstraintResult {
  const { station, diagnosis, allDiagnoses, stationOrders, completedOrders, currentTime } =
    params;

  const reasons: string[] = [];

  const skillCheck = checkSkillMatch(station, diagnosis);
  if (!skillCheck.matched) {
    const skill = diagnosis.requiredSkill ?? diagnosis.requiredSkills[0] ?? 'diagnosis';
    reasons.push(
      `工位缺少所需技能「${skillToText(skill)}」，返修风险 +30%`
    );
  }

  const timeCheck = checkTimeConflict(station, diagnosis, stationOrders, currentTime);
  if (timeCheck.conflict) {
    reasons.push(
      `工位当前繁忙，预计 ${formatMinutes((timeCheck.earliestAvailable - currentTime) / 60)} 后可用`
    );
  }

  const depCheck = checkDependencies(diagnosis, allDiagnoses, completedOrders);
  if (!depCheck.met) {
    reasons.push(`需先完成前置工序：${depCheck.pendingDependencies.join('、')}`);
  }

  return {
    valid: !timeCheck.conflict && depCheck.met,
    reasons,
    skillMatch: skillCheck.matched,
    timeConflict: timeCheck.conflict,
    dependenciesMet: depCheck.met,
  };
}

export function getReworkRiskIncrease(skillMatched: boolean): number {
  return skillMatched ? 0 : SKILL_MISMATCH_REWORK_RISK_INCREASE;
}

export function getStationWorkload(
  station: Station,
  stationOrders: WorkOrder[],
  currentTime: number
): number {
  const activeOrders = stationOrders.filter(
    (o) =>
      o.stationId === station.id &&
      (o.status === 'in_progress' || o.status === 'pending')
  );

  let totalRemainingMinutes = 0;
  for (const order of activeOrders) {
    if (order.endTime !== null && order.startTime !== null) {
      const remaining = Math.max(0, order.endTime - currentTime);
      totalRemainingMinutes += remaining / 60;
    }
  }

  return totalRemainingMinutes;
}

export function recommendStations(
  diagnoses: Diagnosis[],
  stations: Station[],
  stationOrders: WorkOrder[],
  completedOrders: WorkOrder[],
  currentTime: number
): Map<string, { station: Station; score: number; warnings: string[] }[]> {
  const result = new Map<
    string,
    { station: Station; score: number; warnings: string[] }[]
  >();

  for (const diagnosis of diagnoses) {
    const ranked: { station: Station; score: number; warnings: string[] }[] = [];

    for (const station of stations) {
      const warnings: string[] = [];
      let score = 100;

      const skillCheck = checkSkillMatch(station, diagnosis);
      if (!skillCheck.matched) {
        score -= 40;
        warnings.push(`技能不匹配`);
      } else {
        score += 20;
      }

      const timeCheck = checkTimeConflict(station, diagnosis, stationOrders, currentTime);
      if (timeCheck.conflict) {
        const waitMinutes = Math.ceil((timeCheck.earliestAvailable - currentTime) / 60);
        score -= Math.min(30, waitMinutes * 2);
        warnings.push(`需等待 ${waitMinutes} 分钟`);
      }

      const workload = getStationWorkload(station, stationOrders, currentTime);
      score -= Math.min(10, workload * 0.5);

      ranked.push({ station, score, warnings });
    }

    ranked.sort((a, b) => b.score - a.score);
    result.set(diagnosis.id, ranked);
  }

  return result;
}

function skillToText(skill: SkillType): string {
  const map: Record<SkillType, string> = {
    engine: '发动机维修',
    transmission: '变速箱维修',
    brakes: '刹车系统',
    brake: '刹车系统',
    suspension: '悬挂系统',
    electrical: '电器电路',
    body: '车身钣金',
    tires: '轮胎更换',
    ac: '空调系统',
    diagnosis: '综合诊断',
    exhaust: '排气系统',
    cooling: '冷却系统',
    fuel: '燃油系统',
  };
  return map[skill] || skill;
}

function formatMinutes(minutes: number): string {
  const rounded = Math.ceil(minutes);
  if (rounded < 60) return `${rounded} 分钟`;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}
