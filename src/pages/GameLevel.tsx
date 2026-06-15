import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useParams, useNavigate } from 'react-router-dom';
import { Pause, Play, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import ClassroomScene from '../components/game/ClassroomScene';
import HUD from '../components/ui/HUD';
import StudentPanel from '../components/ui/StudentPanel';
import TranscriptPanel from '../components/ui/TranscriptPanel';
import MaterialPanel from '../components/ui/MaterialPanel';
import MissingMaterialModal from '../components/ui/MissingMaterialModal';
import { useGameStore } from '../stores/useGameStore';
import { useReplayStore } from '../stores/useReplayStore';
import { getLevelById } from '../data/levels';
import { useSettingsStore } from '../stores/useSettingsStore';

function GameTimer() {
  const { tick, isPaused, isGameOver, timeRemaining, currentLevelId, addUtilizationPoint, reviewedStudents, currentPhase } = useGameStore();
  const level = currentLevelId ? getLevelById(currentLevelId) : null;

  useFrame((_, delta) => {
    if (!isPaused && !isGameOver && level) {
      tick(delta);
      
      if (Math.random() < 0.02) {
        const totalStudents = level.students.length;
        const reviewRatio = totalStudents > 0 ? reviewedStudents.length / totalStudents : 0;
        const baseUtil = 40 + reviewRatio * 40;
        const phaseBonus = { observe: 10, transcript: 20, application: 30, complete: 40 }[currentPhase];
        addUtilizationPoint(Math.min(100, baseUtil + phaseBonus + Math.random() * 10));
      }
    }
  });

  return null;
}

export default function GameLevel() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const {
    startLevel,
    pauseGame,
    resumeGame,
    isPaused,
    isGameOver,
    score,
    selectStudent,
    currentPhase,
    completeLevel,
    timeRemaining,
    classroomUtilization,
    operationHistory,
    currentLevelId,
  } = useGameStore();
  const { saveReplay } = useReplayStore();
  const { isTouchMode } = useSettingsStore();
  const [showStudentPanel, setShowStudentPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (levelId && !hasStartedRef.current) {
      startLevel(levelId);
      hasStartedRef.current = true;
    }
  }, [levelId, startLevel]);

  useEffect(() => {
    if (isGameOver && !showResult) {
      const level = currentLevelId ? getLevelById(currentLevelId) : null;
      const success = score >= (level?.passingScore || 0);
      setGameResult(success ? 'win' : 'lose');
      setShowResult(true);

      const replay = completeLevel(success);
      saveReplay(replay);
    }
  }, [isGameOver, score, showResult, completeLevel, saveReplay, currentLevelId]);

  useEffect(() => {
    if (currentPhase === 'observe') {
      setShowStudentPanel(true);
      setShowRightPanel(false);
    } else if (currentPhase === 'transcript') {
      setShowStudentPanel(true);
      setShowRightPanel(true);
    } else if (currentPhase === 'application') {
      setShowStudentPanel(true);
      setShowRightPanel(true);
    }
  }, [currentPhase]);

  const handleStudentClick = (studentId: string) => {
    selectStudent(studentId);
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  const handleReview = () => {
    navigate(`/review/${levelId}`);
  };

  const level = currentLevelId ? getLevelById(currentLevelId) : null;

  return (
    <div className="w-full h-screen bg-stone-950 relative overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 60 }}
        className="w-full h-full"
      >
        <color attach="background" args={['#1C1917']} />
        <ClassroomScene onStudentClick={handleStudentClick} />
        <GameTimer />
      </Canvas>

      <HUD />
      <StudentPanel isOpen={showStudentPanel} onClose={() => setShowStudentPanel(false)} />
      
      {currentPhase === 'transcript' && (
        <TranscriptPanel isOpen={showRightPanel} onClose={() => setShowRightPanel(false)} />
      )}
      {currentPhase === 'application' && (
        <MaterialPanel isOpen={showRightPanel} onClose={() => setShowRightPanel(false)} />
      )}

      <MissingMaterialModal />

      <button
        onClick={() => (isPaused ? resumeGame() : pauseGame())}
        className="absolute top-4 right-4 z-30 p-3 bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 rounded-xl backdrop-blur-md border border-stone-600/50 transition-all hover:scale-105"
      >
        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>

      {isTouchMode && (
        <>
          <button
            onClick={() => setShowStudentPanel(!showStudentPanel)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 rounded-xl backdrop-blur-md border border-stone-600/50 transition-all"
          >
            <ChevronLeft className={`w-6 h-6 transition-transform ${showStudentPanel ? '' : 'rotate-180'}`} />
          </button>
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 rounded-xl backdrop-blur-md border border-stone-600/50 transition-all"
          >
            <ChevronRight className={`w-6 h-6 transition-transform ${showRightPanel ? '' : '-rotate-180'}`} />
          </button>
        </>
      )}

      {isPaused && !isGameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-stone-900 rounded-2xl p-8 border border-stone-700 shadow-2xl text-center">
            <h2 className="text-3xl font-bold text-stone-100 font-serif mb-6">游戏暂停</h2>
            <div className="space-y-3">
              <button
                onClick={resumeGame}
                className="w-full py-3 px-8 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-all hover:scale-105"
              >
                继续游戏
              </button>
              <button
                onClick={handleBackToMenu}
                className="w-full py-3 px-8 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-xl font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-stone-900 rounded-2xl p-8 border border-stone-700 shadow-2xl text-center max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className={`text-6xl mb-4 ${gameResult === 'win' ? 'animate-bounce' : ''}`}>
              {gameResult === 'win' ? '🎉' : '😢'}
            </div>
            <h2 className={`text-3xl font-bold font-serif mb-2 ${gameResult === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
              {gameResult === 'win' ? '关卡通过！' : '挑战失败'}
            </h2>
            <p className="text-stone-400 mb-6">
              {gameResult === 'win' ? '出色的工作，教务助理！' : '时间到了，再接再厉！'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-stone-800/50 rounded-xl p-4">
                <p className="text-stone-500 text-sm">最终得分</p>
                <p className="text-2xl font-bold text-amber-400 font-serif">{score}</p>
              </div>
              <div className="bg-stone-800/50 rounded-xl p-4">
                <p className="text-stone-500 text-sm">用时</p>
                <p className="text-2xl font-bold text-sky-400 font-mono">
                  {level ? Math.floor(level.timeLimit - timeRemaining) : 0}秒
                </p>
              </div>
              <div className="bg-stone-800/50 rounded-xl p-4">
                <p className="text-stone-500 text-sm">操作次数</p>
                <p className="text-2xl font-bold text-violet-400">{operationHistory.length}</p>
              </div>
              <div className="bg-stone-800/50 rounded-xl p-4">
                <p className="text-stone-500 text-sm">数据点</p>
                <p className="text-2xl font-bold text-emerald-400">{classroomUtilization.length}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReview}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg shadow-sky-500/20"
              >
                查看复盘
              </button>
              <button
                onClick={handleBackToMenu}
                className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-xl font-medium transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
