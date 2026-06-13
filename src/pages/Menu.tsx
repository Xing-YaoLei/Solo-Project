import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  BarChart3,
  FileText,
  History,
  Sparkles,
  Zap,
  Target,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useStatsStore } from '@/store/useStatsStore';
import { useReplayStore } from '@/store/useReplayStore';
import { Difficulty } from '@/types';
import { GAME_CONFIG, COLORS } from '@/utils/constants';
import { clsx } from 'clsx';

const difficultyInfo: Record<
  Difficulty,
  { label: string; desc: string; color: string; bgColor: string; borderColor: string }
> = {
  easy: {
    label: '简单',
    desc: '120秒 | 8件商品 | 适合新手熟悉流程',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30 hover:border-green-500/60',
  },
  normal: {
    label: '普通',
    desc: '90秒 | 12件商品 | 标准训练难度',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30 hover:border-blue-500/60',
  },
  hard: {
    label: '困难',
    desc: '60秒 | 16件商品 | 挑战你的极限',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30 hover:border-orange-500/60',
  },
};

export default function MenuPage() {
  const navigate = useNavigate();
  const startGame = useGameStore((state) => state.startGame);
  const loadStats = useStatsStore((state) => state.loadStats);
  const averageScore = useStatsStore((state) => state.averageScore);
  const totalGames = useStatsStore((state) => state.totalGames);
  const averageOnTimeRate = useStatsStore((state) => state.averageOnTimeRate);
  const loadRecords = useReplayStore((state) => state.loadRecords);
  const records = useReplayStore((state) => state.records);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');

  useEffect(() => {
    loadStats();
    loadRecords();
  }, [loadStats, loadRecords]);

  const handleStartGame = (difficulty: Difficulty) => {
    startGame(difficulty);
    navigate('/game');
  };

  const features = [
    {
      icon: Package,
      title: '商品标签识别',
      desc: '快速识别商品批次标签颜色，匹配对应团购批次',
      color: COLORS.neonBlue,
    },
    {
      icon: FileText,
      title: '结算单精准匹配',
      desc: '将商品投放到正确的结算柜台，完成核销流程',
      color: COLORS.neonGreen,
    },
    {
      icon: AlertTriangle,
      title: '异常商品处理',
      desc: '到货短少、包装破损等异常需及时标记，预警提示防失败',
      color: COLORS.warning,
    },
    {
      icon: History,
      title: '复盘对比回放',
      desc: '保留三次失败记录，对比分析选择差异，持续提升',
      color: COLORS.neonPink,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/30 to-gray-950 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-500/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-purple-500/5 rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400 mb-6">
            <Sparkles className="w-4 h-4" />
            社区团购自提核销训练系统
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            自提核销调度解谜
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            在限定时间内，根据商品标签和团购批次，精准完成结算单核销处理
            <br />
            及时发现并标记异常商品，提升履约准时率
          </p>
        </header>

        {(totalGames > 0 || averageScore > 0) && (
          <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-purple-400 mb-1">
                {totalGames}
              </div>
              <div className="text-xs text-gray-500">总训练次数</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">
                {averageScore.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">平均得分</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 text-center">
              <div
                className={`text-3xl font-bold font-mono mb-1 ${
                  averageOnTimeRate >= 70 ? 'text-green-400' : 'text-orange-400'
                }`}
              >
                {averageOnTimeRate}%
              </div>
              <div className="text-xs text-gray-500">平均履约率</div>
            </div>
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            选择训练难度
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(difficultyInfo) as Difficulty[]).map((diff) => {
              const info = difficultyInfo[diff];
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  onDoubleClick={() => handleStartGame(diff)}
                  className={clsx(
                    'p-5 rounded-2xl border-2 transition-all text-left',
                    info.bgColor,
                    isSelected
                      ? `${info.borderColor} scale-105 shadow-lg`
                      : 'border-gray-700/50 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx('text-2xl font-bold', info.color)}>
                      {info.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className={clsx('w-6 h-6', info.color)} />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{info.desc}</p>
                  <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-500">
                    得分加成: x{GAME_CONFIG[diff].scorePerCorrect / 100}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => handleStartGame(selectedDifficulty)}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-2xl shadow-purple-500/30"
          >
            <Play className="w-6 h-6 fill-current" />
            开始训练
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex items-center gap-2 px-6 py-4 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 hover:border-gray-600 rounded-2xl font-medium transition-all hover:scale-105"
          >
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            统计分析
          </button>
          <button
            onClick={() => navigate('/replay')}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-medium transition-all hover:scale-105 border ${
              records.length > 0
                ? 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 hover:border-gray-600'
                : 'bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed'
            }`}
            disabled={records.length === 0}
          >
            <History className="w-5 h-5 text-pink-400" />
            复盘回放
            {records.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded-full">
                {records.length}
              </span>
            )}
          </button>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-400" />
            玩法说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: feature.color + '20' }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            操作指南
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <div className="font-medium text-gray-200">拾取商品</div>
                  <div className="text-sm text-gray-500">
                    点击货架上的商品查看详情，识别商品标签颜色和批次信息
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <div className="font-medium text-gray-200">匹配结算单</div>
                  <div className="text-sm text-gray-500">
                    查看右侧结算单列表，匹配相同批次颜色的柜台进行投放
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium text-gray-200">处理异常</div>
                  <div className="text-sm text-gray-500">
                    发现异常商品（短少、破损等）及时标记，收到预警请迅速响应
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div>
                  <div className="font-medium text-gray-200">复盘提升</div>
                  <div className="text-sm text-gray-500">
                    训练结束后查看统计和回放，对比三次失败记录优化策略
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>© 2024 社区团购自提核销训练系统 | 提升履约效率，保障用户体验</p>
        </footer>
      </div>
    </div>
  );
}
