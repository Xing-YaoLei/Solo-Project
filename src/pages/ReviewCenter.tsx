import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  Award,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { storage } from '@/utils/storage';
import type { GameRecord, ErrorCategory } from '@/types/game';

const errorCategoryLabels: Record<string, string> = {
  missed_benefit_expiry: '权益过期提醒',
  wrong_refund_handling: '退款处理',
  poor_recharge_timing: '续充时机',
  ignored_member_pattern: '会员行为模式',
  insufficient_clue_analysis: '线索分析不足',
};

const CHART_COLORS = ['#FF8F00', '#66BB6A', '#EF5350', '#42A5F5', '#AB47BC', '#FFA726'];

export default function ReviewCenter() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'all'>('all');

  useEffect(() => {
    const savedRecords = storage.loadRecords<GameRecord[]>([]);
    setRecords(savedRecords);
  }, []);

  const filteredRecords = records.filter((record) => {
    if (selectedPeriod === 'all') return true;
    const days = selectedPeriod === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(record.playedAt) >= cutoff;
  });

  const totalGames = filteredRecords.length;
  const totalScore = filteredRecords.reduce((sum, r) => sum + r.score, 0);
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const totalCorrect = filteredRecords.reduce((sum, r) => sum + r.correctCount, 0);
  const totalWrong = filteredRecords.reduce((sum, r) => sum + r.wrongCount, 0);
  const accuracy = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
  const avgDecisionTime = totalGames > 0
    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.avgDecisionTime, 0) / totalGames)
    : 0;

  const errorCategoryData = Object.entries(
    filteredRecords.reduce((acc, record) => {
      Object.entries(record.errorCategories).forEach(([category, count]) => {
        acc[category] = (acc[category] || 0) + count;
      });
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: errorCategoryLabels[name] || name,
    value,
  }));

  const scoreTrendData = [...filteredRecords]
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())
    .map((record, index) => ({
      name: `第${index + 1}局`,
      score: record.score,
      正确率: Math.round((record.correctCount / (record.correctCount + record.wrongCount)) * 100),
    }));

  const radarData = [
    { subject: '权益提醒', A: calculateSkillScore('missed_benefit_expiry'), fullMark: 100 },
    { subject: '退款处理', A: calculateSkillScore('wrong_refund_handling'), fullMark: 100 },
    { subject: '续充时机', A: calculateSkillScore('poor_recharge_timing'), fullMark: 100 },
    { subject: '行为分析', A: calculateSkillScore('ignored_member_pattern'), fullMark: 100 },
    { subject: '线索分析', A: calculateSkillScore('insufficient_clue_analysis'), fullMark: 100 },
  ];

  function calculateSkillScore(category: ErrorCategory): number {
    const totalErrors = filteredRecords.reduce((sum, r) => sum + (r.errorCategories[category] || 0), 0);
    const totalTasks = filteredRecords.reduce((sum, r) => sum + r.correctCount + r.wrongCount, 0);
    if (totalTasks === 0) return 50;
    const errorRate = totalErrors / totalTasks;
    return Math.max(0, Math.min(100, Math.round(100 - errorRate * 100 * 2)));
  }

  const performanceByLevel = filteredRecords.reduce((acc, record) => {
    const levelId = record.levelId;
    if (!acc[levelId]) {
      acc[levelId] = { name: levelId.replace('level-', '第'), 总得分: 0, 次数: 0, 最高: 0 };
    }
    acc[levelId].总得分 += record.score;
    acc[levelId].次数 += 1;
    acc[levelId].最高 = Math.max(acc[levelId].最高, record.score);
    return acc;
  }, {} as Record<string, { name: string; 总得分: number; 次数: number; 最高: number }>);

  const levelPerformanceData = Object.values(performanceByLevel).map((item) => ({
    ...item,
    name: `${item.name}关`,
    平均分: Math.round(item.总得分 / item.次数),
  }));

  const renewalRate = Math.min(100, Math.max(0, accuracy + (100 - avgDecisionTime / 100)));

  const statCards = [
    {
      icon: Target,
      label: '总训练次数',
      value: totalGames,
      color: 'text-[#FF8F00]',
      bgColor: 'bg-[#FF8F00]/10',
    },
    {
      icon: Award,
      label: '累计得分',
      value: totalScore,
      color: 'text-[#66BB6A]',
      bgColor: 'bg-[#66BB6A]/10',
    },
    {
      icon: TrendingUp,
      label: '平均正确率',
      value: `${accuracy}%`,
      color: 'text-[#42A5F5]',
      bgColor: 'bg-[#42A5F5]/10',
    },
    {
      icon: Clock,
      label: '平均决策时间',
      value: `${(avgDecisionTime / 1000).toFixed(1)}秒`,
      color: 'text-[#AB47BC]',
      bgColor: 'bg-[#AB47BC]/10',
    },
    {
      icon: CheckCircle,
      label: '续费率预测',
      value: `${Math.round(renewalRate)}%`,
      color: 'text-[#FFA726]',
      bgColor: 'bg-[#FFA726]/10',
    },
    {
      icon: XCircle,
      label: '总错误次数',
      value: totalWrong,
      color: 'text-[#EF5350]',
      bgColor: 'bg-[#EF5350]/10',
    },
  ];

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#3E2723] overflow-hidden">
      <div className="relative z-10 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light hover:bg-[#FFF8E1]/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </motion.button>

          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gradient">复盘中心</h1>
            <BarChart3 className="w-7 h-7 text-[#FF8F00]" />
          </div>

          <div className="flex gap-2">
            {[
              { id: '7d', label: '7天' },
              { id: '30d', label: '30天' },
              { id: 'all', label: '全部' },
            ].map((period) => (
              <motion.button
                key={period.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPeriod(period.id as typeof selectedPeriod)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  selectedPeriod === period.id
                    ? 'bg-[#FF8F00] text-[#3E2723] font-semibold'
                    : 'glass-light text-[#8D6E63] hover:text-[#FFF8E1]'
                }`}
              >
                {period.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
          {filteredRecords.length > 0 ? (
            <div className="space-y-6 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((card, index) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-[#8D6E63]">{card.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">得分趋势</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#5D4037" />
                        <XAxis dataKey="name" stroke="#8D6E63" fontSize={12} />
                        <YAxis stroke="#8D6E63" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#3E2723',
                            border: '1px solid #5D4037',
                            borderRadius: '8px',
                            color: '#FFF8E1',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#FF8F00"
                          strokeWidth={3}
                          dot={{ fill: '#FF8F00', strokeWidth: 2 }}
                          name="得分"
                        />
                        <Line
                          type="monotone"
                          dataKey="正确率"
                          stroke="#66BB6A"
                          strokeWidth={2}
                          dot={{ fill: '#66BB6A', strokeWidth: 2 }}
                          name="正确率(%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">能力雷达图</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#5D4037" />
                        <PolarAngleAxis dataKey="subject" stroke="#8D6E63" fontSize={12} />
                        <PolarRadiusAxis stroke="#5D4037" fontSize={10} />
                        <Radar
                          name="能力值"
                          dataKey="A"
                          stroke="#FF8F00"
                          fill="#FF8F00"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">错误类型分布</h3>
                  {errorCategoryData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={errorCategoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {errorCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#3E2723',
                              border: '1px solid #5D4037',
                              borderRadius: '8px',
                              color: '#FFF8E1',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-[#8D6E63]">
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无错误记录</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">关卡表现</h3>
                  {levelPerformanceData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={levelPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#5D4037" />
                          <XAxis dataKey="name" stroke="#8D6E63" fontSize={12} />
                          <YAxis stroke="#8D6E63" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#3E2723',
                              border: '1px solid #5D4037',
                              borderRadius: '8px',
                              color: '#FFF8E1',
                            }}
                          />
                          <Legend />
                          <Bar dataKey="平均分" fill="#FF8F00" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="最高" fill="#66BB6A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-[#8D6E63]">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无关卡数据</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">最近游戏记录</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#5D4037]/50">
                        <th className="text-left py-3 px-4 text-sm text-[#8D6E63] font-medium">时间</th>
                        <th className="text-left py-3 px-4 text-sm text-[#8D6E63] font-medium">关卡</th>
                        <th className="text-center py-3 px-4 text-sm text-[#8D6E63] font-medium">得分</th>
                        <th className="text-center py-3 px-4 text-sm text-[#8D6E63] font-medium">正确</th>
                        <th className="text-center py-3 px-4 text-sm text-[#8D6E63] font-medium">错误</th>
                        <th className="text-center py-3 px-4 text-sm text-[#8D6E63] font-medium">正确率</th>
                        <th className="text-center py-3 px-4 text-sm text-[#8D6E63] font-medium">平均决策时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredRecords]
                        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
                        .slice(0, 10)
                        .map((record, index) => {
                          const total = record.correctCount + record.wrongCount;
                          const rate = total > 0 ? Math.round((record.correctCount / total) * 100) : 0;
                          return (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-[#5D4037]/30 hover:bg-[#FFF8E1]/5"
                            >
                              <td className="py-3 px-4 text-sm text-[#D7CCC8]">
                                {new Date(record.playedAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-[#FFF8E1]">
                                {record.levelId.replace('level-', '第')}关
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[#FF8F00] font-bold">{record.score}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[#66BB6A]">{record.correctCount}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[#EF5350]">{record.wrongCount}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`font-medium ${
                                    rate >= 80 ? 'text-[#66BB6A]' : rate >= 60 ? 'text-[#FFA726]' : 'text-[#EF5350]'
                                  }`}
                                >
                                  {rate}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#A1887F]">
                                {(record.avgDecisionTime / 1000).toFixed(1)}秒
                              </td>
                            </motion.tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {errorCategoryData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#FFA726]" />
                    改进建议
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {errorCategoryData
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 4)
                      .map((item, index) => (
                        <div
                          key={item.name}
                          className="p-4 bg-[#4E342E]/50 rounded-xl border border-[#5D4037]/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-[#FFF8E1]">{item.name}</span>
                            <span className="text-[#EF5350] font-bold">{item.value} 次错误</span>
                          </div>
                          <div className="progress-bar mb-2">
                            <div
                              className="progress-bar-fill bg-gradient-to-r from-[#EF5350] to-[#FFA726]"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.value / Math.max(...errorCategoryData.map((d) => d.value))) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-[#8D6E63]">
                            {getImprovementSuggestion(item.name)}
                          </p>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-[#8D6E63]">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">暂无游戏记录</p>
                <p className="text-sm">完成游戏训练后，这里会展示详细的数据分析</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/levels')}
                  className="mt-6 btn-primary"
                >
                  开始训练
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getImprovementSuggestion(category: string): string {
  const suggestions: Record<string, string> = {
    '权益过期提醒': '建议在会员权益到期前3-7天进行主动提醒，可采用面对面提醒的方式效果最佳。',
    '退款处理': '高价值会员的退款申请应在24小时内处理，并考虑提供额外补偿以挽回客户。',
    '续充时机': '建议在会员余额剩余20-30元时推荐续充，结合当月优惠活动效果更好。',
    '会员行为模式': '注意分析会员的消费频率变化，异常下降可能意味着有竞争对手分流。',
    '线索分析不足': '请仔细查看所有可用线索，重要线索会有红色标记，充分分析后再做决策。',
  };
  return suggestions[category] || '继续练习可以提升这方面的能力。';
}
