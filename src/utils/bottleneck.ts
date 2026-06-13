import type { Bottleneck, BottleneckType } from '@/types';

interface DetectBottleneckParams {
  actionType: BottleneckType;
  responseTime: number;
  isCorrect: boolean;
  threshold: number;
}

export function detectBottleneck(params: DetectBottleneckParams): Bottleneck | null {
  const { actionType, responseTime, isCorrect, threshold } = params;

  if (responseTime > threshold || !isCorrect) {
    return {
      id: crypto.randomUUID(),
      sessionId: '',
      type: actionType,
      timestamp: Date.now(),
      duration: responseTime,
      description: !isCorrect ? `操作错误: ${actionType}` : `响应超时: ${actionType}`,
    };
  }

  return null;
}

export function analyzeBottlenecks(
  bottlenecks: Bottleneck[]
): { type: string; count: number; avgDuration: number }[] {
  const map = new Map<string, { totalDuration: number; count: number }>();

  for (const b of bottlenecks) {
    const existing = map.get(b.type);
    if (existing) {
      existing.totalDuration += b.duration;
      existing.count += 1;
    } else {
      map.set(b.type, { totalDuration: b.duration, count: 1 });
    }
  }

  const result: { type: string; count: number; avgDuration: number }[] = [];
  map.forEach((value, key) => {
    result.push({
      type: key,
      count: value.count,
      avgDuration: value.totalDuration / value.count,
    });
  });

  return result;
}
