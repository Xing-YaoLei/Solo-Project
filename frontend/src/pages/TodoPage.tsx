import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { TodoItem } from '@/types';
import { reportsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import { formatTime, cn } from '@/utils/format';

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'normal' | 'low'>('all');
  const currentUser = useAuthStore((s) => s.currentUser);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getTodos();
      setTodos(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const filtered = todos.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'high') return t.priority >= 3;
    if (filter === 'normal') return t.priority >= 1 && t.priority < 3;
    return t.priority === 0;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conflict':
        return AlertTriangle;
      case 'assignment':
        return Calendar;
      case 'cleaning_task':
      default:
        return CheckSquare;
    }
  };

  const getTypeColor = (type: string, priority: number) => {
    if (priority >= 3 || type === 'conflict') {
      return 'from-red-500 to-red-600';
    }
    if (priority >= 2) {
      return 'from-orange-500 to-orange-600';
    }
    if (priority >= 1) {
      return 'from-yellow-500 to-yellow-600';
    }
    return 'from-blue-500 to-blue-600';
  };

  const stats = {
    total: todos.length,
    high: todos.filter((t) => t.priority >= 3).length,
    normal: todos.filter((t) => t.priority >= 1 && t.priority < 3).length,
    low: todos.filter((t) => t.priority === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-none">
        <h2 className="text-xl font-semibold flex items-center gap-3">
          <CheckSquare size={24} />
          {currentUser?.role === 'cleaner' ? '今日任务清单' : '待办事项中心'}
        </h2>
        <p className="mt-2 text-primary-100 text-sm">
          {currentUser?.role === 'cleaner'
            ? `今天共安排 ${todos.length} 项任务，请合理安排时间`
            : `共 ${todos.length} 项待办需要处理，优先关注高优先级事项`}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            filter === 'all' && 'ring-2 ring-primary-500 border-primary-300'
          )}
        >
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">全部待办</div>
        </button>
        <button
          onClick={() => setFilter('high')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            filter === 'high' && 'ring-2 ring-red-500 border-red-300'
          )}
        >
          <div className="text-3xl font-bold text-red-600">{stats.high}</div>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <AlertTriangle size={14} className="text-red-500" />
            紧急/高优先
          </div>
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            filter === 'normal' && 'ring-2 ring-orange-500 border-orange-300'
          )}
        >
          <div className="text-3xl font-bold text-orange-600">{stats.normal}</div>
          <div className="text-sm text-gray-500 mt-1">中等优先</div>
        </button>
        <button
          onClick={() => setFilter('low')}
          className={cn(
            'card p-5 text-left transition-all hover:shadow-md',
            filter === 'low' && 'ring-2 ring-blue-500 border-blue-300'
          )}
        >
          <div className="text-3xl font-bold text-blue-600">{stats.low}</div>
          <div className="text-sm text-gray-500 mt-1">普通事项</div>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            显示 {filtered.length} 条待办
          </span>
        </div>
      </div>

      {/* 待办列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64 card">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">太棒了！</h3>
          <p className="text-gray-500 text-sm mt-1">当前筛选条件下没有待办事项</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((todo, idx) => {
            const Icon = getTypeIcon(todo.type);
            return (
              <Link
                key={todo.id}
                to={todo.schedule_id ? `/schedules/${todo.schedule_id}` : '/todos'}
                className={cn(
                  'card p-5 flex items-center gap-5 transition-all hover:shadow-lg group',
                  todo.priority >= 3 && 'border-l-4 border-l-red-500',
                  todo.priority >= 2 && todo.priority < 3 && 'border-l-4 border-l-orange-500'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0',
                    getTypeColor(todo.type, todo.priority)
                  )}
                >
                  <Icon size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {todo.title}
                    </h3>
                    {todo.priority >= 3 && (
                      <span className="badge bg-red-100 text-red-700 text-[10px]">
                        紧急
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{todo.description}</p>
                </div>

                {todo.due_time && (
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatTime(todo.due_time)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      截止时间
                    </div>
                  </div>
                )}

                <div className="hidden sm:block">
                  <ChevronRight
                    size={20}
                    className="text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
