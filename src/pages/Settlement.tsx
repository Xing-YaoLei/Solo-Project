import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Package,
  User,
  Hash,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  Box,
} from 'lucide-react';
import { getSavedRecords } from '@/store/useGameStore';
import { useStatsStore } from '@/store/useStatsStore';
import { GameRecord, ProductError } from '@/types';
import { ERROR_TYPE_LABELS, DEFECT_TYPES, COLORS } from '@/utils/constants';
import { formatTime } from '@/utils/mockData';
import { clsx } from 'clsx';

export default function SettlementPage() {
  const navigate = useNavigate();
  const loadStats = useStatsStore((state) => state.loadStats);
  const recentRecords = useStatsStore((state) => state.recentRecords);
  const isLoaded = useStatsStore((state) => state.isLoaded);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const latestRecord = useMemo(() => {
    if (!isLoaded) return null;
    const records = getSavedRecords();
    return records[0] || null;
  }, [isLoaded]);

  const errorByType = useMemo(() => {
    const errors: Record<string, ProductError[]> = {};
    latestRecord?.productErrors.forEach((err) => {
      if (!errors[err.errorType]) errors[err.errorType] = [];
      errors[err.errorType].push(err);
    });
    return errors;
  }, [latestRecord]);

  const totalErrorCount = latestRecord?.productErrors.length || 0;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all hover:scale-105 border border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-yellow-400" />
              结算清单错因分析
            </h1>
            <p className="text-gray-500 mt-1">到货清单相关错因拆分与明细查看</p>
          </div>
        </div>

        {!latestRecord ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-16 text-center">
            <Box className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">暂无训练记录</div>
            <div className="text-gray-600 text-sm mb-6">完成一局训练后即可查看结算详情</div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all hover:scale-105"
            >
              开始训练
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  训练时间
                </div>
                <div className="text-gray-300 text-lg font-medium">
                  {formatDate(latestRecord.timestamp)}
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
                  <DollarSign className="w-4 h-4" />
                  最终得分
                </div>
                <div className="text-purple-400 text-3xl font-bold font-mono">
                  {latestRecord.score.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  正确 / 错误
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-green-400 text-2xl font-bold font-mono">
                    {latestRecord.correctCount}
                  </span>
                  <span className="text-gray-600">/</span>
                  <span className="text-red-400 text-2xl font-bold font-mono">
                    {latestRecord.wrongCount}
                  </span>
                </div>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  履约准时率
                </div>
                <div
                  className={clsx(
                    'text-3xl font-bold font-mono',
                    latestRecord.onTimeRate >= 70 ? 'text-green-400' : 'text-orange-400'
                  )}
                >
                  {latestRecord.onTimeRate}%
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                错因分布总览
                {totalErrorCount > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    （共 {totalErrorCount} 项错误）
                  </span>
                )}
              </h2>
              {totalErrorCount === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
                  <div className="text-green-400 text-xl font-medium">
                    本次训练无任何错误！
                  </div>
                  <div className="text-gray-500 mt-2">完美的履约表现，继续保持</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(errorByType).map(([errorType, errors]) => {
                    const percentage = Math.round(
                      (errors.length / totalErrorCount) * 100
                    );
                    const isShortage = errorType === 'shortage';
                    return (
                      <div
                        key={errorType}
                        className={clsx(
                          'rounded-2xl p-5 border',
                          isShortage
                            ? 'bg-red-500/5 border-red-500/30'
                            : 'bg-gray-800/50 border-gray-700'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {isShortage ? (
                              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                                <XCircle className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div
                                className={clsx(
                                  'font-bold',
                                  isShortage ? 'text-red-400' : 'text-gray-200'
                                )}
                              >
                                {ERROR_TYPE_LABELS[errorType] || errorType}
                              </div>
                              <div className="text-xs text-gray-500">
                                {isShortage
                                  ? '未及时标记的到货短少商品'
                                  : '核销匹配错误'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={clsx(
                                'text-2xl font-bold font-mono',
                                isShortage ? 'text-red-400' : 'text-gray-300'
                              )}
                            >
                              {errors.length}
                            </div>
                            <div className="text-xs text-gray-500">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                          <div
                            className={clsx(
                              'h-full transition-all',
                              isShortage
                                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                                : 'bg-gradient-to-r from-gray-500 to-gray-400'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-gray-800/50 rounded-lg px-3 py-2"
                            >
                              <span className="text-gray-300 truncate max-w-[180px]">
                                {err.productName}
                              </span>
                              <span className="text-gray-500 font-mono">
                                {err.productId.slice(-8)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                到货清单明细
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-800">
                      <th className="pb-3 font-medium">商品名称</th>
                      <th className="pb-3 font-medium">状态</th>
                      <th className="pb-3 font-medium">错因类型</th>
                      <th className="pb-3 font-medium">预期结算</th>
                      <th className="pb-3 font-medium">实际投放</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {latestRecord.productErrors.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-600"
                        >
                          所有商品均正确核销
                        </td>
                      </tr>
                    ) : (
                      latestRecord.productErrors.map((err, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-800/50 hover:bg-gray-800/30"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-500" />
                              </div>
                              <span className="text-gray-200">
                                {err.productName}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs">
                              <XCircle className="w-3 h-3 inline mr-1" />
                              错误
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className="px-2 py-1 rounded-lg text-xs"
                              style={{
                                backgroundColor:
                                  DEFECT_TYPES[
                                    err.errorType as keyof typeof DEFECT_TYPES
                                  ]?.color + '20' || '#F53F3F20',
                                color:
                                  DEFECT_TYPES[
                                    err.errorType as keyof typeof DEFECT_TYPES
                                  ]?.color || '#F53F3F',
                              }}
                            >
                              {ERROR_TYPE_LABELS[err.errorType] || err.errorType}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400 font-mono text-xs">
                            {err.expectedSettlement.slice(-8)}
                          </td>
                          <td className="py-4 text-gray-400 font-mono text-xs">
                            {err.actualSettlement
                              ? err.actualSettlement.slice(-8)
                              : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {recentRecords.length > 1 && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  历史训练记录
                </h2>
                <div className="space-y-3">
                  {recentRecords.slice(1, 6).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            record.wrongCount === 0
                              ? 'bg-green-500/20'
                              : 'bg-orange-500/20'
                          )}
                        >
                          {record.wrongCount === 0 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-gray-300 font-medium">
                            {formatDate(record.timestamp)}
                          </div>
                          <div className="text-xs text-gray-500">
                            用时 {formatTime(record.timeUsed)} ·{' '}
                            {record.difficulty === 'easy'
                              ? '简单'
                              : record.difficulty === 'normal'
                              ? '普通'
                              : '困难'}
                            模式
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-purple-400 font-bold font-mono">
                            {record.score.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">得分</div>
                        </div>
                        <div className="text-right">
                          <div
                            className={clsx(
                              'font-bold font-mono',
                              record.onTimeRate >= 70
                                ? 'text-green-400'
                                : 'text-orange-400'
                            )}
                          >
                            {record.onTimeRate}%
                          </div>
                          <div className="text-xs text-gray-500">履约率</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">
                            <span className="text-green-400">
                              {record.correctCount}
                            </span>
                            <span className="text-gray-600"> / </span>
                            <span className="text-red-400">
                              {record.wrongCount}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">正/误</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
