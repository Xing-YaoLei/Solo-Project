export class ConfigManager {
    private static _instance: ConfigManager | null = null;
    private _configs: Map<string, any> = new Map();
    private _loaded: boolean = false;

    public static getInstance(): ConfigManager {
        if (!this._instance) {
            this._instance = new ConfigManager();
        }
        return this._instance;
    }

    public loadAll(configs: Record<string, any>): void {
        for (const [key, value] of Object.entries(configs)) {
            this._configs.set(key, value);
        }
        this._loaded = true;
    }

    public getConfig<T = any>(key: string): T | null {
        return this._configs.get(key) as T || null;
    }

    public getListConfig<T = any>(key: string): T[] {
        const config = this._configs.get(key);
        return Array.isArray(config) ? config as T[] : [];
    }

    public findById<T extends { id: string }>(key: string, id: string): T | null {
        const list = this.getListConfig<T>(key);
        return list.find(item => item.id === id) || null;
    }

    public isLoaded(): boolean {
        return this._loaded;
    }

    public clear(): void {
        this._configs.clear();
        this._loaded = false;
    }
}

export const ConfigKeys = {
    INGREDIENTS: 'ingredients',
    SUPPLIERS: 'suppliers',
    STORES: 'stores',
    LEVELS: 'levels',
    ITEMS: 'items',
    ACHIEVEMENTS: 'achievements',
    RANDOM_EVENTS: 'randomEvents',
    TUTORIALS: 'tutorials'
};
