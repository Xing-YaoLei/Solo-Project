import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDate, formatDateTime, statusMap } from '../utils/helpers';

interface Property {
  id: string;
  name: string;
  roomNumber: string;
  address: string;
}

interface Booking {
  id: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  property?: { name: string; roomNumber: string };
}

interface CleaningTask {
  id: string;
  status: string;
  taskDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  property?: { name: string; roomNumber: string };
  assignedTo?: { name: string };
  booking?: { guestName: string };
}

interface CheckinDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  guestName: string;
  createdAt: string;
  property?: { name: string; roomNumber: string };
  booking?: { guestName: string; checkInDate: string };
}

interface RecordData {
  dateRange: { startDate: string; endDate: string };
  totalProperties: number;
  totalBookings: number;
  totalCleaningTasks: number;
  totalDocuments: number;
  calendarData: Array<{
    property: Property;
    bookings: Booking[];
    cleaningTasks: CleaningTask[];
    documents: CheckinDocument[];
  }>;
  bookings: Booking[];
  cleaningTasks: CleaningTask[];
  documents: CheckinDocument[];
}

export default function RecordsPage() {
  const [data, setData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/records/view', {
        params: {
          propertyId: selectedProperty || undefined,
          startDate,
          endDate,
        },
      }) as unknown as RecordData;
      setData(result);
    } catch (error) {
      console.error('获取记录数据失败:', error);
      setData({
        dateRange: { startDate, endDate },
        totalProperties: 0,
        totalBookings: 0,
        totalCleaningTasks: 0,
        totalDocuments: 0,
        calendarData: [],
        bookings: [],
        cleaningTasks: [],
        documents: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              起始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              房源筛选
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px]"
            >
              <option value="">全部房源</option>
              {data?.calendarData.map((item) => (
                <option key={item.property.id} value={item.property.id}>
                  {item.property.name} - {item.property.roomNumber}
                </option>
              ))}
            </select>
          </div>
          <button onClick={fetchData} className="btn">
            🔄 刷新
          </button>
        </div>

        {data && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">房源数量</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {data.totalProperties}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">入住订单</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {data.totalBookings}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">保洁任务</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">
                {data.totalCleaningTasks}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600">证件登记</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {data.totalDocuments}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mb-4"></div>
          <p>加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📅 房源日历</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(startDate)} ~ {formatDate(endDate)}
              </p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-4">
              {data?.calendarData.map((item) => (
                <div
                  key={item.property.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {item.property.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {item.property.roomNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.bookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                      >
                        {booking.guestName} | {formatDate(booking.checkInDate)}
                      </div>
                    ))}
                    {item.cleaningTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={`text-xs px-2 py-1 rounded ${
                          statusMap[task.status]?.className || 'status-pending'
                        }`}
                      >
                        保洁 · {statusMap[task.status]?.label}
                      </div>
                    ))}
                    {item.bookings.length === 0 &&
                      item.cleaningTasks.length === 0 && (
                        <p className="text-xs text-gray-400">暂无安排</p>
                      )}
                  </div>
                </div>
              ))}
              {data?.calendarData.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无房源数据</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">🧹 保洁任务</h3>
              <p className="text-sm text-gray-500 mt-1">
                共 {data?.totalCleaningTasks || 0} 个任务
              </p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
              {data?.cleaningTasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {task.property?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {task.property?.roomNumber}
                      </p>
                    </div>
                    <span
                      className={`status-badge ${
                        statusMap[task.status]?.className || 'status-pending'
                      }`}
                    >
                      {statusMap[task.status]?.label || task.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>📅 {formatDate(task.taskDate)}</p>
                    <p>
                      ⏰ {formatDateTime(task.scheduledStart)} ~{' '}
                      {formatDateTime(task.scheduledEnd).split(' ')[1]}
                    </p>
                    <p>👤 {task.assignedTo?.name || '未指派'}</p>
                    {task.booking?.guestName && (
                      <p>🏠 客人: {task.booking.guestName}</p>
                    )}
                  </div>
                </div>
              ))}
              {data?.cleaningTasks.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无保洁任务</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📄 入住证件</h3>
              <p className="text-sm text-gray-500 mt-1">
                共 {data?.totalDocuments || 0} 份证件
              </p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
              {data?.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {doc.guestName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {doc.documentType}
                      </p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {doc.property?.roomNumber}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>证件号: {doc.documentNumber}</p>
                    <p>登记时间: {formatDateTime(doc.createdAt)}</p>
                    <p>房源: {doc.property?.name}</p>
                  </div>
                </div>
              ))}
              {data?.documents.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无证件记录</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
