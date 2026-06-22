'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { Permission, UserRole } from '@/lib/api/types';

export const usePermission = () => {
  const { user, permissions, hasPermission, hasRole } = useAuthStore();

  const role = useMemo(() => user?.role, [user]);

  const canViewTasks = useMemo(() => hasPermission(Permission.TASK_VIEW), [hasPermission]);
  const canCreateTask = useMemo(() => hasPermission(Permission.TASK_CREATE), [hasPermission]);
  const canEditTask = useMemo(() => hasPermission(Permission.TASK_EDIT), [hasPermission]);
  const canAssignTask = useMemo(() => hasPermission(Permission.TASK_ASSIGN), [hasPermission]);
  const canDeleteTask = useMemo(() => hasPermission(Permission.TASK_DELETE), [hasPermission]);

  const canViewEvidences = useMemo(() => hasPermission(Permission.EVIDENCE_VIEW), [hasPermission]);
  const canUploadEvidence = useMemo(
    () => hasPermission(Permission.EVIDENCE_UPLOAD),
    [hasPermission],
  );
  const canEditEvidence = useMemo(() => hasPermission(Permission.EVIDENCE_EDIT), [hasPermission]);
  const canDeleteEvidence = useMemo(
    () => hasPermission(Permission.EVIDENCE_DELETE),
    [hasPermission],
  );
  const canReviewEvidence = useMemo(
    () => hasPermission(Permission.REVIEW_CONDUCT),
    [hasPermission],
  );

  const canViewChecklists = useMemo(
    () => hasPermission(Permission.CHECKLIST_VIEW),
    [hasPermission],
  );
  const canEditChecklists = useMemo(
    () => hasPermission(Permission.CHECKLIST_EDIT),
    [hasPermission],
  );

  const canViewSamplings = useMemo(() => hasPermission(Permission.SAMPLING_VIEW), [hasPermission]);
  const canEditSamplings = useMemo(() => hasPermission(Permission.SAMPLING_EDIT), [hasPermission]);

  const canViewIssues = useMemo(() => hasPermission(Permission.AUDIT_LOG_VIEW), [hasPermission]);
  const canEditIssues = useMemo(() => hasPermission(Permission.TASK_EDIT), [hasPermission]);

  const canViewStatistics = useMemo(
    () => hasPermission(Permission.STATISTICS_VIEW),
    [hasPermission],
  );
  const canViewNotifications = useMemo(
    () => hasPermission(Permission.TASK_VIEW),
    [hasPermission],
  );
  const canViewAuditLogs = useMemo(
    () => hasPermission(Permission.AUDIT_LOG_VIEW),
    [hasPermission],
  );
  const canViewUnauthorized = useMemo(
    () => hasPermission(Permission.UNAUTHORIZED_VIEW),
    [hasPermission],
  );
  const canManageUsers = useMemo(() => hasPermission(Permission.USER_MANAGE), [hasPermission]);
  const canViewTemplates = useMemo(() => hasPermission(Permission.TEMPLATE_VIEW), [hasPermission]);
  const canCreateTemplate = useMemo(() => hasPermission(Permission.TEMPLATE_CREATE), [hasPermission]);
  const canEditTemplate = useMemo(() => hasPermission(Permission.TEMPLATE_EDIT), [hasPermission]);
  const canUseTemplate = useMemo(() => hasPermission(Permission.TEMPLATE_USE), [hasPermission]);
  const canSubmitEvidence = useMemo(() => hasPermission(Permission.EVIDENCE_SUBMIT), [hasPermission]);
  const canCreateEvidence = useMemo(() => hasPermission(Permission.EVIDENCE_CREATE), [hasPermission]);

  const check = useCallback(
    (perm: Permission | Permission[]): boolean => {
      return hasPermission(perm);
    },
    [hasPermission],
  );

  const checkRole = useCallback(
    (r: UserRole | UserRole[]): boolean => {
      return hasRole(r);
    },
    [hasRole],
  );

  return {
    role,
    permissions,
    check,
    checkRole,
    canViewTasks,
    canCreateTask,
    canEditTask,
    canAssignTask,
    canDeleteTask,
    canViewEvidences,
    canUploadEvidence,
    canEditEvidence,
    canDeleteEvidence,
    canReviewEvidence,
    canViewChecklists,
    canEditChecklists,
    canViewSamplings,
    canEditSamplings,
    canViewIssues,
    canEditIssues,
    canViewStatistics,
    canViewNotifications,
    canViewAuditLogs,
    canViewUnauthorized,
    canManageUsers,
    canViewTemplates,
    canCreateTemplate,
    canEditTemplate,
    canUseTemplate,
    canSubmitEvidence,
    canCreateEvidence,
  };
};
