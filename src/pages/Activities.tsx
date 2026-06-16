import { useEffect, useState } from 'react';
import { CalendarCheck, UserCheck, UserX } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getActivityRecords } from '@/services/api';
import type { ActivityRecord } from '@/types';

export default function Activities() {
  const { activityRecords, setActivityRecords } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getActivityRecords(selectedDate)
      .then(setActivityRecords)
      .catch(() => setActivityRecords(mockActivities()))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <CalendarCheck size={18} className="text-amber-400" />
        <h2 className="text-base font-semibold text-white/90">活动签到</h2>
        <div className="flex-1" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-amber-500/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">加载中...</div>
        ) : activityRecords.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">该日期暂无活动</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activityRecords.map((activity) => {
              const checkedIn = activity.attendees.filter((a) => a.status === 'checked_in').length;
              const absent = activity.attendees.filter((a) => a.status === 'absent');
              const total = activity.attendees.length;
              const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

              return (
                <div key={activity.id} className="bg-[#1B2A4A] rounded-lg border border-white/[0.06] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white/80">{activity.activityName}</h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {activity.startTime?.slice(11, 16)} - {activity.endTime?.slice(11, 16)} · {activity.location}
                      </p>
                    </div>
                    <div className={`text-lg font-bold font-[JetBrains_Mono,monospace] ${rate >= 80 ? 'text-emerald-400' : rate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {rate}%
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <UserCheck size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">已签到 {checkedIn}/{total}</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {activity.attendees.map((a) => (
                        <span
                          key={a.elderId}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            a.status === 'checked_in'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {a.status === 'checked_in' ? <UserCheck size={10} /> : <UserX size={10} />}
                          {a.elderName}
                          {a.checkInTime && (
                            <span className="text-white/30 font-[JetBrains_Mono,monospace]">
                              {a.checkInTime.slice(11, 16)}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    {absent.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-400/80">
                        <UserX size={11} />
                        缺席: {absent.map((a) => a.elderName).join('、')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function mockActivities(): ActivityRecord[] {
  return [
    {
      id: 'a1',
      activityName: '晨间健身操',
      activityDate: '2026-06-17',
      startTime: '2026-06-17T07:30:00',
      endTime: '2026-06-17T08:00:00',
      location: '1楼活动室',
      attendees: [
        { elderId: 'e1', elderName: '张奶奶', checkInTime: '2026-06-17T07:28:00', status: 'checked_in' },
        { elderId: 'e2', elderName: '李爷爷', checkInTime: '2026-06-17T07:32:00', status: 'checked_in' },
        { elderId: 'e3', elderName: '王奶奶', checkInTime: null, status: 'absent' },
        { elderId: 'e4', elderName: '赵大爷', checkInTime: '2026-06-17T07:35:00', status: 'checked_in' },
      ],
    },
    {
      id: 'a2',
      activityName: '手工制作课',
      activityDate: '2026-06-17',
      startTime: '2026-06-17T10:00:00',
      endTime: '2026-06-17T11:00:00',
      location: '2楼手工室',
      attendees: [
        { elderId: 'e1', elderName: '张奶奶', checkInTime: '2026-06-17T09:58:00', status: 'checked_in' },
        { elderId: 'e3', elderName: '王奶奶', checkInTime: '2026-06-17T10:05:00', status: 'checked_in' },
        { elderId: 'e5', elderName: '刘奶奶', checkInTime: null, status: 'absent' },
      ],
    },
    {
      id: 'a3',
      activityName: '午后茶话会',
      activityDate: '2026-06-17',
      startTime: '2026-06-17T14:30:00',
      endTime: '2026-06-17T15:30:00',
      location: '3楼休闲区',
      attendees: [
        { elderId: 'e2', elderName: '李爷爷', checkInTime: '2026-06-17T14:28:00', status: 'checked_in' },
        { elderId: 'e4', elderName: '赵大爷', checkInTime: '2026-06-17T14:33:00', status: 'checked_in' },
        { elderId: 'e5', elderName: '刘奶奶', checkInTime: '2026-06-17T14:35:00', status: 'checked_in' },
      ],
    },
  ];
}
