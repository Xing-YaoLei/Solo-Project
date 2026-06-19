export interface AnalyticsEvent {
    eventName: string;
    timestamp: number;
    data: Record<string, any>;
    sessionId: string;
    levelId: string;
}

export interface SessionData {
    sessionId: string;
    startTime: number;
    endTime: number;
    levelId: string;
    events: AnalyticsEvent[];
}

export class AnalyticsTracker {
    private static _instance: AnalyticsTracker | null = null;
    private _currentSession: SessionData | null = null;
    private _allSessions: SessionData[] = [];

    static getInstance(): AnalyticsTracker {
        if (!AnalyticsTracker._instance) {
            AnalyticsTracker._instance = new AnalyticsTracker();
        }
        return AnalyticsTracker._instance;
    }

    private constructor() {}

    startSession(sessionId: string, levelId: string): void {
        this._currentSession = {
            sessionId,
            startTime: Date.now(),
            endTime: 0,
            levelId,
            events: [],
        };
    }

    trackEvent(eventName: string, data: Record<string, any> = {}): void {
        if (!this._currentSession) return;
        this._currentSession.events.push({
            eventName,
            timestamp: Date.now(),
            data,
            sessionId: this._currentSession.sessionId,
            levelId: this._currentSession.levelId,
        });
    }

    endSession(): void {
        if (!this._currentSession) return;
        this._currentSession.endTime = Date.now();
        this._allSessions.push(this._currentSession);
        this._currentSession = null;
    }

    trackLevelStart(levelId: string): void {
        this.trackEvent('level_start', { levelId });
    }

    trackDiagnosisAttempt(diagId: string, selectedQuoteId: string, isCorrect: boolean, timeSpent: number): void {
        this.trackEvent('diagnosis_attempt', { diagId, selectedQuoteId, isCorrect, timeSpent });
    }

    trackEventTriggered(eventId: string, eventType: string): void {
        this.trackEvent('event_triggered', { eventId, eventType });
    }

    trackEventResolved(eventId: string, resolutionId: string, timeToResolve: number): void {
        this.trackEvent('event_resolved', { eventId, resolutionId, timeToResolve });
    }

    trackItemUsed(itemId: string): void {
        this.trackEvent('item_used', { itemId });
    }

    trackAchievementUnlocked(achievementId: string): void {
        this.trackEvent('achievement_unlocked', { achievementId });
    }

    trackTimerExpired(levelId: string): void {
        this.trackEvent('timer_expired', { levelId });
    }

    trackLevelComplete(levelId: string, score: number, accuracy: number): void {
        this.trackEvent('level_complete', { levelId, score, accuracy });
    }

    trackBottleneck(diagId: string, timeSpent: number, errorType: string): void {
        this.trackEvent('bottleneck', { diagId, timeSpent, errorType });
    }

    getSessionSummary(sessionId: string): SessionData | null {
        return this._allSessions.find(s => s.sessionId === sessionId) ?? null;
    }

    getAllSessions(): SessionData[] {
        return this._allSessions;
    }

    getAggregateStats(): {
        totalSessions: number;
        averageAccuracy: number;
        averageTime: number;
        mostCommonBottleneck: string;
        reworkRateTrend: number[];
    } {
        const totalSessions = this._allSessions.length;
        if (totalSessions === 0) {
            return {
                totalSessions: 0,
                averageAccuracy: 0,
                averageTime: 0,
                mostCommonBottleneck: '',
                reworkRateTrend: [],
            };
        }

        let accuracySum = 0;
        let timeSum = 0;
        const bottleneckCounts: Record<string, number> = {};
        const reworkRateTrend: number[] = [];

        for (const session of this._allSessions) {
            const completeEvents = session.events.filter(e => e.eventName === 'level_complete');
            const attemptEvents = session.events.filter(e => e.eventName === 'diagnosis_attempt');

            for (const e of completeEvents) {
                accuracySum += e.data.accuracy ?? 0;
            }

            timeSum += session.endTime - session.startTime;

            for (const e of attemptEvents) {
                if (!e.data.isCorrect && e.data.diagId) {
                    bottleneckCounts[e.data.diagId] = (bottleneckCounts[e.data.diagId] ?? 0) + 1;
                }
            }

            const total = attemptEvents.length || 1;
            const reworks = attemptEvents.filter(e => !e.data.isCorrect).length;
            reworkRateTrend.push(reworks / total);
        }

        const completeCount = this._allSessions.reduce(
            (c, s) => c + s.events.filter(e => e.eventName === 'level_complete').length, 0
        ) || 1;

        let mostCommonBottleneck = '';
        let maxCount = 0;
        for (const [diagId, count] of Object.entries(bottleneckCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonBottleneck = diagId;
            }
        }

        return {
            totalSessions,
            averageAccuracy: accuracySum / completeCount,
            averageTime: timeSum / totalSessions / 1000,
            mostCommonBottleneck,
            reworkRateTrend,
        };
    }

    exportData(): string {
        return JSON.stringify({
            sessions: this._allSessions,
            aggregateStats: this.getAggregateStats(),
        }, null, 2);
    }

    clearAll(): void {
        this._currentSession = null;
        this._allSessions = [];
    }
}
