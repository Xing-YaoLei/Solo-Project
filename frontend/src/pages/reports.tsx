import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDate, formatCurrency } from '../utils/helpers';
import { useCurrentUser } from '../utils/useCurrentUser';

interface MonthlyReport {
  year: number;
  month: number;
  totalTasks: number;
  completedTasks: number;
  missedTasks: number;
  onTimeTasks: number;
  punctualityRate: number;
  completionRate: number;
  generatedAt: string;
  tasksByProperty: Array<{ propertyId: string; _count: number }>;
  tasksByHousekeeper: Array<{ assignedToId: string | null; _count: number }>;
}

export default function ReportsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  const currentUser = useCurrentUser();

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const result = await api.get('/reports/monthly', {
        params: { year, month },
      }) as unknown as MonthlyReport;
      setReport(result);
    } catch (error) {
      console.error('获取报表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/reports/export/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          filters: {},
          operatorId: currentUser?.id || '',
          operatorName: currentUser?.name || '未知',
        }),
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `保洁月报_${year}年${month}月_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
          <button onClick={fetchReport} className="btn-secondary">
            🔄 查询
          </button>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn"
        >
          {exporting ? '导出中...' : '📥 导出报表'}
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : report ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500">总任务数</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {report.totalTasks}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {report.completedTasks}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">漏单数</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {report.missedTasks}
              </p>
            </div>
            <div className="card p-6 bg-primary-50 border-primary-200">
              <p className="text-sm text-primary-600">保洁准时率</p>
              <p className="text-3xl font-bold text-primary-700 mt-2">
                {report.punctualityRate}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">📊 完成率趋势</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">完成率</span>
                    <span className="font-medium">{report.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${report.completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">准时率</span>
                    <span className="font-medium">{report.punctualityRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{ width: `${report.punctualityRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">🏠 房源任务排行</h3>
              <div className="space-y-2">
                {report.tasksByProperty.slice(0, 5).map((item, index) => (
                  <div key={item.propertyId} className="flex items-center">
                    <span
                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center mr-3"
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        房源 {item.propertyId.slice(0, 8)}...
                      </span>
                      <span className="font-medium">{item._count} 次</span>
                    </div>
                  </div>
                </div>
                ))}
                {report.tasksByProperty.length === 0 && (
                  <p className="text-gray-400 text-center py-4">暂无数据</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">📋 报表信息</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">报表周期</p>
                <p className="font-medium mt-1">
                  {report.year}年{report.month}月
                </p>
              </div>
              <div>
                <p className="text-gray-500">生成时间</p>
                <p className="font-medium mt-1">
                  {formatDate(report.generatedAt, 'YYYY-MM-DD HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">筛选口径</p>
                <p className="font-medium mt-1">全部房源 / 全部状态</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
