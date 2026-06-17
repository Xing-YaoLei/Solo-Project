import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, MapPin, Clock, Target, AlertTriangle, CheckCircle, Home, RotateCcw, TrendingUp, Zap, Award } from 'lucide-react';
import { useReplayStore } from '@/store/replayStore';
import { useGameStore } from '@/store/gameStore';
import { formatTime, formatCurrency, formatGameTime } from '@/utils/math';
import { DIFFICULTY_CONFIGS, GAME_CONFIG } from '@/config/difficulty';
import type { ReplayData, LagPoint, ParkingSpot, ReplayFrame } from '@/types';
import { ParkingSpot as ParkingSpotComponent } from '@/components/three/ParkingSpot';
import { PlayerController } from '@/components/three/PlayerController';
import { loadSettings } from '@/utils/storage';

const lagReasonLabels: Record<string, { label: string; color: string }> = {
  thinking: { label: '思考中', color: 'text-yellow-400' },
  interaction: { label: '交互困难', color: 'text-orange-400' },
  waiting: { label: '等待超时', color: 'text-red-400' },
};

const ReplayScene = ({ replay }: { replay: ReplayData }) => {
  const getCurrentFrame = useReplayStore(state => state.getCurrentFrame);
  const getNextFrame = useReplayStore(state => state.getNextFrame);
  const isPlaying = useReplayStore(state => state.isPlaying);
  const setPlayerPosition = useGameStore(state => state.updatePlayerPosition);
  const setCameraRotation = useGameStore(state => state.updateCameraRotation);
  const [currentFrameData, setCurrentFrameData] = useState<ReplayFrame | null>(getCurrentFrame());

  useFrame(() => {
    if (isPlaying) {
      const nextFrame = getNextFrame();
      if (nextFrame) {
        setPlayerPosition(nextFrame.playerPosition);
        setCameraRotation(nextFrame.cameraRotation);
        useGameStore.setState({ spots: nextFrame.spots });
        setCurrentFrameData(nextFrame);
      }
    } else {
      const frame = getCurrentFrame();
      if (frame !== currentFrameData) {
        setCurrentFrameData(frame);
      }
    }
  });

  const spots = currentFrameData?.spots || [];
  const settings = loadSettings();

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <hemisphereLight args={['#ff8a00', '#3b82f6', 0.4]} />
      <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={2} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {settings.postProcessingEnabled && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      )}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      
      <Physics>
        <PlayerController speed={0} />
        {spots.map(spot => (
          <ParkingSpotComponent key={spot.id} spot={spot} onClick={() => {}} />
        ))}
      </Physics>
    </>
  );
};

const LagPointMarker = ({ lagPoint, onClick, isActive }: { 
  lagPoint: LagPoint; 
  onClick: () => void;
  isActive: boolean;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-all ${
        isActive 
          ? 'bg-blue-500/20 border-blue-500' 
          : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`text-sm font-medium ${lagReasonLabels[lagPoint.reason]?.color || 'text-slate-400'}`}>
          {lagReasonLabels[lagPoint.reason]?.label || '未知'}
        </div>
        <div className="text-xs text-slate-500">
          {formatTime(Math.floor(lagPoint.timestamp / 1000))}
        </div>
      </div>
      <div className="text-xs text-slate-400">{lagPoint.description}</div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <Clock size={12} />
        <span>持续 {lagPoint.duration.toFixed(1)} 秒</span>
      </div>
    </motion.div>
  );
};

