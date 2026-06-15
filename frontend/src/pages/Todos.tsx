import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { processingApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { TodoItem } from '@/types';

const priorityLabels: Record<number, string> = {
  1: '高',
  2: '中',
  3: '低',
};

const priorityColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-yellow-500',
  3: 'bg-green-500',
};

const todoTypeLabels: Record<string, string> = {
  review: '复核',
  communication: '沟通',
  risk_followup: '风险跟进',
  reminder: '提醒',
  other: '其他',
};

export default function TodosPage() {
  const { hasRole, user } = useAuthStore();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    todo_type: 'other',
    priority: 2,
  });

  useEffect(() => {
    loadTodos();
  }, [filter, typeFilter]);

  const loadTodos = async () => {
    try {
      let data: TodoItem[];
      if (hasRole(['teacher']) && filter === 'pending') {
        data = await processingApi.getTeacherTodos();
      } else {
        const isCompleted = filter === 'completed' ? true : filter === 'pending' ? false : undefined;
        data = await processingApi.getMyTodos(isCompleted, typeFilter || undefined);
      }
      setTodos(data);
    } catch (error) {
      console.error('加载待办失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await processingApi.createTodo(formData);
      setShowModal(false);
      setFormData({ title: '', description: '', todo_type: 'other', priority: 2 });
      loadTodos();
    } catch (error: any) {
      alert(error.response?.data?.detail || '创建失败');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await processingApi.completeTodo(id);
      loadTodos();
    } catch (error) {
      console.error('完成待办失败:', error);
    }
  };

  const types = Array.from(new Set(todos.map(t => t.todo_type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">待办事项</h1>
          <p className="text-gray-500 mt-1">管理你的待办任务</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          + 新建待办
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {[
              { key: 'pending', label: '待处理' },
              { key: 'all', label: '全部' },
              { key: 'completed', label: '已完成' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  filter === item.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1 text-xs rounded-lg transition ${
                !typeFilter ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              全部类型
            </button>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 text-xs rounded-lg transition ${
                  typeFilter === type ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {todoTypeLabels[type] || type}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {todos.map(todo => (
            <div key={todo.id} className={`p-4 hover:bg-gray-50 transition ${
              todo.is_completed ? 'opacity-60' : ''
            }`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => !todo.is_completed && handleComplete(todo.id)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    todo.is_completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {todo.is_completed && '✓'}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${
                      todo.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}>
                      {todo.title}
                    </h3>
                    <span className={`w-2 h-2 rounded-full ${priorityColors[todo.priority]}`} />
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {todoTypeLabels[todo.todo_type] || todo.todo_type}
                    </span>
                  </div>
                  {todo.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>优先级: {priorityLabels[todo.priority]}</span>
                    <span>创建于: {new Date(todo.created_at).toLocaleDateString('zh-CN')}</span>
                    {todo.due_date && (
                      <span>截止: {new Date(todo.due_date).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                  {todo.todo_type === 'risk_followup' && todo.related_id && (
                    <Link
                      to="/study-progress/$id"
                      params={{ id: String(todo.related_id) }}
                      className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      查看详情 →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
          {todos.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              暂无待办事项
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">新建待办</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={formData.todo_type}
                    onChange={(e) => setFormData({ ...formData, todo_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="other">其他</option>
                    <option value="review">复核</option>
                    <option value="communication">沟通</option>
                    <option value="reminder">提醒</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value={1}>高</option>
                    <option value={2}>中</option>
                    <option value={3}>低</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
