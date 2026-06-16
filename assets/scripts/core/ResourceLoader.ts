import { _decorator, resources, Asset, JsonAsset } from 'cc';

@ccclass('ResourceLoader')
export class ResourceLoader {
    private static _instance: ResourceLoader | null = null;

    public static get instance(): ResourceLoader {
        if (!ResourceLoader._instance) {
            ResourceLoader._instance = new ResourceLoader();
        }
        return ResourceLoader._instance;
    }

    public async loadJson<T>(path: string): Promise<T | null> {
        return new Promise((resolve) => {
            resources.load(path, JsonAsset, (err, asset) => {
                if (err) {
                    console.error(`Failed to load JSON: ${path}`, err);
                    resolve(null);
                    return;
                }
                resolve(asset.json as T);
            });
        });
    }

    public async loadDirJson<T>(dirPath: string): Promise<T[]> {
        return new Promise((resolve) => {
            resources.loadDir(dirPath, JsonAsset, (err, assets) => {
                if (err) {
                    console.error(`Failed to load JSON directory: ${dirPath}`, err);
                    resolve([]);
                    return;
                }
                const results = assets.map(asset => asset.json as T);
                resolve(results);
            });
        });
    }

    public async loadAsset<T extends Asset>(path: string, type: new () => T): Promise<T | null> {
        return new Promise((resolve) => {
            resources.load(path, type, (err, asset) => {
                if (err) {
                    console.error(`Failed to load asset: ${path}`, err);
                    resolve(null);
                    return;
                }
                resolve(asset);
            });
        });
    }

    public release(path: string): void {
        resources.release(path);
    }

    public releaseDir(dirPath: string): void {
        resources.releaseDir(dirPath);
    }
}
