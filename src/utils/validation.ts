import type { LevelConfig, PatrolPoint, Tenant, MeterReading, WorkOrder } from '../types';

export function validateLevelConfig(config: unknown): config is LevelConfig {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (typeof c.id !== 'string') return false;
  if (typeof c.name !== 'string') return false;
  if (typeof c.description !== 'string') return false;
  if (typeof c.difficulty !== 'number' || c.difficulty < 1 || c.difficulty > 5) return false;
  if (typeof c.timeLimit !== 'number') return false;

  if (!validateInspectionConfig(c.inspection)) return false;
  if (!validateContractsConfig(c.contracts)) return false;
  if (!validateMetersConfig(c.meters)) return false;
  if (!validateWorkOrdersConfig(c.workOrders)) return false;
  if (!validateScoringConfig(c.scoring)) return false;

  return true;
}

function validateInspectionConfig(config: unknown): boolean {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (typeof c.mapLayout !== 'string') return false;
  if (!Array.isArray(c.patrolPoints)) return false;
  if (!c.patrolPoints.every(validatePatrolPoint)) return false;
  if (!Array.isArray(c.patrolRoute) || !c.patrolRoute.every((i: unknown) => typeof i === 'number')) return false;
  if (typeof c.observeTime !== 'number') return false;
  if (typeof c.memoryTest !== 'boolean') return false;

  return true;
}

function validatePatrolPoint(point: unknown): point is PatrolPoint {
  if (typeof point !== 'object' || point === null) return false;

  const p = point as Record<string, unknown>;

  if (typeof p.id !== 'string') return false;
  if (typeof p.x !== 'number') return false;
  if (typeof p.y !== 'number') return false;
  if (typeof p.name !== 'string') return false;
  if (typeof p.description !== 'string') return false;

  return true;
}

function validateContractsConfig(config: unknown): boolean {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (!Array.isArray(c.tenants)) return false;
  if (!c.tenants.every(validateTenant)) return false;
  if (!Array.isArray(c.approvalOptions)) return false;
  if (typeof c.correctAnswers !== 'object' || c.correctAnswers === null) return false;
  if (typeof c.timePerContract !== 'number') return false;

  return true;
}

function validateTenant(tenant: unknown): tenant is Tenant {
  if (typeof tenant !== 'object' || tenant === null) return false;

  const t = tenant as Record<string, unknown>;

  if (typeof t.id !== 'string') return false;
  if (typeof t.name !== 'string') return false;
  if (!['office', 'retail', 'restaurant', 'warehouse'].includes(t.type as string)) return false;
  if (typeof t.area !== 'number') return false;
  if (typeof t.rentOffer !== 'number') return false;
  if (typeof t.contractTerm !== 'number') return false;
  if (typeof t.deposit !== 'number') return false;
  if (typeof t.businessScope !== 'string') return false;
  if (!['A', 'B', 'C'].includes(t.creditRating as string)) return false;

  return true;
}

function validateMetersConfig(config: unknown): boolean {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (!Array.isArray(c.waterMeters)) return false;
  if (!c.waterMeters.every(validateMeterReading)) return false;
  if (!Array.isArray(c.electricMeters)) return false;
  if (!c.electricMeters.every(validateMeterReading)) return false;
  if (typeof c.unitPrices !== 'object' || c.unitPrices === null) return false;
  
  const prices = c.unitPrices as Record<string, unknown>;
  if (typeof prices.water !== 'number') return false;
  if (typeof prices.electricity !== 'number') return false;
  if (typeof c.tolerance !== 'number') return false;

  return true;
}

function validateMeterReading(reading: unknown): reading is MeterReading {
  if (typeof reading !== 'object' || reading === null) return false;

  const r = reading as Record<string, unknown>;

  if (typeof r.id !== 'string') return false;
  if (typeof r.tenantId !== 'string') return false;
  if (typeof r.previousReading !== 'number') return false;
  if (typeof r.currentReading !== 'number') return false;
  if (typeof r.displayValue !== 'number') return false;
  if (typeof r.tolerance !== 'number') return false;

  return true;
}

function validateWorkOrdersConfig(config: unknown): boolean {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (typeof c.enabled !== 'boolean') return false;
  if (!Array.isArray(c.orders)) return false;
  if (!c.orders.every(validateWorkOrder)) return false;
  if (typeof c.timeout !== 'number') return false;
  if (typeof c.retryPenalty !== 'number') return false;

  return true;
}

function validateWorkOrder(order: unknown): order is WorkOrder {
  if (typeof order !== 'object' || order === null) return false;

  const o = order as Record<string, unknown>;

  if (typeof o.id !== 'string') return false;
  if (!['repair', 'complaint', 'maintenance', 'emergency'].includes(o.type as string)) return false;
  if (typeof o.title !== 'string') return false;
  if (typeof o.description !== 'string') return false;
  if (!['low', 'medium', 'high', 'critical'].includes(o.urgency as string)) return false;
  if (typeof o.triggerAt !== 'number') return false;
  if (!Array.isArray(o.options)) return false;
  if (typeof o.correctOptionId !== 'string') return false;

  return true;
}

function validateScoringConfig(config: unknown): boolean {
  if (typeof config !== 'object' || config === null) return false;

  const c = config as Record<string, unknown>;

  if (typeof c.inspectionWeight !== 'number') return false;
  if (typeof c.contractWeight !== 'number') return false;
  if (typeof c.meterWeight !== 'number') return false;
  if (typeof c.speedBonus !== 'number') return false;
  if (typeof c.accuracyBonus !== 'number') return false;

  const total = c.inspectionWeight + c.contractWeight + c.meterWeight + c.speedBonus + c.accuracyBonus;
  if (Math.abs(total - 1) > 0.001) return false;

  return true;
}

export function validateMeterReadingValue(
  value: number,
  previousReading: number,
  tolerance: number
): { valid: boolean; error: string | null } {
  if (isNaN(value)) {
    return { valid: false, error: '请输入有效数字' };
  }
  if (value < 0) {
    return { valid: false, error: '读数不能为负数' };
  }
  if (value < previousReading) {
    return { valid: false, error: '当前读数不能小于上期读数' };
  }
  if (value - previousReading > tolerance * 10) {
    return { valid: false, error: '读数增长异常，请核对' };
  }
  return { valid: true, error: null };
}
