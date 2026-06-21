import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

interface SensitiveFieldConfig {
  field: string;
  label: string;
  roles: UserRole[];
  maskPattern?: string;
}

interface LegacyConfig {
  name: string;
  visibleRoles: UserRole[];
  maskPattern?: string;
}

@Injectable()
export class PermissionsService {
  private sensitiveFields: SensitiveFieldConfig[] = [
    {
      field: 'visitorPhone',
      label: '游客手机号',
      roles: [UserRole.SUPERVISOR, UserRole.OPERATOR],
      maskPattern: 'phone',
    },
    {
      field: 'visitorIdCard',
      label: '游客身份证',
      roles: [UserRole.SUPERVISOR],
      maskPattern: 'idCard',
    },
  ];

  getRoles() {
    return [
      { value: UserRole.VISITOR, label: '游客' },
      { value: UserRole.TICKET_STAFF, label: '票务员' },
      { value: UserRole.PATROL_STAFF, label: '巡逻员' },
      { value: UserRole.OPERATOR, label: '运营调度' },
      { value: UserRole.SUPERVISOR, label: '主管' },
    ];
  }

  getSensitiveFields(): SensitiveFieldConfig[] {
    return this.sensitiveFields;
  }

  updateSensitiveField(field: string, patch: { roles?: UserRole[]; maskPattern?: string }): SensitiveFieldConfig {
    const idx = this.sensitiveFields.findIndex((f) => f.field === field);
    if (idx === -1) {
      const newConfig: SensitiveFieldConfig = {
        field,
        label: field,
        roles: patch.roles || [],
        maskPattern: patch.maskPattern,
      };
      this.sensitiveFields.push(newConfig);
      return newConfig;
    }
    const existing = this.sensitiveFields[idx];
    const updated: SensitiveFieldConfig = {
      ...existing,
      roles: patch.roles !== undefined ? patch.roles : existing.roles,
      maskPattern: patch.maskPattern !== undefined ? patch.maskPattern : existing.maskPattern,
    };
    this.sensitiveFields[idx] = updated;
    return updated;
  }

  updateSensitiveFieldsBatch(fields: LegacyConfig[]): SensitiveFieldConfig[] {
    this.sensitiveFields = fields.map((f) => ({
      field: f.name,
      label: f.name,
      roles: f.visibleRoles,
      maskPattern: f.maskPattern,
    }));
    return this.sensitiveFields;
  }

  isFieldVisible(fieldName: string, role: UserRole): boolean {
    const config = this.sensitiveFields.find((f) => f.field === fieldName);
    if (!config) return true;
    return config.roles.includes(role);
  }

  getMaskPattern(fieldName: string): string | undefined {
    const config = this.sensitiveFields.find((f) => f.field === fieldName);
    return config?.maskPattern;
  }

  maskValue(value: string, pattern: string): string {
    if (!value) return value;
    if (pattern === 'phone' && value.length >= 11) {
      return value.substring(0, 3) + '****' + value.substring(7);
    }
    if (pattern === 'idCard' && value.length >= 18) {
      return value.substring(0, 6) + '********' + value.substring(14);
    }
    return value;
  }
}
