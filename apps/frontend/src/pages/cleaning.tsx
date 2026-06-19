import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDateTime, getStatusText, getStatusClass } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface CleaningTask {
  id: number;
  taskNo: string;
  status: string;
  priority: number;
  scheduledAt: string;
  remarks: string;
  property: { name: string };
  room: { roomNumber: string; roomType: string };
  order: { orderNo: string; guestName: string } | null;
  assignedTo: { id: number; fullName: string } | null;
}

export default function CleaningPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter, propertyId, user]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (propertyId) params.propertyId = propertyId;

      const res = await api.get('/cleaning', { params });
      setTasks(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const viewTask = async (task: CleaningTask) => {
    try {
      const res = await api.get(`/cleaning/${task.id}`);
      setSelectedTask(res.data);
      setShowDetail(true);
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/cleaning/${id}/status`, { status });
      fetchTasks();
      if (showDetail) {
        const res = await api.get(`/cleaning/${id}`);
        setSelectedTask(res.data);
      }
    } catch (e) {
      alert('操作失败');
    }
  };

  const getPriorityText = (priority: number) => {
    if (priority >= 2) return '高';
    if (priority >= 1) return '中';
    return '普通';
  };

  const getPriorityClass = (priority: number) => {
    if (priority >= 2) return 'bg-red-100 text-red-700';
    if (priority >= 1) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const totalPages = Math.ceil(total / pageSize);

  const statusStats = [
    { label: '待分配', status: 'PENDING', count: 0 },
    { label: '已分配', status: 'ASSIGNED', count: 0 },
    { label: '进行中', status: 'IN_PROGRESS', count: 0 },
    { label: '已完成', status: 'COMPLETED', count: 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="input w-48"
          >
            <option value="">全部房源</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待分配</option>
            <option value="ASSIGNED">已分配</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
            <option value="INSPECTED">已检查</option>
          </select>
        </div>
        {user?.role !== 'FRONTLINE' && (
          <button className="btn btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statusStats.map((stat) => (
          <div key={stat.status} className="card p-4">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">-</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">任务编号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">房源/房间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">优先级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">计划时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">负责人</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    暂无保洁任务
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{task.taskNo}</div>
                      {task.order && (
                        <div className="text-xs text-gray-500">
                          订单: {task.order.guestName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">{task.property?.name}</div>
                      <div className="text-xs text-gray-500">
                        {task.room?.roomNumber} · {task.room?.roomType}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getPriorityClass(task.priority))}>
                        {getPriorityText(task.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.scheduledAt ? formatDateTime(task.scheduledAt) : '未安排'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-600">
                          {task.assignedTo?.fullName || '未分配'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getStatusClass(task.status, 'cleaning'))}>
                        {getStatusText(task.status, 'cleaning')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewTask(task)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">保洁任务详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">任务编号：</span>
                  <span className="text-gray-800">{selectedTask.taskNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">状态：</span>
                  <span className={cn('badge', getStatusClass(selectedTask.status, 'cleaning'))}>
                    {getStatusText(selectedTask.status, 'cleaning')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">房源：</span>
                  <span className="text-gray-800">{selectedTask.property?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">房间：</span>
                  <span className="text-gray-800">
                    {selectedTask.room?.roomNumber} · {selectedTask.room?.roomType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">优先级：</span>
                  <span className={cn('badge', getPriorityClass(selectedTask.priority))}>
                    {getPriorityText(selectedTask.priority)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">负责人：</span>
                  <span className="text-gray-800">
                    {selectedTask.assignedTo?.fullName || '未分配'}
                  </span>
                </div>
              </div>

              {selectedTask.remarks && (
                <div>
                  <span className="text-gray-500 text-sm">备注：</span>
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded">
                    {selectedTask.remarks}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {selectedTask.status === 'PENDING' && (
                  <button
                    onClick={() => updateStatus(selectedTask.id, 'ASSIGNED')}
                    className="btn btn-primary text-sm"
                  >
                    分配任务
                  </button>
                )}
                {(selectedTask.status === 'ASSIGNED' || selectedTask.status === 'PENDING') && (
                  <button
                    onClick={() => updateStatus(selectedTask.id, 'IN_PROGRESS')}
                    className="btn btn-primary text-sm"
                  >
                    开始清洁
                  </button>
                )}
                {selectedTask.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateStatus(selectedTask.id, 'COMPLETED')}
                    className="btn btn-primary text-sm flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    完成清洁
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
