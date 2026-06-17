import { create } from 'zustand';
import type { AnalyticsEvent, AnalyticsEventType } from '@/types';
import { loadAnalytics, saveAnalyticsEvent } from '@/utils/storage';
import { generateId } from '@/utils/math';
import { ANALYTICS_CONFIG } from '@/config/analytics';

interface AnalyticsState {
  events: AnalyticsEvent[];
  sessionId: string | null;
  enabled: boolean;
}

interface AnalyticsActions {
  initSession: (sessionId: string) => void;
  trackEvent: (eventType: AnalyticsEventType, eventData: Record<string, any>) => void;
  loadEvents: () => void;
  getEventsByType: (eventType: AnalyticsEventType) => AnalyticsEvent[];
  getSessionEvents: (sessionId: string) => AnalyticsEvent[];
  exportEvents: () => string;
  clearEvents: () => void;
  setEnabled: (enabled: boolean) => void;
}

const initialState: AnalyticsState = {
  events: [],
  sessionId: null,
  enabled: ANALYTICS_CONFIG.enabled,
};

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>((set, get) => ({
  ...initialState,

  initSession: (sessionId: string) => {
    set({ sessionId });
    get().trackEvent('game_start', { sessionId });
  },

  trackEvent: (eventType: AnalyticsEventType, eventData: Record<string, any>) => {
    const state = get();
    if (!state.enabled || !state.sessionId) return;
    if (!ANALYTICS_CONFIG.trackedEvents.includes(eventType)) return;
    
    const event: AnalyticsEvent = {
      id: generateId(),
      sessionId: state.sessionId,
      eventType,
      eventData,
      timestamp: Date.now(),
    };
    
    saveAnalyticsEvent(event);
    set(state => ({
      events: [...state.events, event],
    }));
  },

  loadEvents: () => {
    const events = loadAnalytics();
    set({ events });
  },

  getEventsByType: (eventType: AnalyticsEventType): AnalyticsEvent[] => {
    return get().events.filter(e => e.eventType === eventType);
  },

  getSessionEvents: (sessionId: string): AnalyticsEvent[] => {
    return get().events.filter(e => e.sessionId === sessionId);
  },

  exportEvents: (): string => {
    return JSON.stringify(get().events, null, 2);
  },

  clearEvents: () => {
    localStorage.removeItem('parking_game_analytics');
    set({ events: [] });
  },

  setEnabled: (enabled: boolean) => set({ enabled }),
}));
