'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { getTrendData, getAnomalyExplanation, getStudentList } from '@/lib/mockData';
import type { AnomalyExplanation } from '@/types';
import clsx from 'clsx';

export default function AnomalyAnalysisPage() {
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null);
  const trendData = getTrendData();
  const { data: students } = getStudentList(1, 50);

  const anomalies = trendData
    .filter(d => d.isAnomaly)
    .map(d => ({
      ...d,
      explanation: getAnomalyExplanation(d.month),
    }))
    .filter(d => d.explanation !== null) as (typeof trendData[0] & { explanation: AnomalyExplanation })[];

  const quotaImpactData = anomalies.map(a => ({
    period: a.month,
    expected: a.explanation?.supervisorQuotaImpact.expectedQuota || 0,
    actual: a.explanation?.supervisorQuotaImpact.actualQuota || 0,
    deviation: (a.explanation?.supervisorQuotaImpact.actualQuota || 0) - (a.explanation?.supervisorQuotaImpact.expectedQuota || 0),
  }));

  const toggleExpand = (period: string) => {
    setExpandedAnomaly(prev => prev === period ? null : period);
  };

  const impactedStudents = students.filter(s =>
    s.supervisorQuota && s.supervisorQuota.available <= 2
  ).slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-gray-900 mb-2">
          异常点分析
        </h1>
        <p className="text-gray-500">
          基于导师名额的异常点解释，数据逐层下钻
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">异常点数量</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">{anomalies.length}</div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-500">最大偏差</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            +{Math.max(...anomalies.map(a => a.explanation?.deviationPercent || 0))}%
          </div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-500">受影响导师</span>
          </div>
          <div className="text-2xl font-bold font-mono text-primary-600">4</div>
        </div>
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">受影响学生</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">{impactedStudents.length * 3}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">导师名额影响分析</h2>
              <p className="text-sm text-gray-500">预期名额 vs 实际名额对比</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quotaImpactData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip min-w-48">
                          <p className="font-semibold text-gray-900 mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">预期名额:</span>
                              <span className="font-mono font-medium text-blue-600">{data.expected}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">实际名额:</span>
                              <span className="font-mono font-medium text-amber-600">{data.actual}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-gray-100">
                              <span className="text-gray-600">偏差:</span>
                              <span className={clsx(
                                'font-mono font-medium',
                                data.deviation > 0 ? 'text-emerald-600' : 'text-red-600'
                              )}>
                                {data.deviation > 0 ? '+' : ''}{data.deviation}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="expected" name="预期名额" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="实际名额" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">异常点列表</h2>
              <p className="text-sm text-gray-500">点击展开查看详细分析</p>
            </div>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div
                key={anomaly.month}
                className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleExpand(anomaly.month)}
                  className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-breathe">
                        !
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{anomaly.month}</div>
                      <div className="text-sm text-gray-500">{anomaly.anomalyReason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-red-600">
                        {anomaly.explanation?.deviationPercent}%
                      </div>
                      <div className="text-xs text-gray-500">偏离预期</div>
                    </div>
                    {expandedAnomaly === anomaly.month ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedAnomaly === anomaly.month && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">数值对比</span>
                        </div>
                        <div className="flex items-end gap-3">
                          <div>
                            <div className="text-xs text-gray-500">实际值</div>
                            <div className="text-2xl font-bold font-mono text-red-600">
                              {anomaly.explanation?.anomalyValue}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">预期值</div>
                            <div className="text-2xl font-bold font-mono text-gray-400">
                              {anomaly.explanation?.expectedValue}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">偏差</div>
                            <div className="text-xl font-bold font-mono text-amber-600">
                              +{anomaly.explanation?.deviation}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-primary-500" />
                          <span className="text-xs text-gray-500">导师名额影响</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {anomaly.explanation?.supervisorQuotaImpact.impactDescription}
                        </p>
                        <div className="flex gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">预期: </span>
                            <span className="font-mono font-medium text-blue-600">
                              {anomaly.explanation?.supervisorQuotaImpact.expectedQuota}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">实际: </span>
                            <span className="font-mono font-medium text-amber-600">
                              {anomaly.explanation?.supervisorQuotaImpact.actualQuota}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-800">其他影响因素</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {anomaly.explanation?.otherFactors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-100"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-gradient p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">受导师名额影响的学生</h2>
            <p className="text-sm text-gray-500">导师名额不足可能影响的学生列表</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">学生信息</th>
                <th className="table-header">学院/专业</th>
                <th className="table-header text-center">申请课程</th>
                <th className="table-header text-center">申请状态</th>
                <th className="table-header text-center">导师</th>
                <th className="table-header text-center">名额使用情况</th>
                <th className="table-header text-center">风险等级</th>
              </tr>
            </thead>
            <tbody>
              {impactedStudents.map((student, idx) => (
                <tr key={student.id} className={clsx('table-row', idx % 2 === 1 && 'table-row-alt')}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold">
                        {student.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{student.studentNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-800">{student.college}</div>
                    <div className="text-xs text-gray-500">{student.major}</div>
                  </td>
                  <td className="table-cell text-center">
                    <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                      {student.courseCode}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={clsx(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      student.applicationStatus === 'pending' ? 'bg-blue-50 text-blue-700' :
                      student.applicationStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-red-50 text-red-700'
                    )}>
                      {student.applicationStatus === 'pending' ? '待审核' :
                       student.applicationStatus === 'approved' ? '已通过' :
                       student.applicationStatus === 'rejected' ? '已拒绝' : '材料缺失'}
                    </span>
                  </td>
                  <td className="table-cell text-center text-sm text-gray-700">
                    {student.supervisorName}
                  </td>
                  <td className="table-cell">
                    {student.supervisorQuota && (
                      <div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              student.supervisorQuota.used / student.supervisorQuota.total >= 0.9
                                ? 'bg-gradient-to-r from-red-400 to-red-500'
                                : student.supervisorQuota.used / student.supervisorQuota.total >= 0.7
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            )}
                            style={{ width: `${(student.supervisorQuota.used / student.supervisorQuota.total) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-center font-mono text-gray-600">
                          {student.supervisorQuota.used}/{student.supervisorQuota.total}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    {student.supervisorQuota && student.supervisorQuota.available <= 0 ? (
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                        高风险
                      </span>
                    ) : student.supervisorQuota && student.supervisorQuota.available <= 2 ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                        中风险
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                        低风险
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">建议措施</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 对于高风险导师，建议临时增加名额或协调其他导师分担</li>
                <li>• 提前规划下一期名额分配，避免类似情况发生</li>
                <li>• 建立导师名额预警机制，在使用率达到80%时自动提醒</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
