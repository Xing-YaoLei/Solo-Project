import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Trophy, Target, Flame, Calendar, TrendingUp, Filter, Trash2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useGameStore } from '@/store/gameStore';
import type { GameMode } from '@/types/game';

export default function Review() {
  const navigate = useNavigate();
  const { levelRecords, clearRecords, lastCompletedStats } = useGameStore();
  const [modeFilter, setModeFilter] = useState<'all' | GameMode>('all');

  const filteredRecords = useMemo(() => {
    const records = modeFilter === 'all' ? levelRecords : levelRecords.filter((r) => r.mode === modeFilter);
    return [...records].sort((a, b) => b.lastPlayed - a.lastPlayed);
  }, [levelRecords, modeFilter]);

  const chartData = useMemo(() => {
    return filteredRecords.slice(0, 10).map((r) => ({
      name: r.levelName.length > 8 ? r.levelName.slice(0, 8) + '...' : r.levelName,
      fullName: r.levelName,
      完成率: Math.round(r.avgCompletionRate * 100),
      准确率: Math.round(r.bestAccuracy * 100),
      连击: r.bestCombo,
      分数: r.bestScore,
    }));
  }, [filteredRecords]);

  const radarData = useMemo(() => {
    if (filteredRecords.length === 0) return [];
    const avgCompletion = filteredRecords.reduce((s, r) => s + r.avgCompletionRate, 0) / filteredRecords.length;
    const avgAccuracy = filteredRecords.reduce((s, r) => s + r.bestAccuracy, 0) / filteredRecords.length;
    const avgCombo = filteredRecords.reduce((s, r) => s + r.bestCombo, 0) / filteredRecords.length;
    const maxScore = Math.max(...filteredRecords.map((r) => r.bestScore));
    const totalAttempts = filteredRecords.reduce((s, r) => s + r.attempts, 0);
    const normCombo = Math.min(100, (avgCombo / 10) * 100);
    const normScore = maxScore > 0 ? Math.min(100, (Math.max(...filteredRecords.map((r) => r.bestScore)) / maxScore) * 100) : 0;
    const normAttempts = Math.min(100, (totalAttempts / 20) * 100);
    return [
      { subject: '完成率', value: Math.round(avgCompletion * 100), fullMark: 100 },
      { subject: '准确率', value: Math.round(avgAccuracy * 100), fullMark: 100 },
      { subject: '连击能力', value: Math.round(normCombo), fullMark: 100 },
      { subject: '最高得分', value: Math.round(normScore), fullMark: 100 },
      { subject: '练习频次', value: Math.round(normAttempts), fullMark: 100 },
    ];
  }, [filteredRecords]);

  const modeDistribution = useMemo(() => {
    const formal = levelRecords.filter((r) => r.mode === 'formal');
    const free = levelRecords.filter((r) => r.mode === 'free');
    return [
      { name: '正式训练', value: formal.reduce((s, r) => s + r.attempts, 0), color: '#6366F1' },
      { name: '自由练习', value: free.reduce((s, r) => s + r.attempts, 0), color: '#10B981' },
    ];
  }, [levelRecords]);

  const progressData = useMemo(() => {
    return [...filteredRecords]
      .sort((a, b) => a.lastPlayed - b.lastPlayed)
      .slice(-10)
      .map((r) => ({
        name: r.levelName.length > 6 ? r.levelName.slice(0, 6) + '..' : r.levelName,
        完成率: Math.round(r.avgCompletionRate * 100),
        准确率: Math.round(r.bestAccuracy * 100),
      }));
  }, [filteredRecords]);

  const summaryStats = useMemo(() => {
    const totalAttempts = levelRecords.reduce((s, r) => s + r.attempts, 0);
    const bestScore = levelRecords.reduce((m, r) => Math.max(m, r.bestScore), 0);
    const bestAccuracy = levelRecords.reduce((m, r) => Math.max(m, r.bestAccuracy), 0);
    const bestCombo = levelRecords.reduce((m, r) => Math.max(m, r.bestCombo), 0);
    const avgCompletion =
      levelRecords.length > 0
        ? levelRecords.reduce((s, r) => s + r.avgCompletionRate, 0) / levelRecords.length
        : 0;
    return { totalAttempts, bestScore, bestAccuracy, bestCombo, avgCompletion };
  }, [levelRecords]);

  const PIE_COLORS = ['#6366F1', '#10B981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </button>
          {levelRecords.length > 0 && (
            <button
              onClick={() => {
                if (confirm('确定要清空所有训练记录吗？此操作不可恢复。')) {
                  clearRecords();
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空记录</span>
            </button>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            训练复盘
          </h1>
          <p className="text-gray-500">查看各关卡完成率对比，分析训练效果</p>
        </div>

        {levelRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">暂无训练数据</h3>
            <p className="text-gray-500 mb-6">完成至少一次训练后，这里会显示详细的复盘数据</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/levels/formal')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                开始正式训练
              </button>
              <button
                onClick={() => navigate('/levels/free')}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                进行自由练习
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>总次数</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{summaryStats.totalAttempts}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-yellow-600 text-sm mb-2">
                  <Trophy className="w-4 h-4" />
                  <span>最高分</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{summaryStats.bestScore.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 text-sm mb-2">
                  <Target className="w-4 h-4" />
                  <span>最高准确率</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{Math.round(summaryStats.bestAccuracy * 100)}%</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-orange-600 text-sm mb-2">
                  <Flame className="w-4 h-4" />
                  <span>最大连击</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{summaryStats.bestCombo}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>平均完成率</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{Math.round(summaryStats.avgCompletion * 100)}%</p>
              </div>
            </div>

            {lastCompletedStats && (
              <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <p className="text-sm text-indigo-600 font-medium mb-2">📊 最近一次训练</p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">得分：</span>
                    <span className="font-bold text-indigo-700">{lastCompletedStats.score.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">准确率：</span>
                    <span className="font-bold text-blue-600">
                      {lastCompletedStats.totalAttempts > 0
                        ? Math.round((lastCompletedStats.correctCount / lastCompletedStats.totalAttempts) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">最大连击：</span>
                    <span className="font-bold text-orange-600">{lastCompletedStats.maxCombo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">结果：</span>
                    <span className={`font-bold ${lastCompletedStats.passed ? 'text-green-600' : 'text-red-500'}`}>
                      {lastCompletedStats.passed ? '✅ 通过' : '❌ 未通过'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 mr-2">筛选：</span>
              {(['all', 'formal', 'free'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    modeFilter === m
                      ? m === 'all'
                        ? 'bg-gray-800 text-white shadow-md'
                        : m === 'formal'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {m === 'all' ? '全部' : m === 'formal' ? '正式训练' : '自由练习'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  各关卡完成率对比
                </h3>
                <div className="h-72">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          angle={-30}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={[0, 100]} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-sm">
                                  <p className="font-bold text-gray-800 mb-2">{d.fullName}</p>
                                  {payload.map((p) => (
                                    <p key={p.name} style={{ color: p.color }}>
                                      {p.name}: {p.value}{p.name === '分数' ? '' : '%'}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="完成率" fill="#6366F1" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="准确率" fill="#10B981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  综合能力雷达图
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#4B5563' }} />
                      <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[0, 100]} />
                      <Radar
                        name="能力值"
                        dataKey="value"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">训练模式分布</h3>
                <div className="h-56">
                  {modeDistribution.some((d) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={modeDistribution.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {modeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}次`, '练习次数']}
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">近期训练趋势</h3>
                <div className="h-56">
                  {progressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="完成率"
                          stroke="#6366F1"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#6366F1' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="准确率"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#10B981' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">详细关卡记录</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-5 py-3 font-medium">关卡名称</th>
                      <th className="text-left px-5 py-3 font-medium">模式</th>
                      <th className="text-right px-5 py-3 font-medium">次数</th>
                      <th className="text-right px-5 py-3 font-medium">最高分</th>
                      <th className="text-right px-5 py-3 font-medium">准确率</th>
                      <th className="text-right px-5 py-3 font-medium">连击</th>
                      <th className="text-right px-5 py-3 font-medium">完成率</th>
                      <th className="text-right px-5 py-3 font-medium">最近</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => (
                      <tr key={r.levelId} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-medium text-gray-800">{r.levelName}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.mode === 'formal' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'
                            }`}
                          >
                            {r.mode === 'formal' ? '正式' : '自由'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-gray-700">{r.attempts}</td>
                        <td className="px-5 py-3 text-right font-mono text-yellow-600 font-semibold">
                          {r.bestScore.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-blue-600">
                          {Math.round(r.bestAccuracy * 100)}%
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-orange-600">{r.bestCombo}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.round(r.avgCompletionRate * 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-gray-700 w-10 text-right">
                              {Math.round(r.avgCompletionRate * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500 text-xs">
                          {new Date(r.lastPlayed).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
