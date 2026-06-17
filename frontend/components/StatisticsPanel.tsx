import { useState, useEffect } from 'react';
import { statisticsApi } from '../services/api';
import {
  sourceLabels,
  delayReasonLabels,
  reviewTagLabels,
  reviewTagColors,
} from '../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  Clock3,
} from 'lucide-react';
import type {
  StatisticsOverview,
  SourceStats,
  PersonStats,
  ReviewTagStats,
  DelayReasonStats,
  DailyTrendStats,
} from '../types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StatisticsPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'source' | 'person' | 'tags' | 'delay'>('overview');
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [bySource, setBySource] = useState<SourceStats[]>([]);
  const [byPerson, setByPerson] = useState<PersonStats[]>([]);
  const [byTags, setByTags] = useState<ReviewTagStats[]>([]);
  const [delayReasons, setDelayReasons] = useState<DelayReasonStats[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, sourceData, personData, tagsData, delayData, trendData] = await Promise.all([
        statisticsApi.overview(),
        statisticsApi.bySource(),
        statisticsApi.byPerson(),
        statisticsApi.byReviewTags(),
        statisticsApi.delayReasons(),
        statisticsApi.dailyTrend(14),
      ]);
      setOverview(overviewData);
      setBySource(sourceData);
      setByPerson(personData);
      setByTags(tagsData);
      setDelayReasons(delayData);
      setDailyTrend(trendData);
    } catch (error) {
      console.error('加载统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'overview', label: '总览', icon: Layers },
    { key: 'source', label: '来源渠道', icon: TrendingUp },
    { key: 'person', label: '责任人', icon: Users },
    { key: 'tags', label: '复盘标签', icon: Layers },
    { key: 'delay', label: '延误分析', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">统计汇总</h2>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
          >
            刷新数据
          </button>
        </div>

        {overview && (
          <div className="grid grid-cols-6 gap-4 mb-6">
            <StatCard
              label="总工单"
              value={overview.totalOrders}
              icon={Layers}
              color="bg-blue-50 text-blue-600"
              iconBg="bg-blue-100"
            />
            <StatCard
              label="已完成"
              value={overview.completedOrders}
              icon={CheckCircle2}
              color="bg-green-50 text-green-600"
              iconBg="bg-green-100"
            />
            <StatCard
              label="准时完成"
              value={overview.onTimeOrders}
              icon={Clock}
              color="bg-emerald-50 text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatCard
              label="延误工单"
              value={overview.delayedOrders}
              icon={AlertCircle}
              color="bg-red-50 text-red-600"
              iconBg="bg-red-100"
            />
            <StatCard
              label="待处理"
              value={overview.pendingCount}
              icon={Clock3}
              color="bg-yellow-50 text-yellow-600"
              iconBg="bg-yellow-100"
            />
            <StatCard
              label="准时率"
              value={`${overview.onTimeRate}%`}
              icon={TrendingUp}
              color="bg-purple-50 text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">加载中...</div>
        </div>
        ) : (
          <div className="mt-4">
            {activeTab === 'overview' && <OverviewTab dailyTrend={dailyTrend} />}
            {activeTab === 'source' && <SourceTab data={bySource} />}
            {activeTab === 'person' && <PersonTab data={byPerson} />}
            {activeTab === 'tags' && <TagsTab data={byTags} />}
            {activeTab === 'delay' && <DelayTab data={delayReasons} />}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, iconBg }: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  iconBg: string;
}) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function OverviewTab({ dailyTrend }: { dailyTrend: DailyTrendStats[] }) {
  const chartData = dailyTrend.map(item => ({
    ...item,
    date: item.date.slice(5),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">近14天趋势</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="总工单"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="已完成"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="onTime"
                name="准时"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">工单趋势说明</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 蓝色线表示每日新增总工单数</li>
            <li>• 绿色线表示每日已完成工单数</li>
            <li>• 紫色线表示每日准时完成工单数</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">统计说明</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 准时率 = 准时完成数 / 已完成数 × 100%</li>
            <li>• 延误率 = 有延误记录工单数 / 总工单数 × 100%</li>
            <li>• 数据每5分钟自动更新一次</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SourceTab({ data }: { data: SourceStats[] }) {
  const chartData = data.map(item => ({
    name: sourceLabels[item.source as keyof typeof sourceLabels] || item.source,
    count: item.count,
    closed: item.closed,
    onTime: item.onTime,
  }));

  const pieData = data.map(item => ({
    name: sourceLabels[item.source as keyof typeof sourceLabels] || item.source,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">各渠道工单数量对比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="总工单" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="已完成" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">渠道占比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">详细数据</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">来源渠道</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">总工单</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">已完成</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">准时完成</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">准时率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr key={item.source} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {sourceLabels[item.source as keyof typeof sourceLabels] || item.source}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.count}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.closed}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.onTime}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${item.onTimeRate >= 80 ? 'text-green-600' : item.onTimeRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.onTimeRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PersonTab({ data }: { data: PersonStats[] }) {
  const chartData = data.map(item => ({
    name: item.personName,
    total: item.total,
    completed: item.completed,
    onTime: item.onTime,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">责任人工单对比</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="total" name="总工单" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="completed" name="已完成" fill="#22c55e" radius={[0, 4, 4, 0]} />
              <Bar dataKey="onTime" name="准时" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">人员绩效排名</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">排名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">维修人员</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">总工单</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">已完成</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">延误数</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">准时率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr key={item.personId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 inline-flex items-center justify-center text-xs font-bold rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{item.personName}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.total}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.completed}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={item.delayed > 0 ? 'text-red-600' : 'text-gray-700'}>
                      {item.delayed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${item.onTimeRate >= 80 ? 'text-green-600' : item.onTimeRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.onTimeRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TagsTab({ data }: { data: ReviewTagStats[] }) {
  const chartData = data.map(item => ({
    name: reviewTagLabels[item.tag as keyof typeof reviewTagLabels] || item.tag,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">复盘标签分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">标签说明</h3>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.tag} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-700">
                  {reviewTagLabels[item.tag as keyof typeof reviewTagLabels]}
                </span>
                <span className="text-sm font-medium text-gray-900 ml-auto">
                  {item.count} 单
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="text-sm font-medium text-blue-700 mb-2">复盘标签使用建议</h4>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• 每笔已关闭工单可添加多个复盘标签</li>
          <li>• 标签用于统计分析服务质量和问题分类</li>
          <li>• 建议在关闭工单时填写，便于后续统计汇总</li>
        </ul>
      </div>
    </div>
  );
}

function DelayTab({ data }: { data: DelayReasonStats[] }) {
  const chartData = data.map(item => ({
    name: delayReasonLabels[item.reason as keyof typeof delayReasonLabels] || item.reason,
    count: item.count,
    totalDuration: Math.round(item.totalDuration / 60),
    avgDuration: Math.round(item.avgDuration / 60 * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">延误原因分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="延误次数" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">平均延误时长（小时）</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgDuration" name="平均时长(小时)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">延误原因详情</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">延误原因</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">延误次数</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">总延误时长</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">平均时长</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">占比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => {
                const total = data.reduce((sum, d) => sum + d.count, 0);
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <tr key={item.reason} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {delayReasonLabels[item.reason as keyof typeof delayReasonLabels]}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.count} 次</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {Math.round(item.totalDuration / 60 * 10) / 10} 小时
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {Math.round(item.avgDuration / 60 * 10) / 10} 小时
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-600 w-12">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
        <h4 className="text-sm font-medium text-orange-700 mb-2">延误改善建议</h4>
        <ul className="text-xs text-orange-600 space-y-1">
          <li>• 针对主要延误原因制定改善措施</li>
          <li>• 加强材料库存管理，减少材料短缺延误</li>
          <li>• 合理安排路线规划，优化派单顺序</li>
          <li>• 定期分析延误数据，持续改进服务质量</li>
        </ul>
      </div>
    </div>
  );
}
