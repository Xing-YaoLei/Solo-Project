import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { distance } from '@/utils/math';
import { formatTime } from '@/utils/math';

export const useEmergency = () => {
  const activeEmergency = useGameStore(state => state.activeEmergency);
  const emergencies = useGameStore(state => state.emergencies);
  const playerPosition = useGameStore(state => state.playerPosition);
  const gameTime = useGameStore(state => state.gameTime);
  const phase = useGameStore(state => state.phase);
  const resolveEmergency = useGameStore(state => state.resolveEmergency);
  
  const recordInteraction = useReplayStore(state => state.recordInteraction);
  const trackEvent = useAnalyticsStore(state => state.trackEvent);

  const hasActiveEmergency = useMemo(() => 
    activeEmergency !== null,
    [activeEmergency]
  );

  const timeRemaining = useMemo(() => {
    if (!activeEmergency) return 0;
    const elapsed = gameTime - activeEmergency.triggeredAt;
    return Math.max(0, activeEmergency.timeLimit - elapsed);
  }, [activeEmergency, gameTime]);

  const isTimeRunningOut = useMemo(() => 
    timeRemaining < 10 && timeRemaining > 0,
    [timeRemaining]
  );

  const distanceToEmergency = useMemo(() => {
    if (!activeEmergency) return Infinity;
    return distance(playerPosition, activeEmergency.position);
  }, [playerPosition, activeEmergency]);

  const isAtEmergencyLocation = useMemo(() => 
    distanceToEmergency < 3,
    [distanceToEmergency]
  );

  const resolvedEmergencies = useMemo(() => 
    emergencies.filter(e => e.isResolved),
    [emergencies]
  );

  const unresolvedEmergencies = useMemo(() => 
    emergencies.filter(e => !e.isResolved),
    [emergencies]
  );

  const resolveCurrentEmergency = useCallback(() => {
    if (!activeEmergency) return false;
    if (!isAtEmergencyLocation) return false;

    resolveEmergency(activeEmergency.id);
    recordInteraction();
    trackEvent('emergency', {
      action: 'resolved',
      emergencyId: activeEmergency.id,
      type: activeEmergency.type,
      timeTaken: gameTime - activeEmergency.triggeredAt,
      wasOnTime: timeRemaining > 0,
    });
    return true;
  }, [activeEmergency, isAtEmergencyLocation, resolveEmergency, recordInteraction, trackEvent, gameTime, timeRemaining]);

  const getEmergencyIcon = useCallback((type: string) => {
    const icons: Record<string, string> = {
      'device_failure': '🔧',
      'payment_issue': '💳',
      'vehicle_block': '🚗',
    };
    return icons[type] || '⚠️';
  }, []);

  const getEmergencyColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      'device_failure': '#f59e0b',
      'payment_issue': '#ef4444',
      'vehicle_block': '#8b5cf6',
    };
    return colors[type] || '#f59e0b';
  }, []);

  const getEmergencyStatus = useMemo(() => {
    if (!activeEmergency) return null;

    const timeRatio = timeRemaining / activeEmergency.timeLimit;
    let status = 'normal';
    if (timeRatio < 0.2) status = 'critical';
    else if (timeRatio < 0.5) status = 'warning';

    return {
      status,
      timeRemaining: formatTime(timeRemaining),
      percentage: timeRatio * 100,
      isAtLocation: isAtEmergencyLocation,
    };
  }, [activeEmergency, timeRemaining, isAtEmergencyLocation]);

  const getEmergencyHistory = useMemo(() => {
    return emergencies.map(e => ({
      ...e,
      resolutionTime: e.resolvedAt ? e.resolvedAt - e.triggeredAt : null,
      wasSuccessful: e.isResolved,
      formattedResolutionTime: e.resolvedAt 
        ? formatTime(e.resolvedAt - e.triggeredAt) 
        : null,
    }));
  }, [emergencies]);

  return {
    activeEmergency,
    emergencies,
    hasActiveEmergency,
    timeRemaining,
    isTimeRunningOut,
    distanceToEmergency,
    isAtEmergencyLocation,
    resolvedEmergencies,
    unresolvedEmergencies,
    phase,
    resolveCurrentEmergency,
    getEmergencyIcon,
    getEmergencyColor,
    getEmergencyStatus,
    getEmergencyHistory,
  };
};
