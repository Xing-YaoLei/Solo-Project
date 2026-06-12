import { useState, useCallback, useEffect, useRef } from 'react';
import type { FailureReplay, ReplayEvent, HesitationPoint } from '@/types/game';
import { getReplaysForRecord, getTotalReplayDuration, formatReplayTime } from '@/utils/replay';

interface UseReplayOptions {
  recordId: string;
  autoPlay?: boolean;
  speed?: number;
}

export function useReplay(options: UseReplayOptions) {
  const { recordId, autoPlay = false, speed: initialSpeed = 1 } = options;
  
  const [replays, setReplays] = useState<FailureReplay[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(initialSpeed);
  const [currentEvent, setCurrentEvent] = useState<ReplayEvent | null>(null);
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const currentReplay = replays[currentReplayIndex];
  const totalDuration = currentReplay ? getTotalReplayDuration(currentReplay) : 0;

  useEffect(() => {
    const loadedReplays = getReplaysForRecord(recordId);
    setReplays(loadedReplays);
  }, [recordId]);

  const findEventAtTime = useCallback((replay: FailureReplay, time: number): ReplayEvent | null => {
    if (!replay.timeline.length) return null;
    
    const startTime = replay.timeline[0].timestamp;
    const targetTime = startTime + time;
    
    const events = replay.timeline.filter((e) => e.timestamp <= targetTime);
    return events.length > 0 ? events[events.length - 1] : null;
  }, []);

  const getHesitationPointsInRange = useCallback((start: number, end: number): HesitationPoint[] => {
    if (!currentReplay) return [];
    
    const startTime = currentReplay.timeline[0]?.timestamp || 0;
    return currentReplay.hesitationPoints.filter(
      (p) => p.timestamp >= startTime + start && p.timestamp <= startTime + end
    );
  }, [currentReplay]);

  const animate = useCallback(() => {
    if (!isPlaying || !currentReplay) return;

    const now = performance.now();
    const elapsed = (now - startTimeRef.current) * speed + pausedTimeRef.current;
    
    if (elapsed >= totalDuration) {
      setCurrentTime(totalDuration);
      setIsPlaying(false);
      const finalEvent = findEventAtTime(currentReplay, totalDuration);
      setCurrentEvent(finalEvent);
      return;
    }

    setCurrentTime(elapsed);
    const event = findEventAtTime(currentReplay, elapsed);
    setCurrentEvent(event);

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, currentReplay, speed, totalDuration, findEventAtTime]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      pausedTimeRef.current = currentTime;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate, currentTime]);

  useEffect(() => {
    if (autoPlay && replays.length > 0) {
      play();
    }
  }, [autoPlay, replays]);

  const play = useCallback(() => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      pausedTimeRef.current = 0;
    }
    setIsPlaying(true);
  }, [currentTime, totalDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    setCurrentTime(clampedTime);
    pausedTimeRef.current = clampedTime;
    
    if (currentReplay) {
      const event = findEventAtTime(currentReplay, clampedTime);
      setCurrentEvent(event);
    }
  }, [totalDuration, currentReplay, findEventAtTime]);

  const selectReplay = useCallback((index: number) => {
    if (index >= 0 && index < replays.length) {
      setCurrentReplayIndex(index);
      setCurrentTime(0);
      pausedTimeRef.current = 0;
      setCurrentEvent(null);
      setIsPlaying(false);
    }
  }, [replays]);

  const formatTime = useCallback((time: number) => {
    return formatReplayTime(time);
  }, []);

  return {
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
    hasReplays: replays.length > 0,
  };
}
