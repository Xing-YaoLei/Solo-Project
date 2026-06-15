import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, GraduationCap } from 'lucide-react';

const loadingTips = [
  '正在加载教室模型...',
  '正在生成学生数据...',
  '正在准备成绩单...',
  '正在整理申请材料...',
  '马上就好...',
];

export default function LoadingScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const levelId = searchParams.get('level') || 'level-1';

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 8 + 2;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, 200);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % loadingTips.length);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate(`/game/${levelId}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, navigate, levelId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-8">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-2xl shadow-amber-500/30 mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-100 font-serif mb-2">
            正在加载
          </h1>
          <p className="text-stone-400">准备进入教室...</p>
        </div>

        <div className="bg-stone-800/50 rounded-2xl p-6 border border-stone-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-stone-400 text-sm">素材加载进度</span>
            <span className="text-amber-400 font-mono font-bold">{Math.round(progress)}%</span>
          </div>

          <div className="w-full h-3 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-200 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-stone-400">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-sm transition-opacity duration-300">
              {loadingTips[tipIndex]}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-stone-800/30 rounded-xl p-3 border border-stone-700/30">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 transition-colors duration-300 ${progress > 25 ? 'bg-emerald-400' : 'bg-stone-600'}`} />
            <p className="text-xs text-stone-500">3D 模型</p>
          </div>
          <div className="bg-stone-800/30 rounded-xl p-3 border border-stone-700/30">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 transition-colors duration-300 ${progress > 50 ? 'bg-emerald-400' : 'bg-stone-600'}`} />
            <p className="text-xs text-stone-500">学生数据</p>
          </div>
          <div className="bg-stone-800/30 rounded-xl p-3 border border-stone-700/30">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 transition-colors duration-300 ${progress > 75 ? 'bg-emerald-400' : 'bg-stone-600'}`} />
            <p className="text-xs text-stone-500">关卡设置</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
}
