import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ArrowLeft, TrendingUp, Clock, Award, Users, BarChart3, Activity } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { useReplayStore } from '../stores/useReplayStore';
import { getLevelById } from '../data/levels';
import { getPhaseName, calculateAverageUtilization, calculatePeakUtilization, formatDate } from '../utils/helpers';

export default function ReviewPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { currentReviewData } = useGameStore();
  const { replays } = useReplayStore();

  const level = levelId ? getLevelById(levelId) : null;
  
  const reviewData = useMemo(() => {
    return currentReviewData || replays.find((r) => r.levelId === levelId) || replays[0];
  }, [currentReviewData, replays, levelId]);

  const chartData = useMemo(() => {
    if (!reviewData) return [];
    return reviewData.utilizationHistory
      .slice()
      .reverse()
      .map((point, index) => ({
        time: index,
        utilization: Math.round(point.utilization),
        phase: getPhaseName(point.phase),
        timeLabel: `${Math.floor((reviewData.duration - point.time) / 60)}:${Math.floor((reviewData.duration - point.time) % 60).toString().padStart(2, '0')}`,
      }));
  }, [reviewData]);

  const avgUtil = useMemo(
    () => calculateAverageUtilization(reviewData?.utilizationHistory || []),
    [reviewData]
  );

  const peakUtil = useMemo(
    () => calculatePeakUtilization(reviewData?.utilizationHistory || []),
    [reviewData]
  );

  const handleBack = () => {
    navigate('/');
  };

  const handleReplay = () => {
    if (reviewData) {
      navigate(`/replay/${reviewData.id}`);
    }
  };

  if (!level) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <p className="text-stone-400">关卡不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回主菜单
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-100 font-serif mb-2">
            关卡复盘
          </h1>
          <p className="text-stone-400">
            {level.name} · {level.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-stone-400 text-sm">最终得分</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 font-serif">
              {reviewData?.finalScore || 0}
            </p>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sky-500/20 rounded-xl">
                <Clock className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-stone-400 text-sm">用时</span>
            </div>
            <p className="text-3xl font-bold text-sky-400 font-mono">
              {Math.floor((reviewData?.duration || 0) / 60)}:{Math.floor((reviewData?.duration || 0) % 60).toString().padStart(2, '0')}
            </p>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-stone-400 text-sm">平均利用率</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 font-serif">
              {avgUtil}%
            </p>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-500/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-stone-400 text-sm">峰值利用率</span>
            </div>
            <p className="text-3xl font-bold text-violet-400 font-serif">
              {peakUtil}%
            </p>
          </div>
        </div>

        <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-100 font-serif flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              教室利用率变化
            </h2>
            <span className="text-stone-500 text-sm">
              目标利用率: {level.targetUtilization}%
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F9A825" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F9A825" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#78716c"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#78716c"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#292524',
                    border: '1px solid #57534e',
                    borderRadius: '12px',
                    color: '#fafaf9',
                  }}
                  labelStyle={{ color: '#a8a29e' }}
                  formatter={(value: number) => [`${value}%`, '利用率']}
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke="#F9A825"
                  strokeWidth={2}
                  fill="url(#utilizationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-stone-100 font-serif mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              操作统计
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">总操作次数</span>
                <span className="text-stone-100 font-mono">{reviewData?.operations.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">卡点次数</span>
                <span className="text-amber-400 font-mono">{reviewData?.stuckPoints.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">数据采集点</span>
                <span className="text-stone-100 font-mono">{reviewData?.utilizationHistory.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">完成时间</span>
                <span className="text-stone-100">
                  {reviewData ? formatDate(reviewData.timestamp) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-stone-100 font-serif mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              评价
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-400">效率评分</span>
                  <span className="text-amber-400">{avgUtil >= level.targetUtilization ? '优秀' : avgUtil >= level.targetUtilization * 0.8 ? '良好' : '待提升'}</span>
                </div>
                <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, avgUtil)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-400">准确度</span>
                  <span className="text-emerald-400">
                    {reviewData?.success ? '通过' : '未通过'}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      reviewData?.success ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${reviewData?.success ? 100 : 40}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-400">流畅度</span>
                  <span className="text-sky-400">
                    {(reviewData?.stuckPoints.length || 0) === 0 ? '流畅' : (reviewData?.stuckPoints.length || 0) === 1 ? '一般' : '需练习'}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - (reviewData?.stuckPoints.length || 0) * 30)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleReplay}
            className="flex-1 py-4 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-xl font-medium transition-all hover:scale-[1.02]"
          >
            查看失败回放
          </button>
          <button
            onClick={() => navigate(`/game/${levelId}`)}
            className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20"
          >
            再次挑战
          </button>
        </div>
      </div>
    </div>
  );
}
