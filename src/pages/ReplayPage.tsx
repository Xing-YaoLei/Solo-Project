import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Play, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { useReplayStore } from '../stores/useReplayStore';
import { formatDate, getDifficultyLabel, getDifficultyColor } from '../utils/helpers';
import { getLevelById } from '../data/levels';

export default function ReplayPage() {
  const navigate = useNavigate();
  const { replays, deleteReplay } = useReplayStore();

  const handleBack = () => {
    navigate('/');
  };

  const handlePlayReplay = (replayId: string) => {
    navigate(`/replay/${replayId}`);
  };

  const handleDelete = (e: React.MouseEvent, replayId: string) => {
    e.stopPropagation();
    deleteReplay(replayId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回主菜单
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-100 font-serif mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            失败回放
          </h1>
          <p className="text-stone-400">
            保留最近 {replays.length} 次失败记录，查看卡点帮助提升
          </p>
        </div>

        {replays.length === 0 ? (
          <div className="text-center py-16 bg-stone-800/40 rounded-2xl border border-stone-700/50">
            <div className="w-16 h-16 bg-stone-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-stone-500" />
            </div>
            <p className="text-stone-400 mb-2">暂无失败记录</p>
            <p className="text-stone-500 text-sm">完成关卡挑战后，失败记录会显示在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replays.map((replay, index) => {
              const level = getLevelById(replay.levelId);
              return (
                <div
                  key={replay.id}
                  onClick={() => handlePlayReplay(replay.id)}
                  className="bg-stone-800/60 hover:bg-stone-700/60 rounded-2xl p-5 border border-stone-700/50 hover:border-amber-500/40 cursor-pointer transition-all hover:scale-[1.01] group backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                      <span className="text-xl font-bold text-amber-400 font-serif">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-stone-100 font-serif truncate">
                          {replay.levelName}
                        </h3>
                        {level && (
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: `${getDifficultyColor(level.difficulty)}20`,
                              color: getDifficultyColor(level.difficulty),
                            }}
                          >
                            {getDifficultyLabel(level.difficulty)}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                            replay.success
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {replay.success ? '成功' : '失败'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-stone-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(replay.duration / 60)}:{Math.floor(replay.duration % 60).toString().padStart(2, '0')}
                        </span>
                        <span>得分: {replay.finalScore}</span>
                        <span>{formatDate(replay.timestamp)}</span>
                      </div>

                      {replay.stuckPoints.length > 0 && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            {replay.stuckPoints.length} 个卡点 · 点击查看详情
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(e, replay.id)}
                        className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Play className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-amber-200 text-sm">
            💡 <strong>提示：</strong>回放功能可以帮助你分析在哪一步卡住了，通过查看卡点优化你的操作流程。
          </p>
        </div>
      </div>
    </div>
  );
}
