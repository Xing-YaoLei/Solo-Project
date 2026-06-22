export interface IStorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}

export class MemoryStorage implements IStorageAdapter {
    private _data: Map<string, string> = new Map();

    getItem(key: string): string | null {
        return this._data.has(key) ? this._data.get(key)! : null;
    }

    setItem(key: string, value: string): void {
        this._data.set(key, value);
    }

    removeItem(key: string): void {
        this._data.delete(key);
    }

    clear(): void {
        this._data.clear();
    }
}

export class BrowserStorage implements IStorageAdapter {
    getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('localStorage setItem failed:', e);
        }
    }

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('localStorage removeItem failed:', e);
        }
    }

    clear(): void {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('localStorage clear failed:', e);
        }
    }
}

export class CocosStorage implements IStorageAdapter {
    getItem(key: string): string | null {
        try {
            if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
                return cc.sys.localStorage.getItem(key);
            }
            return null;
        } catch {
            return null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
                cc.sys.localStorage.setItem(key, value);
            }
        } catch (e) {
            console.error('CocosStorage setItem failed:', e);
        }
    }

    removeItem(key: string): void {
        try {
            if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
                cc.sys.localStorage.removeItem(key);
            }
        } catch (e) {
            console.error('CocosStorage removeItem failed:', e);
        }
    }

    clear(): void {
        try {
            if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
                cc.sys.localStorage.clear();
            }
        } catch (e) {
            console.error('CocosStorage clear failed:', e);
        }
    }
}

export class StorageFactory {
    private static _instance: IStorageAdapter | null = null;

    public static getInstance(): IStorageAdapter {
        if (!StorageFactory._instance) {
            if (typeof cc !== 'undefined' && cc.sys) {
                StorageFactory._instance = new CocosStorage();
            } else if (typeof localStorage !== 'undefined') {
                StorageFactory._instance = new BrowserStorage();
            } else {
                StorageFactory._instance = new MemoryStorage();
            }
        }
        return StorageFactory._instance;
    }

    public static setInstance(storage: IStorageAdapter): void {
        StorageFactory._instance = storage;
    }

    public static reset(): void {
        StorageFactory._instance = null;
    }
}

export interface IResourceLoader {
    loadJson(path: string): Promise<any>;
    loadText(path: string): Promise<string>;
}

export class FileResourceLoader implements IResourceLoader {
    private _basePath: string;

    constructor(basePath: string = '') {
        this._basePath = basePath;
    }

    private async getFs(): Promise<any> {
        try {
            const mod = await import('fs');
            return mod.default || mod;
        } catch (_) {
            try {
                return (globalThis as any).require('fs');
            } catch (e) {
                throw new Error('fs module not available');
            }
        }
    }

    async loadJson(path: string): Promise<any> {
        const fullPath = this._basePath ? `${this._basePath}/${path}` : path;
        try {
            const fs = await this.getFs();
            const content = fs.readFileSync(fullPath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            console.error(`Failed to load JSON from ${fullPath}:`, e);
            throw e;
        }
    }

    async loadText(path: string): Promise<string> {
        const fullPath = this._basePath ? `${this._basePath}/${path}` : path;
        try {
            const fs = await this.getFs();
            return fs.readFileSync(fullPath, 'utf-8');
        } catch (e) {
            console.error(`Failed to load text from ${fullPath}:`, e);
            throw e;
        }
    }
}

export class CocosResourceLoader implements IResourceLoader {
    private _basePath: string;

    constructor(basePath: string = 'configs') {
        this._basePath = basePath;
    }

    async loadJson(path: string): Promise<any> {
        const fullPath = this._basePath ? `${this._basePath}/${path}` : path;
        const url = fullPath.replace(/\.json$/, '');
        return new Promise((resolve, reject) => {
            try {
                const { resources, JsonAsset } = (globalThis as any).cc || {};
                if (!resources || !JsonAsset) {
                    reject(new Error('Cocos resources module not available'));
                    return;
                }
                resources.load(url, JsonAsset, (err: any, asset: any) => {
                    if (err) {
                        reject(err);
                    } else if (asset) {
                        resolve(asset.json);
                    } else {
                        reject(new Error(`Loaded asset is null: ${url}`));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async loadText(path: string): Promise<string> {
        const fullPath = this._basePath ? `${this._basePath}/${path}` : path;
        const url = fullPath.replace(/\.json$/, '');
        return new Promise((resolve, reject) => {
            try {
                const { resources, TextAsset } = (globalThis as any).cc || {};
                if (!resources || !TextAsset) {
                    reject(new Error('Cocos resources module not available'));
                    return;
                }
                resources.load(url, TextAsset, (err: any, asset: any) => {
                    if (err) {
                        reject(err);
                    } else if (asset) {
                        resolve(asset.text);
                    } else {
                        reject(new Error(`Loaded asset is null: ${url}`));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

export class InMemoryResourceLoader implements IResourceLoader {
    private _resources: Map<string, any> = new Map();

    registerJson(path: string, data: any): void {
        this._resources.set(path, data);
    }

    async loadJson(path: string): Promise<any> {
        if (this._resources.has(path)) {
            return JSON.parse(JSON.stringify(this._resources.get(path)));
        }
        throw new Error(`Resource not found: ${path}`);
    }

    async loadText(path: string): Promise<string> {
        if (this._resources.has(path)) {
            return JSON.stringify(this._resources.get(path));
        }
        throw new Error(`Resource not found: ${path}`);
    }
}

export class ResourceFactory {
    private static _instance: IResourceLoader | null = null;

    public static getInstance(): IResourceLoader {
        if (!ResourceFactory._instance) {
            if (typeof cc !== 'undefined' && (cc as any).resources) {
                ResourceFactory._instance = new CocosResourceLoader();
            } else {
                ResourceFactory._instance = new InMemoryResourceLoader();
            }
        }
        return ResourceFactory._instance;
    }

    public static setInstance(loader: IResourceLoader): void {
        ResourceFactory._instance = loader;
    }

    public static reset(): void {
        ResourceFactory._instance = null;
    }
}
