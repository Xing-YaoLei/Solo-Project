import { prisma } from '@/lib/prisma';
import type { ThresholdConfig } from '@prisma/client';

export const DEFAULT_THRESHOLDS = {
  revisit_rate_warning: {
    key: 'revisit_rate_warning',
    name: '复诊率预警阈值',
    value: '70',
    type: 'percentage',
    description: '复诊率低于该值时触发预警',
    category: 'revisit',
  },
  revisit_rate_critical: {
    key: 'revisit_rate_critical',
    name: '复诊率严重阈值',
    value: '50',
    type: 'percentage',
    description: '复诊率低于该值时触发严重预警',
    category: 'revisit',
  },
  missed_appointment_warning: {
    key: 'missed_appointment_warning',
    name: '爽约次数预警阈值',
    value: '2',
    type: 'number',
    description: '患者累计爽约次数达到该值时触发预警',
    category: 'missed',
  },
  missed_appointment_critical: {
    key: 'missed_appointment_critical',
    name: '爽约次数严重阈值',
    value: '4',
    type: 'number',
    description: '患者累计爽约次数达到该值时触发严重预警',
    category: 'missed',
  },
  treatment_duration_warning: {
    key: 'treatment_duration_warning',
    name: '治疗周期预警阈值(天)',
    value: '730',
    type: 'number',
    description: '正畸治疗周期超过该天数时触发预警',
    category: 'treatment',
  },
  payment_completion_warning: {
    key: 'payment_completion_warning',
    name: '缴费完成率预警阈值',
    value: '80',
    type: 'percentage',
    description: '缴费完成率低于该值时触发预警',
    category: 'payment',
  },
};

export async function getThresholdConfig(configKey: string): Promise<ThresholdConfig | null> {
  return prisma.thresholdConfig.findUnique({
    where: { configKey },
  });
}

export async function getAllThresholdConfigs(): Promise<ThresholdConfig[]> {
  return prisma.thresholdConfig.findMany({
    orderBy: [{ category: 'asc' }, { configName: 'asc' }],
  });
}

export async function getThresholdConfigsByCategory(category: string): Promise<ThresholdConfig[]> {
  return prisma.thresholdConfig.findMany({
    where: { category },
    orderBy: { configName: 'asc' },
  });
}

export async function getThresholdValue(configKey: string): Promise<string> {
  const config = await getThresholdConfig(configKey);
  if (config) return config.configValue;
  const defaultConfig = DEFAULT_THRESHOLDS[configKey as keyof typeof DEFAULT_THRESHOLDS];
  return defaultConfig?.value || '';
}

export async function getThresholdNumberValue(configKey: string): Promise<number> {
  const value = await getThresholdValue(configKey);
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

export async function updateThresholdConfig(
  configKey: string,
  configValue: string,
  updatedBy?: string
): Promise<ThresholdConfig> {
  return prisma.thresholdConfig.update({
    where: { configKey },
    data: {
      configValue,
      updatedBy,
    },
  });
}

export async function upsertThresholdConfig(
  data: {
    configKey: string;
    configName: string;
    configValue: string;
    configType: string;
    description?: string;
    category?: string;
  },
  updatedBy?: string
): Promise<ThresholdConfig> {
  return prisma.thresholdConfig.upsert({
    where: { configKey: data.configKey },
    create: {
      ...data,
      updatedBy,
    },
    update: {
      configValue: data.configValue,
      configName: data.configName,
      description: data.description,
      category: data.category,
      updatedBy,
    },
  });
}

export async function initializeDefaultThresholds(): Promise<void> {
  for (const key of Object.keys(DEFAULT_THRESHOLDS) as Array<keyof typeof DEFAULT_THRESHOLDS>) {
    const config = DEFAULT_THRESHOLDS[key];
    await upsertThresholdConfig({
      configKey: config.key,
      configName: config.name,
      configValue: config.value,
      configType: config.type,
      description: config.description,
      category: config.category,
    });
  }
}

export async function batchUpdateThresholds(
  updates: Array<{ configKey: string; configValue: string }>,
  updatedBy?: string
): Promise<ThresholdConfig[]> {
  const results: ThresholdConfig[] = [];
  for (const update of updates) {
    const result = await updateThresholdConfig(update.configKey, update.configValue, updatedBy);
    results.push(result);
  }
  return results;
}
