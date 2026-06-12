import type { FailureReplay, ReplayEvent, HesitationPoint, DecisionLog } from '@/types/game';
import { generateId } from './scoring';
import { storage } from './storage';

const HESITATION_THRESHOLD = 5000;
const MAX_REPLAYS_PER_MEMBER = 3;

export function createReplay(
  recordId: string,
  memberId: string,
  events: ReplayEvent[],
  decisionLogs: DecisionLog[]
): FailureReplay {
  const hesitationPoints: HesitationPoint[] = [];

  if (events.length > 0) {
    const taskStartEvent = events.find((e) => e.type === 'task_start');
    const clueViewEvents = events.filter((e) => e.type === 'clue_view');
    const decisionStartEvent = events.find((e) => e.type === 'decision_start');
    const decisionMadeEvent = events.find((e) => e.type === 'decision_made');

    if (taskStartEvent && clueViewEvents.length > 0) {
      const firstClueTime = clueViewEvents[0].timestamp;
      const duration = firstClueTime - taskStartEvent.timestamp;
      if (duration >= HESITATION_THRESHOLD) {
        hesitationPoints.push({
          timestamp: taskStartEvent.timestamp,
          duration,
          description: `阅读任务描述犹豫 ${Math.floor(duration / 1000)} 秒`,
        });
      }
    }

    for (let i = 0; i < clueViewEvents.length - 1; i++) {
      const duration = clueViewEvents[i + 1].timestamp - clueViewEvents[i].timestamp;
      if (duration >= HESITATION_THRESHOLD) {
        hesitationPoints.push({
          timestamp: clueViewEvents[i].timestamp,
          duration,
          clueId: clueViewEvents[i + 1].data.clueId as string,
          description: `分析线索犹豫 ${Math.floor(duration / 1000)} 秒`,
        });
      }
    }

    if (clueViewEvents.length > 0 && decisionStartEvent) {
      const lastClueTime = clueViewEvents[clueViewEvents.length - 1].timestamp;
      const duration = decisionStartEvent.timestamp - lastClueTime;
      if (duration >= HESITATION_THRESHOLD) {
        hesitationPoints.push({
          timestamp: lastClueTime,
          duration,
          description: `线索分析后思考犹豫 ${Math.floor(duration / 1000)} 秒`,
        });
      }
    }

    if (decisionStartEvent && decisionMadeEvent) {
      const duration = decisionMadeEvent.timestamp - decisionStartEvent.timestamp;
      if (duration >= HESITATION_THRESHOLD) {
        hesitationPoints.push({
          timestamp: decisionStartEvent.timestamp,
          duration,
          description: `做出最终决策犹豫 ${Math.floor(duration / 1000)} 秒`,
        });
      }
    }
  }

  hesitationPoints.sort((a, b) => a.timestamp - b.timestamp);

  return {
    id: generateId(),
    recordId,
    memberId,
    replayIndex: 0,
    timeline: events,
    hesitationPoints,
    createdAt: new Date().toISOString(),
  };
}

export function saveReplay(replay: FailureReplay): void {
  const replays = storage.loadReplays<FailureReplay[]>([]);
  const memberReplays = replays
    .filter((r) => r.memberId === replay.memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (memberReplays.length >= MAX_REPLAYS_PER_MEMBER) {
    const oldestReplay = memberReplays[memberReplays.length - 1];
    const filteredReplays = replays.filter((r) => r.id !== oldestReplay.id);
    replay.replayIndex = oldestReplay.replayIndex;
    filteredReplays.push(replay);
    storage.saveReplays(filteredReplays);
  } else {
    replay.replayIndex = memberReplays.length;
    replays.push(replay);
    storage.saveReplays(replays);
  }
}

export function getReplaysForRecord(recordId: string): FailureReplay[] {
  const replays = storage.loadReplays<FailureReplay[]>([]);
  return replays
    .filter((r) => r.recordId === recordId)
    .sort((a, b) => a.replayIndex - b.replayIndex);
}

export function getReplaysForMember(memberId: string, limit: number = MAX_REPLAYS_PER_MEMBER): FailureReplay[] {
  const replays = storage.loadReplays<FailureReplay[]>([]);
  return replays
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
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
