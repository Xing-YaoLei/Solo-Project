import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime, statusMap } from '../utils/helpers';

interface CleaningTask {
  id: string;
  status: string;
  taskDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  notes?: string;
  property?: { id: string; name: string; roomNumber: string };
  assignedTo?: { id: string; name: string };
  booking?: { id: string; guestName: string };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const result = await api.get('/cleaning-tasks', {
        params: { status: statusFilter || undefined },
      }) as unknown as CleaningTask[];
      setTasks(result);
    } catch (error) {
      console.error('获取任务失败:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/cleaning-tasks/${id}/status`, {
        status,
        updatedById: 'demo-user-id',
      });
      fetchTasks();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待处理</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
            <option value="MISSED">已漏单</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>
        <button className="btn" onClick={() => setShowCreateModal(true)}>
          + 新建任务
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  房源
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  客人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  计划时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  保洁员
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">
                      {task.property?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {task.property?.roomNumber}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {task.booking?.guestName || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDateTime(task.scheduledStart)}
                    <br />
                    <span className="text-xs text-gray-400">
                      至 {formatDateTime(task.scheduledEnd).split(' ')[1]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {task.assignedTo?.name || '未指派'}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`status-badge ${
                        statusMap[task.status]?.className || 'status-pending'
                      }`}
                    >
                      {statusMap[task.status]?.label || task.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm space-x-2">
                    {task.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        开始
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus(task.id, 'COMPLETED')}
                        className="text-green-600 hover:text-green-800"
                      >
                        完成
                      </button>
                    )}
                    <button className="text-gray-500 hover:text-gray-700">
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    暂无任务数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新建保洁任务</h3>
            <p className="text-gray-500 text-sm mb-4">
              请选择房源和时间创建保洁任务
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button className="btn">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
