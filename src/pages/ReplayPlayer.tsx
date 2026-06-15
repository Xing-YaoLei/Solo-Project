import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, AlertTriangle, Clock } from 'lucide-react';
import { useReplayStore } from '../stores/useReplayStore';
import { getOperationDescription, formatDate, getPhaseName, getPhaseColor } from '../utils/helpers';

const speeds = [0.5, 1, 1.5, 2];

export default function ReplayPlayer() {
  const { replayId } = useParams<{ replayId: string }>();
  const navigate = useNavigate();
  const { replays, loadReplay, currentReplay, isPlaying, playbackSpeed, currentTime, playReplay, pauseReplay, seekToTime, setPlaybackSpeed } = useReplayStore();
  const [showStuckPoints, setShowStuckPoints] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (replayId) {
      loadReplay(replayId);
    }
  }, [replayId, loadReplay]);

  useEffect(() => {
    if (isPlaying && currentReplay) {
      intervalRef.current = window.setInterval(() => {
        const newTime = currentTime + 0.1 * playbackSpeed;
        if (newTime >= currentReplay.duration) {
          pauseReplay();
          seekToTime(currentReplay.duration);
        } else {
          seekToTime(newTime);
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentTime, currentReplay, pauseReplay, seekToTime]);

  const handleSpeedClick = () => {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekToTime(time);
  };

  const handleBack = () => {
    pauseReplay();
    navigate('/replay');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPhase = () => {
    if (!currentReplay) return 'observe';
    const startTime = currentReplay.operations[0]?.timestamp || 0;
    const targetTime = startTime + currentTime * 1000;
    
    let phase = 'observe';
    for (const op of currentReplay.operations) {
      if (op.timestamp <= targetTime) {
        phase = op.phase;
      }
    }
    return phase as any;
  };

  const currentPhase = getCurrentPhase();

  if (!currentReplay) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <p className="text-stone-400">回放不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回回放列表
        </button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-100 font-serif mb-2">
            {currentReplay.levelName} - 回放
          </h1>
          <p className="text-stone-400">
            {formatDate(currentReplay.timestamp)} · 最终得分 {currentReplay.finalScore}
          </p>
        </div>

        <div className="bg-stone-800/60 rounded-2xl border border-stone-700/50 overflow-hidden mb-6">
          <div className="aspect-video bg-gradient-to-br from-stone-800 to-stone-900 relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">🎓</div>
              <p className="text-stone-500">教室场景预览</p>
              <div 
                className="mt-4 px-4 py-2 rounded-full text-sm font-medium inline-block"
                style={{ 
                  backgroundColor: `${getPhaseColor(currentPhase)}20`,
                  color: getPhaseColor(currentPhase),
                }}
              >
                当前阶段：{getPhaseName(currentPhase)}
              </div>
            </div>

            {showStuckPoints && currentReplay.stuckPoints.length > 0 && (
              <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3 max-w-xs">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  当前卡点
                </div>
                {currentReplay.stuckPoints
                  .filter((sp) => {
                    const startTime = currentReplay.operations[0]?.timestamp || 0;
                    const spTime = (sp.timestamp - startTime) / 1000;
                    return Math.abs(currentTime - spTime) < 5;
                  })
                  .map((sp, index) => (
                    <p key={index} className="text-stone-300 text-sm">
                      {sp.description}
                    </p>
                  ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-stone-900/50">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => seekToTime(0)}
                className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => (isPlaying ? pauseReplay() : playReplay())}
                className="p-4 bg-amber-500 hover:bg-amber-400 text-white rounded-full transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                onClick={() => seekToTime(currentReplay.duration)}
                className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex-1 mx-4">
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={currentReplay.duration}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-stone-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  {currentReplay.stuckPoints.map((sp, index) => {
                    const startTime = currentReplay.operations[0]?.timestamp || 0;
                    const position = ((sp.timestamp - startTime) / 1000 / currentReplay.duration) * 100;
                    return (
                      <div
                        key={index}
                        className="absolute top-0 w-1 h-2 bg-red-500 rounded-full"
                        style={{ left: `${position}%` }}
                        title={`卡点: ${sp.description}`}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="text-stone-400 font-mono text-sm w-20 text-right">
                {formatTime(currentTime)} / {formatTime(currentReplay.duration)}
              </span>

              <button
                onClick={handleSpeedClick}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-sm font-medium transition-colors"
              >
                {playbackSpeed}x
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-stone-500">
              <span>提示：拖动进度条查看不同时间点的操作</span>
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={showStuckPoints}
                  onChange={(e) => setShowStuckPoints(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                显示卡点标记
              </label>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50">
            <h3 className="text-lg font-bold text-stone-100 font-serif mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              操作时间线
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentReplay.operations.map((op, index) => {
                const startTime = currentReplay.operations[0]?.timestamp || 0;
                const opTime = (op.timestamp - startTime) / 1000;
                const isActive = currentTime >= opTime;
                
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-stone-700/30' : 'opacity-50'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: getPhaseColor(op.phase) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-200 text-sm">{getOperationDescription(op)}</p>
                      <p className="text-stone-500 text-xs">
                        {formatTime(opTime)} · {getPhaseName(op.phase)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-stone-800/60 rounded-2xl p-5 border border-stone-700/50">
            <h3 className="text-lg font-bold text-stone-100 font-serif mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              卡点分析
            </h3>
            {currentReplay.stuckPoints.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <p>没有发现明显卡点</p>
                <p className="text-sm mt-1">操作流程很流畅！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentReplay.stuckPoints.map((sp, index) => {
                  const startTime = currentReplay.operations[0]?.timestamp || 0;
                  const spTime = (sp.timestamp - startTime) / 1000;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => seekToTime(spTime)}
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl cursor-pointer hover:bg-red-500/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-300 font-medium text-sm">{sp.description}</span>
                        <span className="text-stone-500 text-xs">{formatTime(spTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${getPhaseColor(sp.phase)}20`,
                            color: getPhaseColor(sp.phase),
                          }}
                        >
                          {getPhaseName(sp.phase)}
                        </span>
                        <span>停留 {Math.round(sp.duration / 1000)} 秒</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-200 text-sm">
                💡 <strong>建议：</strong>在卡点处多练习，熟悉操作流程可以显著提升效率。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
