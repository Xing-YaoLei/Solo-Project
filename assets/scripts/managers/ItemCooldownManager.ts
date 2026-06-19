export interface CooldownEntry {
    itemId: string;
    remainingSeconds: number;
    totalSeconds: number;
    isReady: boolean;
}

export class ItemCooldownManager {
    private _cooldowns: Map<string, CooldownEntry> = new Map();

    registerItem(itemId: string, cooldownSeconds: number): void {
        this._cooldowns.set(itemId, {
            itemId,
            remainingSeconds: 0,
            totalSeconds: cooldownSeconds,
            isReady: true,
        });
    }

    useItem(itemId: string): boolean {
        const entry = this._cooldowns.get(itemId);
        if (!entry || !entry.isReady) {
            return false;
        }

        entry.remainingSeconds = entry.totalSeconds;
        entry.isReady = false;
        return true;
    }

    update(dt: number): void {
        for (const entry of this._cooldowns.values()) {
            if (!entry.isReady) {
                entry.remainingSeconds -= dt;
                if (entry.remainingSeconds <= 0) {
                    entry.remainingSeconds = 0;
                    entry.isReady = true;
                }
            }
        }
    }

    getCooldown(itemId: string): CooldownEntry | null {
        return this._cooldowns.get(itemId) ?? null;
    }

    isReady(itemId: string): boolean {
        const entry = this._cooldowns.get(itemId);
        return entry?.isReady ?? false;
    }

    getRemainingSeconds(itemId: string): number {
        const entry = this._cooldowns.get(itemId);
        return entry?.remainingSeconds ?? 0;
    }

    resetAll(): void {
        for (const entry of this._cooldowns.values()) {
            entry.remainingSeconds = 0;
            entry.isReady = true;
        }
    }

    speedUp(itemId: string, seconds: number): void {
        const entry = this._cooldowns.get(itemId);
        if (!entry || entry.isReady) return;

        entry.remainingSeconds = Math.max(0, entry.remainingSeconds - seconds);
        if (entry.remainingSeconds <= 0) {
            entry.isReady = true;
        }
    }
}
