import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { distance } from '@/utils/math';

export const useAccessControl = () => {
  const accessRecords = useGameStore(state => state.accessRecords);
  const spots = useGameStore(state => state.spots);
  const phase = useGameStore(state => state.phase);
  const assignRecordToSpot = useGameStore(state => state.assignRecordToSpot);
  const processAccessRecord = useGameStore(state => state.processAccessRecord);
  
  const recordInteraction = useReplayStore(state => state.recordInteraction);
  const trackEvent = useAnalyticsStore(state => state.trackEvent);

  const unprocessedRecords = useMemo(() => 
    accessRecords.filter(r => !r.isProcessed),
    [accessRecords]
  );

  const unassignedRecords = useMemo(() => 
    accessRecords.filter(r => !r.assignedSpotId),
    [accessRecords]
  );

  const emptySpots = useMemo(() => 
    spots.filter(s => s.status === 'empty'),
    [spots]
  );

  const assignRecordToNearestSpot = useCallback((recordId: string, dropPosition: [number, number, number]) => {
    if (phase !== 'access_control') return false;

    const record = accessRecords.find(r => r.id === recordId);
    if (!record || record.assignedSpotId) return false;

    let nearestSpot = null;
    let minDistance = Infinity;

    for (const spot of emptySpots) {
      const dist = distance(dropPosition, spot.position);
      if (dist < minDistance && dist < 3) {
        minDistance = dist;
        nearestSpot = spot;
      }
    }

    if (nearestSpot) {
      assignRecordToSpot(recordId, nearestSpot.id);
      processAccessRecord(recordId);
      recordInteraction();
      trackEvent('task_complete', {
        task: 'assign_spot',
        recordId,
        spotId: nearestSpot.id,
      });
      return true;
    }

    return false;
  }, [phase, accessRecords, emptySpots, assignRecordToSpot, processAccessRecord, recordInteraction, trackEvent]);

  const getRecordByPlate = useCallback((plate: string) => {
    return accessRecords.find(r => r.vehiclePlate === plate);
  }, [accessRecords]);

  const getSpotByNumber = useCallback((number: number) => {
    return spots.find(s => s.number === number);
  }, [spots]);

  return {
    accessRecords,
    unprocessedRecords,
    unassignedRecords,
    spots,
    emptySpots,
    phase,
    assignRecordToNearestSpot,
    getRecordByPlate,
    getSpotByNumber,
  };
};
