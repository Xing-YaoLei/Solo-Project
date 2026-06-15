import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { studyProgressApi, processingApi, reminderApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { CompletionTrendItem, StudyProgress, TodoItem, ReminderRecord } from '@/types';
import { Link } from '@tanstack/react-router';

const riskColors: Record<string, string> = {
  normal: 'bg-risk-normal',
  warning: 'bg-risk-warning',
  danger: 'bg-risk-danger',
  critical: 'bg-risk-critical',
};

const riskLabels: Record<string, string> = {
  normal: '正常',
  warning: '提醒',
  danger: '风险',
  critical: '严重',
};

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const [trends, setTrends] = useState<CompletionTrendItem[]>([]);
  const [progressList, setProgressList] = useState<StudyProgress[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    avgCompletion: 0,
    atRiskCount: 0,
    todoCount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (hasRole(['admin', 'manager', 'teacher'])) {
        const [trendData, progressData, todoData] = await Promise.all([
          studyProgressApi.getCompletionTrend(30),
          studyProgressApi.list({ page_size: 5 }),
          hasRole(['teacher']) ? processingApi.getTeacherTodos() : processingApi.getMyTodos(false),
        ]);
        setTrends(trendData);
        setProgressList(progressData);
        setTodos(todoData.slice(0, 5));

        const atRisk = progressData.filter(
          p => p.risk_level !== 'normal'
        ).length;
        const avgComp = progressData.length > 0
          ? progressData.reduce((sum, p) => sum + p.completion_rate, 0) / progressData.length
          : 0;

        setStats({
          totalCourses: new Set(progressData.map(p => p.course_id)).size,
          avgCompletion: Math.round(avgComp),
          atRiskCount: atRisk,
          todoCount: todoData.filter(t => !t.is_completed).length,
        });
      } else {
        const [progressData, todoData, reminderData] = await Promise.all([
          studyProgressApi.list(),
          processingApi.getMyTodos(false),
          reminderApi.getMyReminders(false),
        ]);
        setProgressList(progressData);
        setTodos(todoData.slice(0, 5));
        setReminders(reminderData.slice(0, 5));

        const avgComp = progressData.length > 0
          ? progressData.reduce((sum, p) => sum + p.completion_rate, 0) / progressData.length
          : 0;

        setStats({
          totalCourses: progressData.length,
          avgCompletion: Math.round(avgComp),
          atRiskCount: progressData.filter(p => p.risk_level !== 'normal').length,
          todoCount: todoData.filter(t => !t.is_completed).length,
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const isManagerView = hasRole(['admin', 'manager', 'teacher']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">
            欢迎回来，{user?.full_name || user?.username}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="课程总数"
          value={stats.totalCourses}
          icon="📚"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="平均完成率"
          value={`${stats.avgCompletion}%`}
          icon="📈"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="风险人数"
          value={stats.atRiskCount}
          icon="⚠️"
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="待办事项"
          value={stats.todoCount}
          icon="📋"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {isManagerView && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">完成率趋势</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completion_rate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="完成率(%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">学习进度</h2>
            <Link to="/study-progress" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-4">
            {progressList.slice(0, 5).map(progress => (
              <Link
                key={progress.id}
                to="/study-progress/$id"
                params={{ id: String(progress.id) }}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {progress.course?.name || `课程 ${progress.course_id}`}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${riskColors[progress.risk_level]}`}>
                    {riskLabels[progress.risk_level]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress.completion_rate}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {progress.completion_rate}%
                  </span>
                </div>
              </Link>
            ))}
            {progressList.length === 0 && (
              <p className="text-center text-gray-400 py-8">暂无学习进度数据</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">待办事项</h2>
            <Link to="/todos" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {todos.slice(0, 5).map(todo => (
              <div key={todo.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  todo.priority === 1 ? 'bg-red-500' : todo.priority === 2 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{todo.title}</p>
                  {todo.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{todo.description}</p>
                  )}
                </div>
              </div>
            ))}
            {todos.length === 0 && (
              <p className="text-center text-gray-400 py-8">暂无待办事项</p>
            )}
          </div>
        </div>
      </div>

      {!isManagerView && reminders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最新提醒</h2>
          </div>
          <div className="space-y-3">
            {reminders.map(reminder => (
              <div key={reminder.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{reminder.message}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {new Date(reminder.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
