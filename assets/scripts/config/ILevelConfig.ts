import { resources, JsonAsset } from "cc";

export interface ScoringRule {
    baseScore: number;
    timeBonus: number;
    accuracyWeight: number;
}

export interface LevelConfig {
    id: string;
    name: string;
    difficulty: number;
    timeLimit: number;
    diagnosisIds: string[];
    eventIds: string[];
    scoringRule: ScoringRule;
    requiredAccuracy: number;
}

export interface QuoteOption {
    id: string;
    name: string;
    price: number;
    isCorrect: boolean;
}

export interface DiagnosisConfig {
    id: string;
    description: string;
    photoPaths: string[];
    correctQuoteId: string;
    quoteOptions: QuoteOption[];
    severityLevel: number;
    reworkRisk: number;
}

export type EventType =
    | "parts_shortage"
    | "equipment_failure"
    | "customer_complaint"
    | "safety_hazard"
    | "quality_issue";

export interface TriggerCondition {
    minElapsed: number;
    probability: number;
}

export interface ResolutionOption {
    id: string;
    description: string;
    cost: number;
    timePenalty: number;
}

export interface EventConfig {
    id: string;
    type: EventType;
    triggerCondition: TriggerCondition;
    partsAffected: string[];
    resolutionOptions: ResolutionOption[];
    impactScore: number;
}

interface LevelConfigMap {
    [id: string]: LevelConfig;
}

interface DiagnosisConfigMap {
    [id: string]: DiagnosisConfig;
}

interface EventConfigMap {
    [id: string]: EventConfig;
}

interface AllConfigs {
    levels: LevelConfigMap;
    diagnoses: DiagnosisConfigMap;
    events: EventConfigMap;
}

type ConfigLoadCallback = (err: Error | null) => void;

export class ConfigManager {
    private static _instance: ConfigManager | null = null;

    private _configs: AllConfigs = { levels: {}, diagnoses: {}, events: {} };
    private _loaded = false;
    private _loading = false;
    private _waitQueue: ConfigLoadCallback[] = [];

    static getInstance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    private constructor() {}

    loadAllConfigs(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._loaded) {
                resolve();
                return;
            }
            this._waitQueue.push((err) => {
                if (err) reject(err);
                else resolve();
            });
            if (this._loading) return;
            this._loading = true;

            const configKeys = ["levels", "diagnoses", "events"] as const;
            const paths = [
                "config/levels",
                "config/diagnoses",
                "config/events",
            ];
            let loaded = 0;

            for (let i = 0; i < paths.length; i++) {
                const key = configKeys[i];
                const path = paths[i];
                resources.load(path, JsonAsset, (err: Error | null, asset: JsonAsset | null) => {
                    if (err) {
                        this._flushQueue(err);
                        return;
                    }
                    if (asset && asset.json) {
                        this._configs[key] = asset.json as any;
                    }
                    loaded++;
                    if (loaded === paths.length) {
                        this._loaded = true;
                        this._loading = false;
                        this._flushQueue(null);
                    }
                });
            }
        });
    }

    getLevelConfig(id: string): LevelConfig | null {
        return this._configs.levels[id] ?? null;
    }

    getDiagnosisConfig(id: string): DiagnosisConfig | null {
        return this._configs.diagnoses[id] ?? null;
    }

    getEventConfig(id: string): EventConfig | null {
        return this._configs.events[id] ?? null;
    }

    getAllLevelIds(): string[] {
        return Object.keys(this._configs.levels);
    }

    get isLoaded(): boolean {
        return this._loaded;
    }

    reset(): void {
        this._configs = { levels: {}, diagnoses: {}, events: {} };
        this._loaded = false;
        this._loading = false;
    }

    private _flushQueue(err: Error | null): void {
        const queue = this._waitQueue;
        this._waitQueue = [];
        for (const cb of queue) {
            cb(err);
        }
    }
}
