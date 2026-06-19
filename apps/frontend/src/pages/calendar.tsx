import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import api from '@/lib/api';
import { cn, getStatusText, getStatusClass } from '@/lib/utils';

interface CalendarDay {
  date: string;
  status: string;
  price: number;
  notes: string | null;
}

interface RoomCalendar {
  room: {
    id: number;
    roomNumber: string;
    roomType: string;
  };
  calendar: CalendarDay[];
}

export default function CalendarPage() {
  const [propertyId, setPropertyId] = useState<number>(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<{
    dates: string[];
    rooms: RoomCalendar[];
  }>({ dates: [], rooms: [] });
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [propertyId, currentDate]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate);
      start.setDate(1);
      const end = new Date(currentDate);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);

      const res = await api.get(`/calendar/property/${propertyId}`, {
        params: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
      });
      setCalendarData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const today = new Date();
  const isToday = (dateStr: string) => {
    return dateStr === today.toISOString().split('T')[0];
  };

  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const monthName = currentDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(Number(e.target.value))}
            className="input w-48"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-md">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-gray-800 min-w-[140px] text-center">
            {monthName}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-md">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-1">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="btn btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" />
            批量设置
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-green-100 border border-green-300"></span>
          <span className="text-gray-600">可用</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-blue-500"></span>
          <span className="text-gray-600">占用</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-yellow-400"></span>
          <span className="text-gray-600">清洁中</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-gray-400"></span>
          <span className="text-gray-600">维护</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 p-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">
                    房间
                  </th>
                  {calendarData.dates.map((date) => (
                    <th
                      key={date}
                      className={cn(
                        'border-b border-r border-gray-200 p-2 text-center text-sm font-medium min-w-[80px]',
                        isToday(date) && 'bg-blue-50 text-blue-600',
                        isWeekend(date) && !isToday(date) && 'bg-gray-100'
                      )}
                    >
                      <div>{new Date(date).getDate()}日</div>
                      <div className="text-xs font-normal text-gray-500">
                        {['日', '一', '二', '三', '四', '五', '六'][new Date(date).getDay()]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarData.rooms.map((roomData) => (
                  <tr key={roomData.room.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-3">
                      <div className="font-medium text-gray-800">
                        {roomData.room.roomNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {roomData.room.roomType}
                      </div>
                    </td>
                    {roomData.calendar.map((day) => (
                      <td
                        key={day.date}
                        className={cn(
                          'border-b border-r border-gray-200 p-1',
                          isToday(day.date) && 'bg-blue-50',
                          isWeekend(day.date) && !isToday(day.date) && 'bg-gray-50'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded text-center cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all',
                            day.status === 'AVAILABLE' && 'bg-green-50 text-green-700',
                            day.status === 'OCCUPIED' && 'bg-blue-500 text-white',
                            day.status === 'CLEANING' && 'bg-yellow-400 text-yellow-900',
                            day.status === 'MAINTENANCE' && 'bg-gray-400 text-white',
                            day.status === 'BLOCKED' && 'bg-red-500 text-white'
                          )}
                        >
                          <div className="text-xs font-medium">
                            {getStatusText(day.status, 'room')}
                          </div>
                          <div className="text-xs mt-1">
                            ¥{day.price}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">本月可用房晚</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {calendarData.rooms.reduce((sum, r) => 
              sum + r.calendar.filter(d => d.status === 'AVAILABLE').length, 0
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">本月已订房晚</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {calendarData.rooms.reduce((sum, r) => 
              sum + r.calendar.filter(d => d.status === 'OCCUPIED').length, 0
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">清洁中房间</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {calendarData.rooms.reduce((sum, r) => 
              sum + r.calendar.filter(d => d.status === 'CLEANING').length, 0
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">本月入住率</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {(() => {
              const total = calendarData.rooms.reduce((sum, r) => sum + r.calendar.length, 0);
              const occupied = calendarData.rooms.reduce((sum, r) => 
                sum + r.calendar.filter(d => d.status === 'OCCUPIED').length, 0
              );
              return total > 0 ? ((occupied / total) * 100).toFixed(1) + '%' : '0%';
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
