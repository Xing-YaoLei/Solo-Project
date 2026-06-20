import { useEffect, useState, useCallback } from 'react';
import { useProgress } from '@react-three/drei';

interface ResourceItem {
  id: string;
  name: string;
  loaded: boolean;
}

export function useSceneLoader(enabled = true) {
  const [resources, setResources] = useState<ResourceItem[]>([
    { id: 'venue', name: '场馆结构', loaded: false },
    { id: 'seats', name: '座位几何体', loaded: false },
    { id: 'materials', name: '材质与纹理', loaded: false },
    { id: 'lights', name: '光照系统', loaded: false },
    { id: 'physics', name: '碰撞体', loaded: false },
  ]);
  const [manualProgress, setManualProgress] = useState(0);
  const { progress: r3fProgress, active, errors } = useProgress();

  const computeOverallProgress = useCallback(() => {
    const loadedCount = resources.filter((r) => r.loaded).length;
    const resProgress = (loadedCount / resources.length) * 60;
    const r3f = (r3fProgress / 100) * 40;
    return Math.min(100, Math.round(resProgress + r3f + manualProgress));
  }, [resources, r3fProgress, manualProgress]);

  const markLoaded = useCallback((id: string) => {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, loaded: true } : r)));
    setManualProgress((p) => Math.min(p + 12, 100));
  }, []);

  const reset = useCallback(() => {
    setResources((prev) => prev.map((r) => ({ ...r, loaded: false })));
    setManualProgress(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timers = [
      setTimeout(() => markLoaded('venue'), 200),
      setTimeout(() => markLoaded('seats'), 600),
      setTimeout(() => markLoaded('materials'), 1000),
      setTimeout(() => markLoaded('lights'), 1400),
      setTimeout(() => markLoaded('physics'), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [enabled, markLoaded]);

  return {
    progress: computeOverallProgress(),
    resources,
    isLoading: computeOverallProgress() < 100,
    r3fActive: active,
    r3fErrors: errors,
    markLoaded,
    reset,
  };
}
