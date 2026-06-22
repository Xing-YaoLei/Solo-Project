import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@prisma/client';
import { PERMISSIONS_KEY } from './permissions.decorator';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(Permission),
  MANAGEMENT: [
    Permission.TASK_CREATE, Permission.TASK_ASSIGN, Permission.TASK_VIEW, Permission.TASK_EDIT,
    Permission.TASK_BATCH_UPDATE, Permission.EVIDENCE_VIEW, Permission.EVIDENCE_EDIT,
    Permission.EVIDENCE_SUBMIT, Permission.REVIEW_CONDUCT, Permission.REVIEW_APPROVE,
    Permission.REVIEW_REJECT, Permission.REVIEW_VIEW, Permission.CHECKLIST_CREATE,
    Permission.CHECKLIST_VIEW, Permission.CHECKLIST_EDIT, Permission.CHECKLIST_EXECUTE,
    Permission.SAMPLING_CREATE, Permission.SAMPLING_VIEW, Permission.SAMPLING_EDIT,
    Permission.SAMPLING_APPROVE, Permission.TEMPLATE_VIEW, Permission.TEMPLATE_USE,
    Permission.STATISTICS_VIEW, Permission.STATISTICS_EXPORT, Permission.AUDIT_LOG_VIEW,
    Permission.UNAUTHORIZED_VIEW,
  ],
  COMPLIANCE_OFFICER: [
    Permission.TASK_CREATE, Permission.TASK_VIEW, Permission.TASK_EDIT,
    Permission.EVIDENCE_CREATE, Permission.EVIDENCE_UPLOAD, Permission.EVIDENCE_VIEW,
    Permission.EVIDENCE_EDIT, Permission.EVIDENCE_SUBMIT, Permission.REVIEW_CONDUCT,
    Permission.REVIEW_VIEW, Permission.CHECKLIST_CREATE, Permission.CHECKLIST_VIEW,
    Permission.CHECKLIST_EDIT, Permission.CHECKLIST_EXECUTE, Permission.SAMPLING_CREATE,
    Permission.SAMPLING_VIEW, Permission.SAMPLING_EDIT, Permission.SAMPLING_APPROVE,
    Permission.TEMPLATE_VIEW, Permission.TEMPLATE_USE, Permission.STATISTICS_VIEW,
  ],
  AUDITOR: [
    Permission.TASK_VIEW, Permission.EVIDENCE_CREATE, Permission.EVIDENCE_UPLOAD,
    Permission.EVIDENCE_VIEW, Permission.EVIDENCE_EDIT, Permission.EVIDENCE_SUBMIT,
    Permission.CHECKLIST_VIEW, Permission.CHECKLIST_EXECUTE, Permission.SAMPLING_CREATE,
    Permission.SAMPLING_VIEW, Permission.SAMPLING_EDIT, Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_USE, Permission.STATISTICS_VIEW,
  ],
  BUSINESS_OWNER: [
    Permission.TASK_VIEW, Permission.EVIDENCE_CREATE, Permission.EVIDENCE_UPLOAD,
    Permission.EVIDENCE_VIEW, Permission.EVIDENCE_EDIT, Permission.EVIDENCE_SUBMIT,
    Permission.CHECKLIST_VIEW, Permission.SAMPLING_VIEW,
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('您没有执行此操作的权限');
    }

    return true;
  }
}
