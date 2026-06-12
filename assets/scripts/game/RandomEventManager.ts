import { EventManager, GameEvents } from '../core/EventManager';
import { TimeManager } from '../core/TimeManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { GameManager } from '../core/GameManager';
import { RandomEventConfig, ActiveRandomEvent, RandomEventType } from '../models/RandomEvent';

export class RandomEventManager {
    private static _instance: RandomEventManager | null = null;

    private _activeEvents: Map<string, ActiveRandomEvent> = new Map();
    private _eventChance: number = 0.1;
    private _lastCheckDay: number = 0;

    public static getInstance(): RandomEventManager {
        if (!this._instance) {
            this._instance = new RandomEventManager();
        }
        return this._instance;
    }

    public init(eventChance: number): void {
        this._eventChance = eventChance;
        this._lastCheckDay = 0;
    }

    public update(): void {
        const currentDay = TimeManager.getInstance().getCurrentDay();

        if (currentDay !== this._lastCheckDay) {
            this._lastCheckDay = currentDay;
            this.tryTriggerRandomEvent();
        }

        this.checkExpiredEvents();
    }

    private tryTriggerRandomEvent(): void {
        if (Math.random() > this._eventChance) return;

        const allEvents = ConfigManager.getInstance().getListConfig<RandomEventConfig>(ConfigKeys.RANDOM_EVENTS);
        const availableEvents = allEvents.filter(e => !this.isEventActive(e.id));

        if (availableEvents.length === 0) return;

        const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        this.triggerEvent(event);
    }

    public triggerEvent(eventConfig: RandomEventConfig): ActiveRandomEvent {
        const duration = eventConfig.minDurationMinutes +
            Math.random() * (eventConfig.maxDurationMinutes - eventConfig.minDurationMinutes);

        const activeEvent: ActiveRandomEvent = {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            configId: eventConfig.id,
            startTime: Date.now(),
            endTime: Date.now() + duration * 60 * 1000,
            resolved: false
        };

        this._activeEvents.set(activeEvent.eventId, activeEvent);

        EventManager.getInstance().emit(GameEvents.RANDOM_EVENT_TRIGGERED, {
            event: activeEvent,
            config: eventConfig
        });

        if (eventConfig.type === RandomEventType.BATCH_SHORTAGE) {
            EventManager.getInstance().emit(GameEvents.BATCH_SHORTAGE, {
                eventId: activeEvent.eventId,
                affectedIngredients: eventConfig.affectedIngredients,
                severity: eventConfig.severity
            });

            GameManager.getInstance().addCardPoint({
                description: `发生批次短缺事件: ${eventConfig.name}`,
                type: 'event',
                relatedData: { eventId: activeEvent.eventId, configId: eventConfig.id }
            });
        }

        return activeEvent;
    }

    public triggerShortageEvent(ingredientIds?: string[], supplierIds?: string[]): ActiveRandomEvent | null {
        const allEvents = ConfigManager.getInstance().getListConfig<RandomEventConfig>(ConfigKeys.RANDOM_EVENTS);
        const shortageEvents = allEvents.filter(e => e.type === RandomEventType.BATCH_SHORTAGE);

        if (shortageEvents.length === 0) return null;

        let eventConfig = shortageEvents[0];
        if (ingredientIds || supplierIds) {
            const matching = shortageEvents.find(e =>
                (!ingredientIds || e.affectedIngredients?.some(i => ingredientIds.includes(i))) &&
                (!supplierIds || e.affectedSuppliers?.some(s => supplierIds.includes(s)))
            );
            if (matching) eventConfig = matching;
        }

        return this.triggerEvent(eventConfig);
    }

    public resolveEvent(eventId: string, note?: string): boolean {
        const activeEvent = this._activeEvents.get(eventId);
        if (!activeEvent || activeEvent.resolved) return false;

        activeEvent.resolved = true;
        activeEvent.resolvedTime = Date.now();
        activeEvent.note = note;

        EventManager.getInstance().emit(GameEvents.RANDOM_EVENT_RESOLVED, activeEvent);
        GameManager.getInstance().incrementStat('eventsResolved');

        return true;
    }

    private checkExpiredEvents(): void {
        const now = Date.now();
        for (const [eventId, event] of this._activeEvents) {
            if (!event.resolved && now >= event.endTime) {
                this.resolveEvent(eventId, '事件自动结束');
            }
        }
    }

    public isEventActive(configId: string): boolean {
        for (const event of this._activeEvents.values()) {
            if (event.configId === configId && !event.resolved) return true;
        }
        return false;
    }

    public getActiveEvents(): ActiveRandomEvent[] {
        return Array.from(this._activeEvents.values()).filter(e => !e.resolved);
    }

    public getEventConfig(configId: string): RandomEventConfig | null {
        return ConfigManager.getInstance().findById<RandomEventConfig>(ConfigKeys.RANDOM_EVENTS, configId);
    }

    public getAffectedIngredients(): string[] {
        const result: string[] = [];
        for (const event of this.getActiveEvents()) {
            const config = this.getEventConfig(event.configId);
            if (config?.affectedIngredients) {
                result.push(...config.affectedIngredients);
            }
        }
        return [...new Set(result)];
    }

    public getAffectedSuppliers(): string[] {
        const result: string[] = [];
        for (const event of this.getActiveEvents()) {
            const config = this.getEventConfig(event.configId);
            if (config?.affectedSuppliers) {
                result.push(...config.affectedSuppliers);
            }
        }
        return [...new Set(result)];
    }

    public isIngredientAffected(ingredientId: string): boolean {
        return this.getAffectedIngredients().includes(ingredientId);
    }

    public isSupplierAffected(supplierId: string): boolean {
        return this.getAffectedSuppliers().includes(supplierId);
    }

    public reset(): void {
        this._activeEvents.clear();
        this._lastCheckDay = 0;
        this._eventChance = 0.1;
    }
}
