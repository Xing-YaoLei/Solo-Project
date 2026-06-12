import type { TrackingRule } from '@/types/config';

export const defaultTrackingRules: TrackingRule = {
  stuckThreshold: 8,
  trackDecisionTime: true,
  trackErrorTypes: true,
  trackOperationPath: true,
  trackItemUsage: true,
  trackEventHandling: true,
};
