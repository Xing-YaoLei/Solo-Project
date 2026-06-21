import { UserRole } from '../types';

export const canCreateHearing = (role: UserRole) => [UserRole.Lawyer, UserRole.Assistant, UserRole.Partner].includes(role);
export const canEditHearing = (role: UserRole) => [UserRole.Lawyer, UserRole.Assistant, UserRole.Partner].includes(role);
export const canDeleteHearing = (role: UserRole) => role === UserRole.Partner;
export const canManageConflicts = (role: UserRole) => role === UserRole.Partner;
export const canManageReminders = (role: UserRole) => [UserRole.Lawyer, UserRole.Assistant, UserRole.Partner].includes(role);
export const canViewStatistics = (role: UserRole) => [UserRole.Partner, UserRole.Lawyer].includes(role);
export const canManageCapacity = (role: UserRole) => role === UserRole.Partner;
export const canUpdateAttendance = (role: UserRole) => [UserRole.Lawyer, UserRole.Assistant].includes(role);
export const canViewClientFeedback = (role: UserRole) => [UserRole.Partner, UserRole.Lawyer].includes(role);
