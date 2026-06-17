import { useState, useEffect, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { CleaningSchedule, User } from '@/types';
import { schedulesApi, usersApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatTime,
  formatDate,
  getMonthDates,
  WEEKDAYS,
  RISK_COLORS,
  RISK_LABELS,
  cn,
} from '@/utils/format';

type ViewMode = 'month' | 'week' | 'resource';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [selectedCleaner, setSelectedCleaner] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const hasRole = useAuthStore((s) => s.hasRole);
  const currentUser = useAuthStore((s) => s.currentUser);

  const loadData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const date_from = monthStart.toISOString().split('T')[0];
      const date_to = monthEnd.toISOString().split('T')[0];

      const cleanerParam =
        currentUser?.role === 'cleaner'
          ? currentUser.id
          : selectedCleaner;

      const [schedulesRes, cleanersRes] = await Promise.all([
        schedulesApi.calendar({
          date_from,
          date_to,
          cleaner_id: cleanerParam,
        }),
        currentUser?.role !== 'cleaner' ? usersApi.getCleaners() : Promise.resolve({ data: [] }),
      ]);
      setSchedules(schedulesRes.data);
      setCleaners(cleanersRes.data);
    } catch (err) {
      console.error('加载日历数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate, selectedCleaner]);

  const monthDates = useMemo(() => {
    return getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter((s) => {
      const sDate = new Date(s.scheduled_date);
      return (
        sDate.getFullYear() === date.getFullYear() &&
        sDate.getMonth() === date.getMonth() &&
        sDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth()
    );
  };

  const monthTitle = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              {(['month', 'week', 'resource'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-4 py-1.5 text-sm rounded-md transition-colors',
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {mode === 'month' ? '月视图' : mode === 'week' ? '周视图' : '人员视图'}
                </button>
              ))}
            </div>

            {hasRole('admin', 'supervisor') && (
              <div className="relative">
                <select
                  value={selectedCleaner || ''}
                  onChange={(e) =>
                    setSelectedCleaner(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="input pr-8 py-1.5 text-sm"
                >
                  <option value="">全部保洁员</option>
                  {cleaners.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goToToday} className="btn-outline py-1.5 text-sm">
              今天
            </button>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={goToPrevMonth}
                className="p-1.5 rounded-md hover:bg-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 text-sm font-medium text-gray-900 min-w-[120px] text-center">
                {monthTitle}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1.5 rounded-md hover:bg-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : viewMode === 'month' ? (
        <MonthView
          monthDates={monthDates}
          schedules={schedules}
          getSchedulesForDate={getSchedulesForDate}
          isToday={isToday}
          isCurrentMonth={isCurrentMonth}
        />
      ) : viewMode === 'week' ? (
        <WeekView
          currentDate={currentDate}
          schedules={schedules}
          goToPrev={() =>
            setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))
          }
          goToNext={() =>
            setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))
          }
        />
      ) : (
        <ResourceView schedules={schedules} cleaners={cleaners} currentDate={currentDate} />
      )}
    </div>
  );
}

function MonthView({
  monthDates,
  getSchedulesForDate,
  isToday,
  isCurrentMonth,
}: {
  monthDates: Date[];
  schedules: CleaningSchedule[];
  getSchedulesForDate: (date: Date) => CleaningSchedule[];
  isToday: (date: Date) => boolean;
  isCurrentMonth: (date: Date) => boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={cn(
              'px-3 py-3 text-center text-sm font-medium',
              idx >= 5 ? 'text-red-500' : 'text-gray-600'
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDates.map((date, dateIdx) => {
          const daySchedules = getSchedulesForDate(date);
          return (
            <div
              key={dateIdx}
              className={cn(
                'min-h-[120px] border-b border-r border-gray-100 p-2',
                !isCurrentMonth(date) && 'bg-gray-50/50',
                dateIdx % 7 === 6 && 'border-r-0'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday(date) && 'bg-primary-600 text-white',
                    !isCurrentMonth(date) && 'text-gray-400',
                    !isToday(date) && isCurrentMonth(date) && 'text-gray-700'
                  )}
                >
                  {date.getDate()}
                </span>
                {daySchedules.length > 0 && (
                  <span className="text-xs text-gray-500">{daySchedules.length}项</span>
                )}
              </div>
              <div className="space-y-1">
                {daySchedules.slice(0, 3).map((schedule) => (
                  <Link
                    key={schedule.id}
                    to={`/schedules/${schedule.id}`}
                    className={cn(
                      'block px-2 py-1 rounded text-xs transition-all hover:shadow-sm truncate border',
                      STATUS_COLORS[schedule.status],
                      schedule.has_conflict && 'ring-2 ring-red-400 ring-offset-1'
                    )}
                  >
                    {schedule.has_conflict && (
                      <AlertTriangle size={10} className="inline mr-1 -mt-0.5" />
                    )}
                    {formatTime(schedule.start_time)} {schedule.apartment?.apartment_code || 'Apt'}
                  </Link>
                ))}
                {daySchedules.length > 3 && (
                  <Link
                    to={`/schedules?date_from=${date.toISOString().split('T')[0]}&date_to=${date.toISOString().split('T')[0]}`}
                    className="block px-2 py-0.5 text-xs text-gray-500 hover:text-primary-600"
                  >
                    +{daySchedules.length - 3} 更多
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  schedules,
  goToPrev,
  goToNext,
}: {
  currentDate: Date;
  schedules: CleaningSchedule[];
  goToPrev: () => void;
  goToNext: () => void;
}) {
  const getWeekDates = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);

  const getSchedulesForDateTime = (date: Date, hour: number) => {
    return schedules.filter((s) => {
      const sDate = new Date(s.scheduled_date);
      const sStartHour = new Date(s.start_time).getHours();
      return (
        sDate.getFullYear() === date.getFullYear() &&
        sDate.getMonth() === date.getMonth() &&
        sDate.getDate() === date.getDate() &&
        sStartHour === hour
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="p-3 text-center text-xs font-medium text-gray-500 border-r border-gray-200">
          <button onClick={goToPrev} className="p-1 hover:bg-gray-200 rounded">
            <ChevronLeft size={16} className="inline" />
          </button>
          <button onClick={goToNext} className="p-1 hover:bg-gray-200 rounded ml-1">
            <ChevronRight size={16} className="inline" />
          </button>
          <span className="ml-2">时间</span>
        </div>
        {weekDates.map((date, idx) => (
          <div
            key={idx}
            className={cn(
              'p-3 text-center border-r border-gray-200 last:border-r-0',
              isToday(date) && 'bg-primary-50'
            )}
          >
            <div className="text-xs text-gray-500">{WEEKDAYS[idx]}</div>
            <div
              className={cn(
                'text-lg font-semibold mt-0.5',
                isToday(date) ? 'text-primary-600' : 'text-gray-900'
              )}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 min-h-[80px] border-b border-gray-100">
            <div className="p-2 text-xs text-gray-500 text-center border-r border-gray-100 py-4">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDates.map((date, dayIdx) => {
              const hourSchedules = getSchedulesForDateTime(date, hour);
              return (
                <div
                  key={dayIdx}
                  className={cn(
                    'p-1 border-r border-gray-100 last:border-r-0',
                    isToday(date) && 'bg-primary-50/30'
                  )}
                >
                  {hourSchedules.map((schedule) => (
                    <Link
                      key={schedule.id}
                      to={`/schedules/${schedule.id}`}
                      className={cn(
                        'block px-2 py-1.5 rounded text-xs transition-all hover:shadow-sm mb-1 border',
                        STATUS_COLORS[schedule.status]
                      )}
                    >
                      <div className="font-medium truncate">
                        {schedule.apartment?.apartment_code}
                      </div>
                      <div className="flex items-center gap-1 opacity-80 mt-0.5">
                        <Clock size={10} />
                        {formatTime(schedule.start_time)}
                        {schedule.has_conflict && (
                          <AlertTriangle size={10} className="text-red-500 ml-auto" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceView({
  schedules,
  cleaners,
  currentDate,
}: {
  schedules: CleaningSchedule[];
  cleaners: User[];
  currentDate: Date;
}) {
  const getWeekDates = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getScheduleForCleanerDate = (cleanerId: number, date: Date) => {
    return schedules.filter((s) => {
      const sDate = new Date(s.scheduled_date);
      return (
        s.cleaner_id === cleanerId &&
        sDate.getFullYear() === date.getFullYear() &&
        sDate.getMonth() === date.getMonth() &&
        sDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 w-40">
                保洁员
              </th>
              {weekDates.map((date, idx) => (
                <th
                  key={idx}
                  className={cn(
                    'px-3 py-3 text-center text-xs font-medium border-r border-gray-200 last:border-r-0 min-w-[100px]',
                    idx >= 5 ? 'text-red-500' : 'text-gray-500',
                    isToday(date) && 'bg-primary-50 text-primary-600'
                  )}
                >
                  <div>{WEEKDAYS[idx]}</div>
                  <div className="text-sm font-semibold mt-0.5">{date.getDate()}日</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cleaners.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  暂无保洁员数据
                </td>
              </tr>
            ) : (
              cleaners.map((cleaner) => (
                <tr key={cleaner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {cleaner.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cleaner.full_name}
                        </div>
                        <div className="text-xs text-gray-500">{cleaner.phone || ''}</div>
                      </div>
                    </div>
                  </td>
                  {weekDates.map((date, dayIdx) => {
                    const daySchedules = getScheduleForCleanerDate(cleaner.id, date);
                    return (
                      <td
                        key={dayIdx}
                        className={cn(
                          'px-2 py-2 border-r border-gray-100 last:border-r-0 align-top',
                          isToday(date) && 'bg-primary-50/30'
                        )}
                      >
                        <div className="space-y-1">
                          {daySchedules.map((schedule) => (
                            <Link
                              key={schedule.id}
                              to={`/schedules/${schedule.id}`}
                              className={cn(
                                'block p-2 rounded text-xs transition-all border',
                                STATUS_COLORS[schedule.status]
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium truncate">
                                  {schedule.apartment?.apartment_code}
                                </span>
                                {schedule.has_conflict && (
                                  <span className={cn('badge text-[10px]', RISK_COLORS[schedule.risk_level || 'high'])}>
                                    <AlertTriangle size={9} className="inline mr-0.5" />
                                    {RISK_LABELS[schedule.risk_level || 'high']}
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 opacity-75">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
