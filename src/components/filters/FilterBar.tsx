'use client';

import { useFilterStore } from '@/store/useFilterStore';
import { MultiSelect, SingleSelect } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { X, RotateCcw } from 'lucide-react';
import { getFilterDescription } from '@/services/exportService';
import type { AttendanceStatus, ReminderStatus } from '@/types';

const caseTypeOptions = [
  { value: '民事', label: '民事' },
  { value: '刑事', label: '刑事' },
  { value: '行政', label: '行政' },
  { value: '商事', label: '商事' },
  { value: '劳动', label: '劳动' },
  { value: '婚姻家庭', label: '婚姻家庭' },
  { value: '知识产权', label: '知识产权' },
];

const attendanceStatusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: 'ATTENDED', label: '已到场' },
  { value: 'ABSENT', label: '未到场' },
  { value: 'POSTPONED', label: '已延期' },
  { value: 'CANCELLED', label: '已取消' },
];

const timeSlotOptions = [
  { value: '上午', label: '上午 (8:00-12:00)' },
  { value: '午间', label: '午间 (12:00-14:00)' },
  { value: '下午', label: '下午 (14:00-18:00)' },
  { value: '晚间', label: '晚间 (18:00以后)' },
];

const reminderStatusOptions: Array<{ value: ReminderStatus; label: string }> = [
  { value: 'SENT', label: '已发送' },
  { value: 'OPENED', label: '已打开' },
  { value: 'FAILED', label: '发送失败' },
];

const hasConflictOptions = [
  { value: 'true', label: '有冲突' },
  { value: 'false', label: '无冲突' },
];

export function FilterBar() {
  const {
    filters,
    setCaseTypes,
    setAttendanceStatuses,
    setHasConflicts,
    setTimeSlots,
    setReminderStatuses,
    setDateRange,
    clearFilters,
  } = useFilterStore();

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      filters[key as keyof typeof filters] !== undefined &&
      (Array.isArray(filters[key as keyof typeof filters])
        ? (filters[key as keyof typeof filters] as unknown[]).length > 0
        : true)
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">案件类型</label>
          <MultiSelect
            options={caseTypeOptions}
            value={filters.caseTypes || []}
            onChange={(v) => setCaseTypes(v)}
            placeholder="全部案件类型"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">到场状态</label>
          <MultiSelect
            options={attendanceStatusOptions}
            value={(filters.attendanceStatuses as string[]) || []}
            onChange={(v) => setAttendanceStatuses(v as AttendanceStatus[])}
            placeholder="全部状态"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">时段筛选</label>
          <MultiSelect
            options={timeSlotOptions}
            value={filters.timeSlots || []}
            onChange={(v) => setTimeSlots(v)}
            placeholder="全部时段"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">利益冲突</label>
          <SingleSelect
            options={hasConflictOptions}
            value={filters.hasConflicts?.toString()}
            onChange={(v) =>
              setHasConflicts(v === undefined ? undefined : v === 'true')
            }
            placeholder="全部"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">提醒状态</label>
          <MultiSelect
            options={reminderStatusOptions}
            value={(filters.reminderStatuses as string[]) || []}
            onChange={(v) => setReminderStatuses(v as ReminderStatus[])}
            placeholder="全部提醒状态"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">时间范围</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={
                filters.dateRange?.start
                  ? new Date(filters.dateRange.start).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => {
                const start = e.target.value ? new Date(e.target.value) : undefined;
                const end = filters.dateRange?.end;
                if (start && end) {
                  setDateRange({ start, end });
                } else if (start) {
                  setDateRange({ start, end: new Date() });
                } else {
                  setDateRange(undefined);
                }
              }}
            />
            <input
              type="date"
              className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={
                filters.dateRange?.end
                  ? new Date(filters.dateRange.end).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => {
                const end = e.target.value ? new Date(e.target.value) : undefined;
                const start = filters.dateRange?.start;
                if (start && end) {
                  setDateRange({ start, end });
                } else if (end) {
                  setDateRange({ start: new Date(0), end });
                } else {
                  setDateRange(undefined);
                }
              }}
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">当前筛选:</span>
            <span>{getFilterDescription(filters)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4" />
            清除筛选
          </Button>
        </div>
      )}
    </div>
  );
}
