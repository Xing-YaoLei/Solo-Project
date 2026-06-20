import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

interface SensitiveFieldConfig {
  name: string;
  visibleRoles: UserRole[];
  maskPattern?: string;
}

@Injectable()
export class PermissionsService {
  private sensitiveFields: SensitiveFieldConfig[] = [
    {
      name: 'visitorPhone',
      visibleRoles: [UserRole.SUPERVISOR, UserRole.OPERATOR],
      maskPattern: 'phone',
    },
    {
      name: 'visitorIdCard',
      visibleRoles: [UserRole.SUPERVISOR],
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

  getSensitiveFields() {
    return this.sensitiveFields;
  }

  updateSensitiveFields(fields: SensitiveFieldConfig[]) {
    this.sensitiveFields = fields;
    return this.sensitiveFields;
  }

  isFieldVisible(fieldName: string, role: UserRole): boolean {
    const config = this.sensitiveFields.find((f) => f.name === fieldName);
    if (!config) return true;
    return config.visibleRoles.includes(role);
  }

  getMaskPattern(fieldName: string): string | undefined {
    const config = this.sensitiveFields.find((f) => f.name === fieldName);
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