export const Review = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as any;
  const [activeLagIndex, setActiveLagIndex] = useState<number>(-1);
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [isSuccessReview, setIsSuccessReview] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [reviewStats, setReviewStats] = useState<any>(null);

  const loadReplay = useReplayStore(state => state.loadReplay);
  const playReplay = useReplayStore(state => state.playReplay);
  const pauseReplay = useReplayStore(state => state.pauseReplay);
  const seekToFrame = useReplayStore(state => state.seekToFrame);
  const seekToLagPoint = useReplayStore(state => state.seekToLagPoint);
  const setPlaybackSpeed = useReplayStore(state => state.setPlaybackSpeed);
  const closeReplay = useReplayStore(state => state.closeReplay);
  const isPlaying = useReplayStore(state => state.isPlaying);
  const currentFrameIndex = useReplayStore(state => state.currentFrameIndex);
  const currentFrame = useReplayStore(state => state.getCurrentFrame());
  const playbackSpeed = useReplayStore(state => state.playbackSpeed);
  const currentReplay = useReplayStore(state => state.currentReplay);
  const lagPoints = useReplayStore(state => state.lagPoints);

  useEffect(() => {
    if (id === 'success' && locationState) {
      setIsSuccessReview(true);
      setSuccessResult(locationState.result);
      calculateSuccessStats(locationState.result, locationState.difficulty);
    } else if (id) {
      const loaded = loadReplay(id);
      if (loaded) {
        setReplay(useReplayStore.getState().currentReplay);
        setIsSuccessReview(false);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }

    return () => {
      closeReplay();
    };
  }, [id, locationState, loadReplay, closeReplay, navigate]);

  const calculateSuccessStats = (result: any, difficulty: string) => {
    const gameState = useGameStore.getState();
    const spots = gameState.spots;
    
    const totalOccupied = spots.filter(s => s.exitTime).length;
    const totalDuration = (Date.now() - gameState.realStartTime) / 1000;
    const spotTurnover = totalOccupied > 0 ? totalOccupied / (totalDuration / 60) : 0;
    const averageHandlingTime = totalDuration / (gameState.accessRecords.length + gameState.bills.length + gameState.patrolPoints.length);
    
    const lagHeatmap = lagPoints.reduce((acc: any[], lag) => {
      const existing = acc.find(h => 
        Math.abs(h.position[0] - lag.position[0]) < 2 && 
        Math.abs(h.position[2] - lag.position[2]) < 2
      );
      if (existing) {
        existing.count++;
      } else {
        acc.push({ position: lag.position, count: 1 });
      }
      return acc;
    }, []);

    setReviewStats({
      totalDuration,
      spotTurnover,
      averageHandlingTime,
      accuracyRate: result.accuracy,
      emergencyCount: gameState.emergencies.length,
      emergencyResolvedCount: gameState.emergencies.filter(e => e.isResolved).length,
      lagPoints,
      lagHeatmap,
      totalRevenue: gameState.bills.reduce((sum, b) => sum + b.totalFee, 0),
      totalVehicles: gameState.accessRecords.length,
      difficulty,
    });
  };

  const handleSeekToLagPoint = (index: number) => {
    setActiveLagIndex(index);
    seekToLagPoint(index);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseReplay();
    } else {
      playReplay();
    }
  };

  const handleSeekBackward = () => {
    seekToFrame(Math.max(0, currentFrameIndex - 30));
  };

  const handleSeekForward = () => {
    if (currentReplay) {
      seekToFrame(Math.min(currentReplay.frames.length - 1, currentFrameIndex + 30));
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const totalFrames = currentReplay?.frames.length || 0;
  const progress = totalFrames > 0 ? (currentFrameIndex / totalFrames) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white font-orbitron">
                {isSuccessReview ? '复盘报告' : '失败回放'}
              </h1>
              <p className="text-sm text-slate-400">
                {isSuccessReview 
                  ? '查看本次任务的详细数据和分析' 
                  : `回放失败记录 · ${replay ? DIFFICULTY_CONFIGS[replay.difficulty]?.name : ''}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              <Home size={18} />
              返回菜单
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/game?difficulty=${replay?.difficulty || 'normal'}`)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <RotateCcw size={18} />
              再来一局
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {isSuccessReview && successResult && reviewStats ? (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">任务完成概览</h2>
                  <p className="text-slate-400 text-sm">
                    {DIFFICULTY_CONFIGS[reviewStats.difficulty]?.name || '普通模式'}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-4xl font-bold font-orbitron bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {successResult.score}
                  </div>
                  <div className="text-sm text-slate-400">最终得分</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="text-green-400" size={18} />
                    <span className="text-slate-400 text-sm">准确率</span>
                  </div>
                  <div className={`text-2xl font-bold ${successResult.accuracy >= 80 ? 'text-green-400' : successResult.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {successResult.accuracy}%
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="text-blue-400" size={18} />
                    <span className="text-slate-400 text-sm">效率</span>
                  </div>
                  <div className={`text-2xl font-bold ${successResult.efficiency >= 80 ? 'text-green-400' : successResult.efficiency >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {successResult.efficiency}%
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-orange-400" size={18} />
                    <span className="text-slate-400 text-sm">应急处理</span>
                  </div>
                  <div className={`text-2xl font-bold ${successResult.emergencyHandling >= 80 ? 'text-green-400' : successResult.emergencyHandling >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {successResult.emergencyHandling}%
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-cyan-400" size={18} />
                    <span className="text-slate-400 text-sm">总用时</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatTime(Math.floor(reviewStats.totalDuration))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-blue-400" size={20} />
                  运营数据
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">车位周转率</span>
                    <span className="text-white font-medium">
                      {reviewStats.spotTurnover.toFixed(2)} 辆/小时
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">处理车辆总数</span>
                    <span className="text-white font-medium">{reviewStats.totalVehicles} 辆</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">总营收</span>
                    <span className="text-yellow-400 font-medium">
                      {formatCurrency(reviewStats.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">平均处理时间</span>
                    <span className="text-white font-medium">
                      {reviewStats.averageHandlingTime.toFixed(1)} 秒/单
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">突发事件</span>
                    <span className="text-white font-medium">
                      {reviewStats.emergencyResolvedCount}/{reviewStats.emergencyCount} 已处理
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="text-yellow-400" size={20} />
                  表现评价
                </h3>
                <div className="space-y-4">
                  {successResult.accuracy >= 90 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="text-green-400 font-medium">准确率优秀</div>
                      <div className="text-green-400/70 text-sm">继续保持高精度的操作水平</div>
                    </div>
                  )}
                  {successResult.efficiency >= 90 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="text-blue-400 font-medium">效率卓越</div>
                      <div className="text-blue-400/70 text-sm">操作流程非常流畅，时间管理出色</div>
                    </div>
                  )}
                  {successResult.emergencyHandling >= 90 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <div className="text-orange-400 font-medium">应急能力强</div>
                      <div className="text-orange-400/70 text-sm">突发事件处理及时有效</div>
                    </div>
                  )}
                  {reviewStats.lagPoints.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div className="text-yellow-400 font-medium">有提升空间</div>
                      <div className="text-yellow-400/70 text-sm">
                        发现 {reviewStats.lagPoints.length} 处卡顿，建议加强练习
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {reviewStats.lagPoints.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="text-red-400" size={20} />
                  卡顿点分析
                  <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {reviewStats.lagPoints.length} 处
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {reviewStats.lagPoints.map((lag: LagPoint, index: number) => (
                    <LagPointMarker
                      key={index}
                      lagPoint={lag}
                      isActive={activeLagIndex === index}
                      onClick={() => setActiveLagIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : replay ? (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700">
              <div className="relative h-[500px] bg-slate-900">
                <Canvas
                  shadows
                  camera={{ position: [0, 2, 5], fov: 75, near: 0.1, far: 1000 }}
                  gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ReplayScene replay={replay} />
                </Canvas>

                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700">
                  <div className="text-red-400 text-sm font-medium">
                    <AlertTriangle size={14} className="inline mr-1" />
                    回放模式
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    失败原因: {replay.failureReason}
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700">
                  <div className="text-2xl font-bold text-white font-orbitron">
                    {formatTime(Math.floor((currentFrame?.timestamp || 0) / 1000))}
                  </div>
                  <div className="text-xs text-slate-400">
                    游戏时间: {formatGameTime(currentFrame?.timestamp || 0)}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 border-t border-slate-700">
                <div className="mb-4">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = x / rect.width;
                      seekToFrame(Math.floor(percentage * totalFrames));
                    }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{formatTime(Math.floor((currentFrame?.timestamp || 0) / 1000))}</span>
                    <span>{formatTime(Math.floor((replay.frames[replay.frames.length - 1]?.timestamp || 0) / 1000))}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSeekBackward}
                    className="p-3 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                  >
                    <SkipBack size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePlayPause}
                    className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSeekForward}
                    className="p-3 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                  >
                    <SkipForward size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSpeedChange}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    {playbackSpeed}x
                  </motion.button>
                </div>
              </div>
            </div>

            {lagPoints.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="text-red-400" size={20} />
                  卡顿点定位
                  <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {lagPoints.length} 处
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {lagPoints.map((lag, index) => (
                    <LagPointMarker
                      key={index}
                      lagPoint={lag}
                      isActive={activeLagIndex === index}
                      onClick={() => handleSeekToLagPoint(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">游戏信息</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-slate-400 text-sm mb-1">难度模式</div>
                  <div className="text-white font-medium">
                    {DIFFICULTY_CONFIGS[replay.difficulty]?.name || '普通模式'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">最终得分</div>
                  <div className="text-yellow-400 font-bold">{replay.finalScore}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">总时长</div>
                  <div className="text-white font-medium">
                    {formatTime(Math.floor((replay.endTime - replay.startTime) / 1000))}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">录制帧数</div>
                  <div className="text-white font-medium">{replay.frames.length} 帧</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">加载中...</div>
          </div>
        )}
      </div>
    </div>
  );
};
