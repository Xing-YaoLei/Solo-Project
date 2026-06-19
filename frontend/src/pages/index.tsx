import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDate, formatDateTime, statusMap } from '../utils/helpers';
import { useCurrentUser } from '../utils/useCurrentUser';

interface Property {
  id: string;
  name: string;
  roomNumber: string;
  address: string;
}

interface User {
  id: string;
  name: string;
  role: string;
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

interface CreateTaskForm {
  propertyId: string;
  assignedToId: string;
  taskDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  priority: string;
  notes: string;
}

const emptyForm: CreateTaskForm = {
  propertyId: '',
  assignedToId: '',
  taskDate: new Date().toISOString().split('T')[0],
  scheduledStartTime: '09:00',
  scheduledEndTime: '11:00',
  priority: 'normal',
  notes: '',
};

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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTaskForm>({ ...emptyForm });
  const [housekeepers, setHousekeepers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useCurrentUser();

  useEffect(() => {
    fetchData();
  }, [selectedProperty, startDate, endDate]);

  useEffect(() => {
    if (showCreateModal) {
      fetchHousekeepers();
      fetchProperties();
    }
  }, [showCreateModal]);

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

  const fetchHousekeepers = async () => {
    try {
      const result = await api.get('/users', {
        params: { role: 'HOUSEKEEPER' },
      }) as unknown as User[];
      setHousekeepers(result);
    } catch {
      setHousekeepers([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const result = await api.get('/properties') as unknown as Property[];
      setProperties(result);
    } catch {
      setProperties([]);
    }
  };

  const handleCreateTask = async () => {
    if (!createForm.propertyId || !createForm.taskDate || !createForm.assignedToId || !currentUser?.id) {
      return;
    }

    setSubmitting(true);
    try {
      const scheduledStart = new Date(`${createForm.taskDate}T${createForm.scheduledStartTime}:00`);
      const scheduledEnd = new Date(`${createForm.taskDate}T${createForm.scheduledEndTime}:00`);

      await api.post('/cleaning-tasks', {
        propertyId: createForm.propertyId,
        assignedToId: createForm.assignedToId,
        taskDate: new Date(createForm.taskDate),
        scheduledStart,
        scheduledEnd,
        priority: createForm.priority,
        notes: createForm.notes || undefined,
        createdById: currentUser.id,
      });

      setShowCreateModal(false);
      setCreateForm({ ...emptyForm });
      fetchData();
    } catch (error) {
      console.error('创建任务失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = (propertyId?: string) => {
    setCreateForm({
      ...emptyForm,
      propertyId: propertyId || '',
    });
    setShowCreateModal(true);
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
          <button onClick={fetchData} className="btn-secondary">
            🔄 刷新
          </button>
          <button onClick={() => openCreateModal()} className="btn">
            + 新建保洁任务
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📅 房源日历</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(startDate)} ~ {formatDate(endDate)}
                </p>
              </div>
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
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {item.property.roomNumber}
                      </span>
                      <button
                        onClick={() => openCreateModal(item.property.id)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        title="为该房源新建保洁任务"
                      >
                        + 保洁
                      </button>
                    </div>
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
                        {task.assignedTo?.name && ` · ${task.assignedTo.name}`}
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-1">新建保洁任务</h3>
            <p className="text-sm text-gray-500 mb-5">
              创建保洁任务并指派保洁员
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  房源 <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.propertyId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, propertyId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">请选择房源</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  指派保洁员 <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.assignedToId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, assignedToId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">请选择保洁员</option>
                  {housekeepers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {housekeepers.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    暂无保洁员，请先在用户管理中添加
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.taskDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, taskDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    计划开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createForm.scheduledStartTime}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        scheduledStartTime: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    计划结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createForm.scheduledEndTime}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        scheduledEndTime: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <select
                  value={createForm.priority}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, priority: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="low">低</option>
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  placeholder="可选，填写任务相关备注"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ ...emptyForm });
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                disabled={submitting || !createForm.propertyId || !createForm.taskDate || !createForm.assignedToId || !currentUser?.id}
                className="btn"
              >
                {submitting ? '提交中...' : '创建并指派'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
