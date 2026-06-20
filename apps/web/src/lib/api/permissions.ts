import axiosInstance from '../axios';
import type { SensitiveFieldConfig } from '@scenic/shared';

export async function getSensitiveFieldConfigs(): Promise<SensitiveFieldConfig[]> {
  return axiosInstance.get('/api/permissions/sensitive-fields');
}

export async function updateSensitiveFieldConfig(
  field: string,
  data: Partial<SensitiveFieldConfig>
): Promise<SensitiveFieldConfig> {
  return axiosInstance.put(`/api/permissions/sensitive-fields/${field}`, data);
}
