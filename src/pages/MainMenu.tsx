import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Settings, BookOpen, Trophy, ChevronRight, GraduationCap, Star, Clock } from 'lucide-react';
import { levels } from '../data/levels';
import { getDifficultyLabel, getDifficultyColor } from '../utils/helpers';

export default function MainMenu() {
  const navigate = useNavigate();
  const [showLevels, setShowLevels] = useState(false);

  const handleStartGame = () => {
    setShowLevels(true);
  };

  const handleSelectLevel = (levelId: string) => {
    navigate(`/loading?level=${levelId}`);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleReplay = () => {
    navigate('/replay');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 50px,
            rgba(255,255,255,0.02) 50px,
            rgba(255,255,255,0.02) 51px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 50px,
            rgba(255,255,255,0.02) 50px,
            rgba(255,255,255,0.02) 51px
          )
        `
      }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {!showLevels ? (
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-2xl shadow-amber-500/30 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-stone-100 font-serif mb-3 tracking-tight">
                教务<span className="text-amber-400">成绩</span>复核
              </h1>
              <p className="text-xl text-stone-400 font-medium">
                高校教务调度解谜游戏
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-12 text-stone-500 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>观察 · 处理 · 审核 · 评分</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={handleStartGame}
                className="w-full py-4 px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-lg font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 group"
              >
                <Play className="w-6 h-6 fill-current" />
                开始游戏
                <ChevronRight className="w-5 h-5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </button>

              <button
                onClick={handleReplay}
                className="w-full py-4 px-8 bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 text-lg font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 border border-stone-700/50 backdrop-blur-sm flex items-center justify-center gap-3"
              >
                <Trophy className="w-6 h-6 text-amber-400" />
                失败回放
              </button>

              <button
                onClick={handleSettings}
                className="w-full py-4 px-8 bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 text-lg font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 border border-stone-700/50 backdrop-blur-sm flex items-center justify-center gap-3"
              >
                <Settings className="w-6 h-6 text-sky-400" />
                游戏设置
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6 text-stone-500 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>3 个关卡</span>
              </div>
              <div className="w-1 h-1 bg-stone-600 rounded-full" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>约 5-10 分钟</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setShowLevels(false)}
              className="text-stone-400 hover:text-stone-200 mb-6 flex items-center gap-2 transition-colors"
            >
              ← 返回主菜单
            </button>

            <h2 className="text-3xl font-bold text-stone-100 font-serif mb-2">选择关卡</h2>
            <p className="text-stone-400 mb-8">从简单到困难，逐步提升你的教务调度能力</p>

            <div className="space-y-4">
              {levels.map((level, index) => (
                <div
                  key={level.id}
                  onClick={() => handleSelectLevel(level.id)}
                  className="p-6 bg-stone-800/60 hover:bg-stone-700/60 rounded-2xl border border-stone-700/50 hover:border-amber-500/50 cursor-pointer transition-all hover:scale-[1.02] group backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center border border-amber-500/30">
                      <span className="text-2xl font-bold text-amber-400 font-serif">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-stone-100 font-serif">{level.name}</h3>
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${getDifficultyColor(level.difficulty)}20`,
                            color: getDifficultyColor(level.difficulty),
                          }}
                        >
                          {getDifficultyLabel(level.difficulty)}
                        </span>
                      </div>
                      <p className="text-stone-400 text-sm mb-2">{level.description}</p>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(level.timeLimit / 60)} 分钟
                        </span>
                        <span>{level.students.length} 名学生</span>
                        <span>及格分 {level.passingScore}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-stone-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-stone-600 text-xs">
        高校教务成绩复核调度解谜游戏 v1.0
      </div>
    </div>
  );
}
