import type { Hearing, FilterParams, AttendanceStatus, ReminderStatus, Reminder } from '@/types';
import { mockHearings, mockReminders } from '@/data/mockData';
import { getTimeSlot } from '@/lib/utils';

export function getFilteredHearings(filters: FilterParams): Hearing[] {
  return mockHearings.filter((hearing) => {
    if (filters.dateRange) {
      const hearingDate = new Date(hearing.hearingDate);
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      if (hearingDate < start || hearingDate > end) return false;
    }

    if (filters.caseTypes && filters.caseTypes.length > 0) {
      if (!hearing.case || !filters.caseTypes.includes(hearing.case.caseType)) return false;
    }

    if (filters.attendanceStatuses && filters.attendanceStatuses.length > 0) {
      if (!filters.attendanceStatuses.includes(hearing.attendanceStatus as AttendanceStatus)) return false;
    }

    if (filters.hasConflicts !== undefined) {
      if (hearing.hasConflict !== filters.hasConflicts) return false;
    }

    if (filters.timeSlots && filters.timeSlots.length > 0) {
      const slot = getTimeSlot(hearing.hearingTime);
      if (!filters.timeSlots.includes(slot)) return false;
    }

    if (filters.reminderStatuses && filters.reminderStatuses.length > 0) {
      if (!hearing.reminders || hearing.reminders.length === 0) return false;
      const hasMatchingReminder = hearing.reminders.some((r) =>
        (filters.reminderStatuses as ReminderStatus[]).includes(r.status)
      );
      if (!hasMatchingReminder) return false;
    }

    return true;
  });
}

export function getHearingById(id: string): Hearing | undefined {
  return mockHearings.find((h) => h.id === id);
}

export function getAttendanceStats(hearings: Hearing[]) {
  const stats = {
    ATTENDED: 0,
    ABSENT: 0,
    POSTPONED: 0,
    CANCELLED: 0,
  };

  hearings.forEach((h) => {
    stats[h.attendanceStatus as keyof typeof stats]++;
  });

  return Object.entries(stats).map(([status, count]) => ({
    status,
    count,
    percentage: hearings.length > 0 ? count / hearings.length : 0,
  }));
}

export function getDailyHearingsCount(hearings: Hearing[]) {
  const dateMap = new Map<string, number>();

  hearings.forEach((h) => {
    const date = new Date(h.hearingDate).toISOString().split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getCaseTypeDistribution(hearings: Hearing[]) {
  const typeMap = new Map<string, number>();

  hearings.forEach((h) => {
    const type = h.case?.caseType || '其他';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
}

export function getRemindersByHearings(hearings: Hearing[], filters?: FilterParams): Reminder[] {
  const hearingIds = new Set(hearings.map((h) => h.id));
  let reminders = mockReminders.filter((r) => hearingIds.has(r.hearingId));

  if (filters?.reminderStatuses && filters.reminderStatuses.length > 0) {
    reminders = reminders.filter((r) =>
      (filters.reminderStatuses as ReminderStatus[]).includes(r.status)
    );
  }

  return reminders.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}
