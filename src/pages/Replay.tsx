import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  GitCompare,
  Check,
  X,
  AlertTriangle,
  Package,
  Zap,
} from 'lucide-react';
import { useReplayStore } from '@/store/useReplayStore';
import { GameRecord, ReplayFrame } from '@/types';
import { ERROR_TYPE_LABELS, DEFECT_TYPES, COLORS } from '@/utils/constants';
import { formatTime } from '@/utils/mockData';
import { clsx } from 'clsx';

export default function ReplayPage() {
  const navigate = useNavigate();
  const loadRecords = useReplayStore((state) => state.loadRecords);
  const records = useReplayStore((state) => state.records);
  const allRecords = useReplayStore((state) => state.allRecords);
  const selectedRecordIds = useReplayStore((state) => state.selectedRecordIds);
  const isPlaying = useReplayStore((state) => state.isPlaying);
  const currentTime = useReplayStore((state) => state.currentTime);
  const totalDuration = useReplayStore((state) => state.totalDuration);
  const playbackSpeed = useReplayStore((state) => state.playbackSpeed);
  const selectRecord = useReplayStore((state) => state.selectRecord);
  const deselectRecord = useReplayStore((state) => state.deselectRecord);
  const play = useReplayStore((state) => state.play);
  const pause = useReplayStore((state) => state.pause);
  const seek = useReplayStore((state) => state.seek);
  const setPlaybackSpeed = useReplayStore((state) => state.setPlaybackSpeed);
  const reset = useReplayStore((state) => state.reset);
  const tick = useReplayStore((state) => state.tick);
  const getCurrentFrames = useReplayStore((state) => state.getCurrentFrames);
  const calculateDifferences = useReplayStore((state) => state.calculateDifferences);

  const lastTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!isPlaying) return;

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      tick(delta);
      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tick]);

  const currentFrames = useMemo(() => getCurrentFrames(), [getCurrentFrames, currentTime]);
  const differences = useMemo(() => calculateDifferences(), [calculateDifferences, selectedRecordIds, records]);

  const selectedRecords = useMemo(
    () => records.filter((r) => selectedRecordIds.includes(r.id)),
    [records, selectedRecordIds]
  );

  const replayColors = [
    { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-500', text: 'text-blue-400', light: 'bg-blue-500/20' },
    { bg: 'from-purple-500 to-pink-500', border: 'border-purple-500', text: 'text-purple-400', light: 'bg-purple-500/20' },
    { bg: 'from-orange-500 to-red-500', border: 'border-orange-500', text: 'text-orange-400', light: 'bg-orange-500/20' },
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'pick':
        return '拾取';
      case 'place':
        return '放置';
      case 'submit':
        return '提交';
      case 'error':
        return '标记异常';
      case 'warning':
        return '预警';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'pick':
        return COLORS.neonBlue;
      case 'submit':
        return COLORS.success;
      case 'error':
        return COLORS.warning;
      case 'warning':
        return COLORS.danger;
      default:
        return COLORS.gray;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
              <History className="w-8 h-8 text-pink-400" />
              复盘回放
            </h1>
            <p className="text-gray-500 mt-1">对比最多三次失败记录，分析选择差异</p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-16 text-center">
            <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">暂无失败回放记录</div>
            <div className="text-gray-600 text-sm mb-6">
              完成训练且出现错误后，失败记录将保留在这里供复盘
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all hover:scale-105"
              >
                开始训练
              </button>
              {allRecords.length > 0 && (
                <div className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400">
                  历史完成记录: {allRecords.length} 场
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-cyan-400" />
                选择要对比的回放记录
                <span className="text-sm font-normal text-gray-500">
                  （最多选择 3 条，当前已选 {selectedRecordIds.length}/3）
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {records.map((record, idx) => {
                  const isSelected = selectedRecordIds.includes(record.id);
                  const colors = replayColors[idx];
                  return (
                    <button
                      key={record.id}
                      onClick={() =>
                        isSelected ? deselectRecord(record.id) : selectRecord(record.id)
                      }
                      disabled={!isSelected && selectedRecordIds.length >= 3}
                      className={clsx(
                        'p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden',
                        isSelected
                          ? `${colors.border} ${colors.light}`
                          : 'border-gray-800 bg-gray-800/30 hover:border-gray-700',
                        !isSelected && selectedRecordIds.length >= 3 && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isSelected && (
                        <div
                          className={`absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg`}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isSelected ? `bg-gradient-to-r ${colors.bg}` : 'bg-gray-600'
                          }`}
                        />
                        <span className="text-xs text-gray-500">
                          #{idx + 1} · {formatDate(record.timestamp)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div>
                          <div
                            className={`text-2xl font-bold font-mono ${
                              record.onTimeRate >= 70 ? 'text-green-400' : 'text-orange-400'
                            }`}
                          >
                            {record.onTimeRate}%
                          </div>
                          <div className="text-[10px] text-gray-500">履约率</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-mono text-purple-400">
                            {record.score}
                          </div>
                          <div className="text-[10px] text-gray-500">得分</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm">
                            <span className="text-green-400">{record.correctCount}</span>
                            <span className="text-gray-600">/</span>
                            <span className="text-red-400">{record.wrongCount}</span>
                          </div>
                          <div className="text-[10px] text-gray-500">正/误</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        用时 {formatTime(record.timeUsed)} ·{' '}
                        {record.difficulty === 'easy'
                          ? '简单'
                          : record.difficulty === 'normal'
                          ? '普通'
                          : '困难'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRecords.length > 0 && (
              <>
                <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Play className="w-5 h-5 text-green-400" />
                      回放控制
                    </h2>
                    <div className="flex items-center gap-2">
                      {[0.5, 1, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            playbackSpeed === speed
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                      onClick={() => seek(0)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={isPlaying ? pause : play}
                      className={`p-4 rounded-2xl transition-all hover:scale-105 shadow-lg ${
                        isPlaying
                          ? 'bg-gradient-to-r from-orange-500 to-red-500'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current" />
                      )}
                    </button>
                    <button
                      onClick={() => seek(totalDuration)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                    <div className="ml-4 px-4 py-2 bg-gray-800 rounded-xl font-mono text-sm">
                      <span className="text-blue-400">{formatTime(currentTime)}</span>
                      <span className="text-gray-600 mx-2">/</span>
                      <span className="text-gray-500">{formatTime(totalDuration)}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={totalDuration}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => seek(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>0s</span>
                      <span>{Math.round(totalDuration / 2)}s</span>
                      <span>{Math.round(totalDuration)}s</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid gap-4 mb-6 ${
                    selectedRecords.length === 1
                      ? 'grid-cols-1'
                      : selectedRecords.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                  }`}
                >
                  {selectedRecords.map((record, idx) => {
                    const colors = replayColors[idx];
                    const frame = currentFrames[record.id];
                    const frameActions = record.replayData.filter(
                      (f) => f.time <= currentTime
                    );
                    const correctCount = frameActions.filter(
                      (f) => f.isCorrect && f.action !== 'warning'
                    ).length;
                    const wrongCount = frameActions.filter(
                      (f) => !f.isCorrect || f.action === 'error'
                    ).length;
                    return (
                      <div
                        key={record.id}
                        className={`bg-gray-900/60 border-2 ${colors.border} rounded-3xl overflow-hidden`}
                      >
                        <div
                          className={`p-4 bg-gradient-to-r ${colors.bg}/20 border-b ${colors.border}/30 flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors.bg}`}
                            />
                            <span className="font-bold">回放 #{idx + 1}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(record.timestamp)}
                          </span>
                        </div>

                        <div className="p-5">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                              <Gauge className={`w-4 h-4 mx-auto mb-1 ${colors.text}`} />
                              <div
                                className={`text-xl font-bold font-mono ${
                                  record.onTimeRate >= 70 ? 'text-green-400' : 'text-orange-400'
                                }`}
                              >
                                {record.onTimeRate}%
                              </div>
                              <div className="text-[10px] text-gray-500">履约率</div>
                            </div>
                            <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                              <Target className={`w-4 h-4 mx-auto mb-1 ${colors.text}`} />
                              <div className="text-xl font-bold font-mono text-purple-400">
                                {record.score}
                              </div>
                              <div className="text-[10px] text-gray-500">得分</div>
                            </div>
                            <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                              <Zap className={`w-4 h-4 mx-auto mb-1 ${colors.text}`} />
                              <div className="font-mono text-sm">
                                <span className="text-green-400">{correctCount}</span>
                                <span className="text-gray-600 mx-0.5">/</span>
                                <span className="text-red-400">{wrongCount}</span>
                              </div>
                              <div className="text-[10px] text-gray-500">正/误</div>
                            </div>
                          </div>

                          <div className="bg-gray-800/30 rounded-xl p-4 mb-4 min-h-[100px]">
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              当前动作节点
                            </div>
                            {frame ? (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-medium"
                                    style={{
                                      backgroundColor: getActionColor(frame.action) + '30',
                                      color: getActionColor(frame.action),
                                    }}
                                  >
                                    {getActionLabel(frame.action)}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    t={frame.time.toFixed(1)}s
                                  </span>
                                  {frame.isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                {frame.errorType && (
                                  <div
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                                    style={{
                                      backgroundColor:
                                        DEFECT_TYPES[
                                          frame.errorType as keyof typeof DEFECT_TYPES
                                        ]?.color + '20' || '#F53F3F20',
                                      color:
                                        DEFECT_TYPES[
                                          frame.errorType as keyof typeof DEFECT_TYPES
                                        ]?.color || '#F53F3F',
                                    }}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    {ERROR_TYPE_LABELS[frame.errorType] || frame.errorType}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-600 text-sm">
                                点击播放按钮开始回放...
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-2">时间轴动作标记</div>
                            <div className="relative h-6 bg-gray-800 rounded-lg overflow-hidden">
                              {record.replayData.map((f, fIdx) => (
                                <div
                                  key={fIdx}
                                  className={clsx(
                                    'absolute top-0 bottom-0 w-0.5',
                                    f.time <= currentTime ? 'opacity-100' : 'opacity-30',
                                    !f.isCorrect ? 'bg-red-500' : 'bg-blue-500'
                                  )}
                                  style={{
                                    left: `${(f.time / totalDuration) * 100}%`,
                                  }}
                                />
                              ))}
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/30"
                                style={{
                                  left: `${(currentTime / totalDuration) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {differences.length > 0 && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <GitCompare className="w-5 h-5 text-yellow-400" />
                      关键差异节点
                      <span className="text-sm font-normal text-gray-500">
                        ({differences.length} 处选择差异)
                      </span>
                    </h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {differences.map((diff, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-mono text-sm text-gray-400">
                              t = {diff.time.toFixed(1)}s
                            </span>
                          </div>
                          <div
                            className={`grid gap-3 ${
                              diff.differences.length === 2
                                ? 'grid-cols-2'
                                : 'grid-cols-3'
                            }`}
                          >
                            {diff.differences.map((d, dIdx) => {
                              const colors = replayColors[dIdx];
                              const record = records.find(
                                (r) => r.id === d.recordId
                              );
                              return (
                                <div
                                  key={dIdx}
                                  className={`p-3 rounded-xl border ${colors.border}/30 ${colors.light}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.bg}`}
                                      />
                                      <span className="text-xs text-gray-400">
                                        回放 #{dIdx + 1}
                                      </span>
                                    </div>
                                    {d.isCorrect ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className="px-2 py-0.5 rounded text-xs"
                                      style={{
                                        backgroundColor:
                                          getActionColor(d.action) + '30',
                                        color: getActionColor(d.action),
                                      }}
                                    >
                                      {getActionLabel(d.action)}
                                    </span>
                                    <Package className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs text-gray-400 font-mono">
                                      {d.productId.slice(-6)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
