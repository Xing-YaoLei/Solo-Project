import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { DIFFICULTY_CONFIGS } from '@/config/difficulty';

export const useGameLoop = () => {
  const lastTimeRef = useRef<number>(0);
  const emergencyTimerRef = useRef<number>(0);
  const lagCheckTimerRef = useRef<number>(0);
  
  const updateGameTime = useGameStore(state => state.updateGameTime);
  const gameState = useGameStore(state => ({
    phase: state.phase,
    isPaused: state.isPaused,
    isFailed: state.isFailed,
    difficulty: state.difficulty,
    activeEmergency: state.activeEmergency,
    score: state.score,
  }));
  
  const recordFrame = useReplayStore(state => state.recordFrame);
  const detectLagPoint = useReplayStore(state => state.detectLagPoint);
  const recordInteraction = useReplayStore(state => state.recordInteraction);
  const isRecording = useReplayStore(state => state.currentReplay === null);
  
  const triggerEmergency = useGameStore(state => state.triggerEmergency);
  const failGame = useGameStore(state => state.failGame);

  useEffect(() => {
    const handleKeyDown = () => {
      recordInteraction();
    };
    const handleClick = () => {
      recordInteraction();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [recordInteraction]);

  useFrame((_, delta) => {
    if (gameState.isPaused || gameState.isFailed || gameState.phase === 'ended') {
      return;
    }

    updateGameTime(delta);

    if (isRecording && !gameState.isPaused) {
      const fullState = useGameStore.getState();
      recordFrame(fullState);
    }

    lagCheckTimerRef.current += delta;
    if (lagCheckTimerRef.current >= 0.5) {
      lagCheckTimerRef.current = 0;
      detectLagPoint();
    }

    const config = DIFFICULTY_CONFIGS[gameState.difficulty];
    
    if (gameState.phase === 'patrol' && !gameState.activeEmergency) {
      emergencyTimerRef.current += delta;
      const emergencyInterval = 30 / config.emergencyFrequency;
      
      if (emergencyTimerRef.current >= emergencyInterval && Math.random() < 0.3) {
        emergencyTimerRef.current = 0;
        triggerEmergency();
      }
    }

    if (gameState.activeEmergency) {
      const fullState = useGameStore.getState();
      const timeElapsed = fullState.gameTime - gameState.activeEmergency.triggeredAt;
      if (timeElapsed > gameState.activeEmergency.timeLimit * 2) {
        failGame('应急处理超时');
        useAnalyticsStore.getState().trackEvent('task_fail', {
          reason: 'emergency_timeout',
          emergencyType: gameState.activeEmergency.type,
        });
      }
    }
  });
};
