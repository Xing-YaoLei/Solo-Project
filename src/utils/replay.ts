import type { FailureReplay, ReplayEvent, HesitationPoint, DecisionLog } from '@/types/game';
import { generateId } from './scoring';
import { storage } from './storage';

const HESITATION_THRESHOLD = 5000;
const MAX_REPLAYS = 3;

export function createReplay(
  recordId: string,
  events: ReplayEvent[],
  decisionLogs: DecisionLog[]
): FailureReplay {
  const hesitationPoints: HesitationPoint[] = [];

  let lastEventTime = 0;
  events.forEach((event) => {
    const duration = event.timestamp - lastEventTime;
    if (duration >= HESITATION_THRESHOLD) {
      const clueId = event.type === 'clue_view' ? (event.data.clueId as string) : undefined;
      hesitationPoints.push({
        timestamp: lastEventTime,
        duration,
        clueId,
        description: getHesitationDescription(event.type, duration),
      });
    }
    lastEventTime = event.timestamp;
  });

  decisionLogs.forEach((log) => {
    if (log.hesitationTime >= HESITATION_THRESHOLD) {
      hesitationPoints.push({
        timestamp: new Date(log.madeAt).getTime() - log.hesitationTime,
        duration: log.hesitationTime,
        description: `决策犹豫: ${log.hesitationTime / 1000}秒`,
      });
    }
  });

  hesitationPoints.sort((a, b) => a.timestamp - b.timestamp);

  return {
    id: generateId(),
    recordId,
    replayIndex: 0,
    timeline: events,
    hesitationPoints,
    createdAt: new Date().toISOString(),
  };
}

function getHesitationDescription(eventType: string, duration: number): string {
  const seconds = Math.floor(duration / 1000);
  const descriptions: Record<string, string> = {
    clue_view: `分析线索犹豫 ${seconds} 秒`,
    decision_start: `决策思考犹豫 ${seconds} 秒`,
    decision_made: `最终决定犹豫 ${seconds} 秒`,
    task_start: `任务开始犹豫 ${seconds} 秒`,
    task_end: `任务结束犹豫 ${seconds} 秒`,
  };
  return descriptions[eventType] || `犹豫 ${seconds} 秒`;
}

export function saveReplay(replay: FailureReplay): void {
  const replays = storage.loadReplays<FailureReplay[]>([]);
  const memberReplays = replays.filter((r) => r.recordId === replay.recordId);
  
  replay.replayIndex = memberReplays.length % MAX_REPLAYS;
  
  const otherReplays = replays.filter(
    (r) => !(r.recordId === replay.recordId && r.replayIndex === replay.replayIndex)
  );
  
  otherReplays.push(replay);
  storage.saveReplays(otherReplays);
}

export function getReplaysForRecord(recordId: string): FailureReplay[] {
  const replays = storage.loadReplays<FailureReplay[]>([]);
  return replays
    .filter((r) => r.recordId === recordId)
    .sort((a, b) => a.replayIndex - b.replayIndex);
}

export function getReplayTimeline(replay: FailureReplay, currentTime: number): ReplayEvent | null {
  const events = replay.timeline.filter((e) => e.timestamp <= currentTime);
  return events.length > 0 ? events[events.length - 1] : null;
}

export function getHesitationPointsInRange(
  replay: FailureReplay,
  startTime: number,
  endTime: number
): HesitationPoint[] {
  return replay.hesitationPoints.filter(
    (p) => p.timestamp >= startTime && p.timestamp <= endTime
  );
}

export function getTotalReplayDuration(replay: FailureReplay): number {
  if (replay.timeline.length === 0) return 0;
  return replay.timeline[replay.timeline.length - 1].timestamp - replay.timeline[0].timestamp;
}

export function formatReplayTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
