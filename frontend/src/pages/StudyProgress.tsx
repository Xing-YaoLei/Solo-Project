import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { studyProgressApi, coursesApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { StudyProgress, RiskLevel, Course } from '@/types';

const riskColors: Record<RiskLevel, string> = {
  normal: 'bg-risk-normal',
  warning: 'bg-risk-warning',
  danger: 'bg-risk-danger',
  critical: 'bg-risk-critical',
};

const riskLabels: Record<RiskLevel, string> = {
  normal: '正常',
  warning: '提醒',
  danger: '风险',
  critical: '严重',
};

const riskBgColors: Record<RiskLevel, string> = {
  normal: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
  critical: 'bg-red-100 border-red-300',
};

export default function StudyProgressPage() {
  const { hasRole, user } = useAuthStore();
  const [progressList, setProgressList] = useState<StudyProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState({
    course_id: '',
    risk_level: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadProgress();
  }, [filters]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } catch (error) {
      console.error('加载课程失败:', error);
    }
  };

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const params: any = { page_size: 100 };
      if (filters.course_id) params.course_id = Number(filters.course_id);
      if (filters.risk_level) params.risk_level = filters.risk_level;
      const data = await studyProgressApi.list(params);
      setProgressList(data);
    } catch (error) {
      console.error('加载学习进度失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: progressList.length,
    normal: progressList.filter(p => p.risk_level === 'normal').length,
    warning: progressList.filter(p => p.risk_level === 'warning').length,
    danger: progressList.filter(p => p.risk_level === 'danger').length,
    critical: progressList.filter(p => p.risk_level === 'critical').length,
    avgCompletion: progressList.length > 0
      ? Math.round(progressList.reduce((sum, p) => sum + p.completion_rate, 0) / progressList.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习进度</h1>
          <p className="text-gray-500 mt-1">
            {hasRole(['student']) ? '查看我的学习进度' : '查看和管理学生学习进度'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="总人数" value={stats.total} color="bg-blue-50 text-blue-600" />
        <StatCard label="平均完成率" value={`${stats.avgCompletion}%`} color="bg-green-50 text-green-600" />
        <StatCard label="正常" value={stats.normal} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="提醒" value={stats.warning} color="bg-yellow-50 text-yellow-600" />
        <StatCard label="风险" value={stats.danger} color="bg-orange-50 text-orange-600" />
        <StatCard label="严重" value={stats.critical} color="bg-red-50 text-red-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <select
            value={filters.course_id}
            onChange={(e) => setFilters({ ...filters, course_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">全部课程</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.risk_level}
            onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">全部风险等级</option>
            <option value="normal">正常</option>
            <option value="warning">提醒</option>
            <option value="danger">风险</option>
            <option value="critical">严重</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {progressList.map(progress => (
              <Link
                key={progress.id}
                to="/study-progress/$id"
                params={{ id: String(progress.id) }}
                className={`block p-4 hover:bg-gray-50 transition border-l-4 ${
                  progress.risk_level === 'critical' ? 'border-l-red-600' :
                  progress.risk_level === 'danger' ? 'border-l-red-400' :
                  progress.risk_level === 'warning' ? 'border-l-yellow-400' :
                  'border-l-green-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">
                        {progress.student?.full_name || progress.student?.username || `学生 ${progress.student_id}`}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${riskColors[progress.risk_level]}`}>
                        {riskLabels[progress.risk_level]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {progress.course?.name || `课程 ${progress.course_id}`}
                    </p>
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>完成进度</span>
                          <span>{progress.completion_rate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress.risk_level === 'normal' ? 'bg-green-500' :
                              progress.risk_level === 'warning' ? 'bg-yellow-500' :
                              progress.risk_level === 'danger' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${progress.completion_rate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-400">正确率:</span> {progress.accuracy_rate}%
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-400">已完成:</span> {progress.completed_questions}/{progress.total_questions}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-400">上次练习</p>
                    <p className="text-sm text-gray-600">
                      {progress.last_practice_at
                        ? new Date(progress.last_practice_at).toLocaleDateString('zh-CN')
                        : '暂无'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {progressList.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                暂无学习进度数据
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color.split(' ')[1]}`}>{value}</p>
    </div>
  );
}
