import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Target, Zap, Star, CheckCircle } from 'lucide-react';
import { getLevelsByMode, getDifficultyLabel, getDifficultyColor, getSubjectInfo } from '@/data/levels';
import { useGameStore } from '@/store/gameStore';
import type { GameMode } from '@/types/game';

export default function LevelSelect() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { setCurrentLevel, getLevelRecord } = useGameStore();

  const gameMode = (mode as GameMode) || 'formal';
  const levels = getLevelsByMode(gameMode);

  const modeTitle = gameMode === 'formal' ? '正式训练' : '自由练习';
  const modeColor = gameMode === 'formal' ? 'indigo' : 'green';
  const modeBg = gameMode === 'formal' ? 'from-indigo-50 to-blue-50' : 'from-green-50 to-emerald-50';

  const handleSelectLevel = (level: any) => {
    setCurrentLevel(level);
    navigate(`/game/${level.id}`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${modeBg}`}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </button>

        <div className="mb-10">
          <h1 className={`text-3xl font-bold text-${modeColor}-900 mb-2`}>{modeTitle}关卡</h1>
          <p className="text-gray-600">
            {gameMode === 'formal'
              ? '选择关卡开始正式训练，达标即视为通过'
              : '选择关卡自由练习，无门槛挑战自我'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {levels.map((level, index) => {
            const record = getLevelRecord(level.id);
            const subjectPreviews = level.subjects.slice(0, 4);
            const passed = record && record.bestAccuracy >= level.minAccuracy && record.bestCombo >= level.minCombo;

            return (
              <div
                key={level.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${modeColor}-100 rounded-xl flex items-center justify-center font-bold text-${modeColor}-600`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">
                        {level.name}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(level.difficulty)}`}>
                        {getDifficultyLabel(level.difficulty)}
                      </span>
                    </div>
                  </div>
                  {passed && (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">已达标</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{level.description}</p>

                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{level.duration}秒</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span>{level.textbookCount}本</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-red-500" />
                    <span>准确率≥{Math.round(level.minAccuracy * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>连击≥{level.minCombo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  {subjectPreviews.map((s) => {
                    const info = getSubjectInfo(s);
                    return (
                      <div
                        key={s}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${info.color}20`, color: info.color }}
                        title={info.name}
                      >
                        {info.icon}
                      </div>
                    );
                  })}
                  {level.subjects.length > 4 && (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                      +{level.subjects.length - 4}
                    </div>
                  )}
                </div>

                {record && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-gray-500 mb-0.5">最高分</div>
                      <div className="font-bold text-gray-800">{record.bestScore}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">最佳准确率</div>
                      <div className="font-bold text-green-600">{Math.round(record.bestAccuracy * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">练习次数</div>
                      <div className="font-bold text-indigo-600">{record.attempts}</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleSelectLevel(level)}
                  className={`w-full py-3 rounded-xl bg-${modeColor}-600 hover:bg-${modeColor}-700 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-98`}
                >
                  <Play className="w-5 h-5" />
                  <span>{record ? '再次挑战' : '开始挑战'}</span>
                  {record && <Star className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
