import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime, statusMap } from '../utils/helpers';
import { useCurrentUser } from '../utils/useCurrentUser';

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

interface Property {
  id: string;
  name: string;
  roomNumber: string;
}

interface Housekeeper {
  id: string;
  name: string;
}

interface CreateForm {
  propertyId: string;
  assignedToId: string;
  taskDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  priority: string;
  notes: string;
}

const emptyForm: CreateForm = {
  propertyId: '',
  assignedToId: '',
  taskDate: new Date().toISOString().split('T')[0],
  scheduledStartTime: '09:00',
  scheduledEndTime: '11:00',
  priority: 'normal',
  notes: '',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ ...emptyForm });
  const [properties, setProperties] = useState<Property[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useCurrentUser();

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  useEffect(() => {
    if (showCreateModal) {
      fetchFormData();
    }
  }, [showCreateModal]);

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

  const fetchFormData = async () => {
    try {
      const [propsResult, usersResult] = await Promise.all([
        api.get('/properties') as unknown as Property[],
        api.get('/users', { params: { role: 'HOUSEKEEPER' } }) as unknown as Housekeeper[],
      ]);
      setProperties(propsResult);
      setHousekeepers(usersResult);
    } catch {
      setProperties([]);
      setHousekeepers([]);
    }
  };

  const handleCreate = async () => {
    if (!createForm.propertyId || !createForm.taskDate) return;

    setSubmitting(true);
    try {
      const scheduledStart = new Date(`${createForm.taskDate}T${createForm.scheduledStartTime}:00`);
      const scheduledEnd = new Date(`${createForm.taskDate}T${createForm.scheduledEndTime}:00`);

      await api.post('/cleaning-tasks', {
        propertyId: createForm.propertyId,
        assignedToId: createForm.assignedToId || undefined,
        taskDate: new Date(createForm.taskDate),
        scheduledStart,
        scheduledEnd,
        priority: createForm.priority,
        notes: createForm.notes || undefined,
        createdById: currentUser?.id,
      });

      setShowCreateModal(false);
      setCreateForm({ ...emptyForm });
      fetchTasks();
    } catch (error) {
      console.error('创建任务失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/cleaning-tasks/${id}/status`, {
        status,
        updatedById: currentUser?.id,
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
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-1">新建保洁任务</h3>
            <p className="text-sm text-gray-500 mb-5">
              创建任务并指派保洁员，提交后立即生效
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
                {properties.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    暂无房源，请先在房源管理中添加
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  指派保洁员
                </label>
                <select
                  value={createForm.assignedToId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, assignedToId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">暂不指派</option>
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
                    计划开始 <span className="text-red-500">*</span>
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
                    计划结束 <span className="text-red-500">*</span>
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
                onClick={handleCreate}
                disabled={submitting || !createForm.propertyId || !createForm.taskDate}
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
