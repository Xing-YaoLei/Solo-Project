import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { distance } from '@/utils/math';

export const usePatrol = () => {
  const patrolPoints = useGameStore(state => state.patrolPoints);
  const currentPatrolIndex = useGameStore(state => state.currentPatrolIndex);
  const playerPosition = useGameStore(state => state.playerPosition);
  const phase = useGameStore(state => state.phase);
  const visitPatrolPoint = useGameStore(state => state.visitPatrolPoint);
  
  const recordInteraction = useReplayStore(state => state.recordInteraction);
  const trackEvent = useAnalyticsStore(state => state.trackEvent);

  const visitedPoints = useMemo(() => 
    patrolPoints.filter(p => p.isVisited),
    [patrolPoints]
  );

  const unvisitedPoints = useMemo(() => 
    patrolPoints.filter(p => !p.isVisited).sort((a, b) => a.order - b.order),
    [patrolPoints]
  );

  const currentTarget = useMemo(() => 
    unvisitedPoints[0] || null,
    [unvisitedPoints]
  );

  const nextTarget = useMemo(() => 
    unvisitedPoints[1] || null,
    [unvisitedPoints]
  );

  const progress = useMemo(() => {
    const total = patrolPoints.length;
    const visited = visitedPoints.length;
    return total > 0 ? (visited / total) * 100 : 0;
  }, [patrolPoints.length, visitedPoints.length]);

  const distanceToTarget = useMemo(() => {
    if (!currentTarget) return Infinity;
    return distance(playerPosition, currentTarget.position);
  }, [playerPosition, currentTarget]);

  const isNearTarget = useMemo(() => 
    distanceToTarget < 2,
    [distanceToTarget]
  );

  const checkAndVisitCurrentPoint = useCallback(() => {
    if (phase !== 'patrol' && phase !== 'emergency') return false;
    if (!currentTarget || !isNearTarget) return false;

    visitPatrolPoint(currentTarget.id);
    recordInteraction();
    trackEvent('task_complete', {
      task: 'visit_patrol_point',
      pointId: currentTarget.id,
      pointName: currentTarget.name,
      order: currentTarget.order,
    });
    return true;
  }, [phase, currentTarget, isNearTarget, visitPatrolPoint, recordInteraction, trackEvent]);

  const getPathToTarget = useCallback(() => {
    if (!currentTarget) return [];
    
    const path: [number, number, number][] = [];
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push([
        playerPosition[0] + (currentTarget.position[0] - playerPosition[0]) * t,
        playerPosition[1] + (currentTarget.position[1] - playerPosition[1]) * t,
        playerPosition[2] + (currentTarget.position[2] - playerPosition[2]) * t,
      ]);
    }
    
    return path;
  }, [playerPosition, currentTarget]);

  const getDirectionToTarget = useCallback(() => {
    if (!currentTarget) return [0, 0, 0] as [number, number, number];
    
    const dx = currentTarget.position[0] - playerPosition[0];
    const dz = currentTarget.position[2] - playerPosition[2];
    const length = Math.sqrt(dx * dx + dz * dz);
    
    if (length === 0) return [0, 0, 0];
    
    return [dx / length, 0, dz / length] as [number, number, number];
  }, [playerPosition, currentTarget]);

  const getPatrolOrder = useCallback(() => {
    return patrolPoints
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(p => ({
        ...p,
        isCurrent: p.id === currentTarget?.id,
        isNext: p.id === nextTarget?.id,
      }));
  }, [patrolPoints, currentTarget, nextTarget]);

  return {
    patrolPoints,
    visitedPoints,
    unvisitedPoints,
    currentTarget,
    nextTarget,
    progress,
    distanceToTarget,
    isNearTarget,
    phase,
    currentPatrolIndex,
    checkAndVisitCurrentPoint,
    getPathToTarget,
    getDirectionToTarget,
    getPatrolOrder,
  };
};
