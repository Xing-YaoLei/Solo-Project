import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, Settings, BarChart3, Zap, Trophy } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const navigate = useNavigate();
  const { levelRecords } = useGameStore();

  const totalAttempts = levelRecords.reduce((sum, r) => sum + r.attempts, 0);
  const bestScore = levelRecords.reduce((max, r) => Math.max(max, r.bestScore), 0);
  const avgCompletion = levelRecords.length > 0
    ? Math.round(levelRecords.reduce((sum, r) => sum + r.avgCompletionRate, 0) / levelRecords.length * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            教材发放调度大师
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            青少年培训教材发放调度解谜游戏 · 提升分类效率与反应速度
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">总练习次数</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalAttempts}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-500 text-sm">最高分</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{bestScore.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500 text-sm">平均完成率</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{avgCompletion}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/levels/formal')}
            className="group bg-white rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-200 text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                推荐
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">正式训练</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              教学主管指定关卡，达标才能通过。包含严格的时间限制和评分标准，适合考核训练成果。
            </p>
            <div className="flex items-center text-indigo-600 font-medium">
              <span>进入训练</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/levels/free')}
            className="group bg-white rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200 text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                轻松
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">自由练习</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              无门槛自由练习，随时开始随时结束。适合熟悉操作、提升手感，失败可立即重试。
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>开始练习</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/review')}
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-800">训练复盘</p>
            <p className="text-sm text-gray-500 mt-1">关卡完成率对比</p>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <p className="font-semibold text-gray-800">系统设置</p>
            <p className="text-sm text-gray-500 mt-1">声音震动动画</p>
          </button>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 text-left">
            <div className="text-2xl mb-3">📚</div>
            <p className="font-semibold text-gray-800">玩法简介</p>
            <p className="text-sm text-gray-500 mt-1">将教材分类放入对应格子</p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100 text-left">
            <div className="text-2xl mb-3">⚡</div>
            <p className="font-semibold text-gray-800">评分维度</p>
            <p className="text-sm text-gray-500 mt-1">速度 · 准确率 · 连击</p>
          </div>
        </div>
      </div>
    </div>
  );
}
