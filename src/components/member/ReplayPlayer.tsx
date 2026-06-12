import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, FastForward, Clock, AlertTriangle } from 'lucide-react';
import { useReplay } from '@/hooks/useReplay';
import type { FailureReplay } from '@/types/game';

interface ReplayPlayerProps {
  recordId?: string;
  replays?: FailureReplay[];
  showReplaySelector?: boolean;
}

export function ReplayPlayer({ recordId, replays: propReplays, showReplaySelector = true }: ReplayPlayerProps) {
  const {
    replays,
    currentReplay,
    currentReplayIndex,
    isPlaying,
    currentTime,
    totalDuration,
    speed,
    currentEvent,
    play,
    pause,
    togglePlay,
    seekTo,
    setSpeed,
    selectReplay,
    formatTime,
    getHesitationPointsInRange,
    hasReplays,
  } = useReplay({ recordId, replays: propReplays });

  const [visibleHesitations, setVisibleHesitations] = useState<ReturnType<typeof getHesitationPointsInRange>>([]);

  useEffect(() => {
    const rangeStart = Math.max(0, currentTime - 1000);
    const rangeEnd = currentTime + 1000;
    setVisibleHesitations(getHesitationPointsInRange(rangeStart, rangeEnd));
  }, [currentTime, getHesitationPointsInRange]);

  if (!hasReplays) {
    return (
      <div className="text-center py-12 text-[#8D6E63]">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无失败回放记录</p>
        <p className="text-xs mt-1">完成任务后失败的记录会保存在这里</p>
      </div>
    );
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="space-y-4">
      {showReplaySelector && replays.length > 1 && (
        <div className="flex gap-2 mb-4">
          {replays.map((_, index) => (
            <button
              key={index}
              onClick={() => selectReplay(index)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentReplayIndex === index
                  ? 'bg-[#FF8F00] text-[#3E2723]'
                  : 'bg-[#4E342E]/50 text-[#8D6E63] hover:bg-[#5D4037]/50'
              }`}
            >
              回放 {index + 1}
            </button>
          ))}
        </div>
      )}

      {currentReplay && (
        <>
          <div className="p-4 bg-[#4E342E]/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8D6E63]" />
                <span className="text-sm text-[#8D6E63]">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[0.5, 1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 text-xs rounded ${
                      speed === s
                        ? 'bg-[#FF8F00] text-[#3E2723]'
                        : 'bg-[#5D4037]/50 text-[#8D6E63] hover:bg-[#5D4037]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="relative h-3 bg-[#3E2723] rounded-full mb-4 overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-[#FF8F00] rounded-full"
                style={{ width: `${progress}%` }}
              />
              
              {currentReplay.hesitationPoints.map((point, i) => {
                const startTime = currentReplay.timeline[0]?.timestamp || 0;
                const position = ((point.timestamp - startTime) / totalDuration) * 100;
                return (
                  <div
                    key={i}
                    className="absolute top-0 w-2 h-full bg-[#EF5350] opacity-60"
                    style={{ left: `${position}%` }}
                    title={point.description}
                  />
                );
              })}
              
              <input
                type="range"
                min={0}
                max={totalDuration}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => seekTo(0)}
                className="p-2 rounded-full bg-[#5D4037]/50 hover:bg-[#5D4037] transition-colors"
              >
                <SkipBack className="w-5 h-5 text-[#FFF8E1]" />
              </button>
              <button
                onClick={togglePlay}
                className="p-4 rounded-full bg-[#FF8F00] hover:bg-[#FFA726] transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-[#3E2723]" />
                ) : (
                  <Play className="w-6 h-6 text-[#3E2723]" />
                )}
              </button>
              <button
                onClick={() => setSpeed(speed === 2 ? 1 : 2)}
                className="p-2 rounded-full bg-[#5D4037]/50 hover:bg-[#5D4037] transition-colors"
              >
                <FastForward className="w-5 h-5 text-[#FFF8E1]" />
              </button>
            </div>
          </div>

          {currentEvent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentEvent.timestamp}
              className="p-4 bg-[#5D4037]/30 rounded-xl border-l-4 border-[#FF8F00]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-[#FF8F00]/20 text-[#FFCC80]">
                  {currentEvent.type}
                </span>
                <span className="text-xs text-[#8D6E63]">
                  {formatTime(currentTime)}
                </span>
              </div>
              <p className="text-sm text-[#D7CCC8]">
                {formatEventDescription(currentEvent)}
              </p>
            </motion.div>
          )}

          {visibleHesitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[#8D6E63] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#FF8F00]" />
                犹豫点标记
              </p>
              {visibleHesitations.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-[#EF5350]/10 border border-[#EF5350]/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#FF8A65]">{point.description}</span>
                    <span className="text-xs text-[#8D6E63]">
                      {(point.duration / 1000).toFixed(1)}秒
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-[#4E342E]/30 rounded-xl">
            <p className="text-xs text-[#8D6E63] mb-2">时间线</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentReplay.timeline.map((event, i) => {
                const startTime = currentReplay.timeline[0]?.timestamp || 0;
                const eventTime = event.timestamp - startTime;
                return (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded ${
                      currentEvent?.timestamp === event.timestamp
                        ? 'bg-[#FF8F00]/20 text-[#FFCC80]'
                        : 'text-[#8D6E63]'
                    }`}
                  >
                    {formatTime(eventTime)} - {formatEventDescription(event)}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatEventDescription(event: FailureReplay['timeline'][0]): string {
  const descriptions: Record<string, string> = {
    task_start: '任务开始',
    clue_view: '查看线索',
    decision_start: '开始决策',
    decision_made: `做出决策: ${event.data.isCorrect ? '正确' : '错误'}`,
    task_end: `任务结束: ${event.data.success ? '成功' : '失败'}`,
  };
  return descriptions[event.type] || event.type;
}
