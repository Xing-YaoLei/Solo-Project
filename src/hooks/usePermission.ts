import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole, Case, Invoice, User } from '@/types';

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const canAccess = useAuthStore((state) => state.canAccess);

  const isPartner = useMemo(() => hasRole('partner'), [hasRole]);
  const isLawyer = useMemo(() => hasRole('lawyer'), [hasRole]);
  const isAssistant = useMemo(() => hasRole('assistant'), [hasRole]);
  const isClient = useMemo(() => hasRole('client'), [hasRole]);

  const canViewAllCases = useMemo(() => canAccess('view_all_cases'), [canAccess]);
  const canViewAllInvoices = useMemo(() => canAccess('view_all_invoices'), [canAccess]);
  const canManageUsers = useMemo(() => canAccess('manage_users'), [canAccess]);
  const canExportData = useMemo(() => canAccess('export_data'), [canAccess]);
  const canShareReports = useMemo(() => canAccess('share_reports'), [canAccess]);
  const canViewAnalytics = useMemo(() => canAccess('view_analytics'), [canAccess]);
  const canApprovePayments = useMemo(() => canAccess('approve_payments'), [canAccess]);

  const canViewCase = (caseItem: Case): boolean => {
    if (!user) return false;
    if (canViewAllCases) return true;
    return caseItem.lawyer_id === user.id || caseItem.client_id === user.id;
  };

  const canViewInvoice = (invoice: Invoice): boolean => {
    if (!user) return false;
    if (canViewAllInvoices) return true;
    return invoice.case?.lawyer_id === user.id || invoice.case?.client_id === user.id;
  };

  const filterCasesByPermission = (cases: Case[]): Case[] => {
    if (!user) return [];
    if (canViewAllCases) return cases;
    return cases.filter(
      (c) => c.lawyer_id === user.id || c.client_id === user.id
    );
  };

  const filterInvoicesByPermission = (invoices: Invoice[]): Invoice[] => {
    if (!user) return [];
    if (canViewAllInvoices) return invoices;
    return invoices.filter(
      (i) => i.case?.lawyer_id === user.id || i.case?.client_id === user.id
    );
  };

  const filterUsersByPermission = (users: User[]): User[] => {
    if (!user) return [];
    if (isPartner) return users;
    if (isLawyer || isAssistant) {
      return users.filter((u) => u.id === user.id || u.role === 'client');
    }
    return users.filter((u) => u.id === user.id);
  };

  const checkDataAccess = (resourceOwnerId: string): boolean => {
    if (!user) return false;
    if (isPartner) return true;
    return resourceOwnerId === user.id;
  };

  const getAccessibleRoles = (): UserRole[] => {
    if (isPartner) return ['partner', 'lawyer', 'assistant', 'client'];
    if (isLawyer) return ['lawyer', 'assistant', 'client'];
    if (isAssistant) return ['assistant', 'client'];
    return ['client'];
  };

  const canManageUser = (targetUser: User): boolean => {
    if (!user) return false;
    if (isPartner) return true;
    if (isLawyer && (targetUser.role === 'assistant' || targetUser.role === 'client')) {
      return true;
    }
    return false;
  };

  return {
    user,
    hasRole,
    canAccess,
    isPartner,
    isLawyer,
    isAssistant,
    isClient,
    canViewAllCases,
    canViewAllInvoices,
    canManageUsers,
    canExportData,
    canShareReports,
    canViewAnalytics,
    canApprovePayments,
    canViewCase,
    canViewInvoice,
    filterCasesByPermission,
    filterInvoicesByPermission,
    filterUsersByPermission,
    checkDataAccess,
    getAccessibleRoles,
    canManageUser,
  };
};

export default usePermission;
