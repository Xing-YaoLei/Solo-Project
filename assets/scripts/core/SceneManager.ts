import { director, Scene } from 'cc';
import { EventBus } from './EventBus';
import { GameEventType } from '../data/enums/GameEventType';

export interface SceneParams {
    [key: string]: any;
}

export class SceneManager {
    private static _instance: SceneManager | null = null;
    private sceneParams: SceneParams = {};
    private sceneStack: string[] = [];

    public static get instance(): SceneManager {
        if (!SceneManager._instance) {
            SceneManager._instance = new SceneManager();
        }
        return SceneManager._instance;
    }

    public async loadScene(sceneName: string, params?: SceneParams): Promise<void> {
        if (params) {
            this.sceneParams = { ...params };
        }

        this.sceneStack.push(sceneName);

        return new Promise((resolve, reject) => {
            director.loadScene(sceneName, (error, scene) => {
                if (error) {
                    console.error(`Failed to load scene ${sceneName}:`, error);
                    this.sceneStack.pop();
                    reject(error);
                    return;
                }
                EventBus.instance.emit(GameEventType.SCENE_CHANGE, sceneName, this.sceneParams);
                resolve();
            });
        });
    }

    public async goBack(): Promise<void> {
        if (this.sceneStack.length <= 1) {
            console.warn('Cannot go back: already at root scene');
            return;
        }

        this.sceneStack.pop();
        const previousScene = this.sceneStack[this.sceneStack.length - 1];
        await this.loadScene(previousScene);
    }

    public getParams<T extends SceneParams>(): T {
        return this.sceneParams as T;
    }

    public getCurrentSceneName(): string {
        if (this.sceneStack.length === 0) return '';
        return this.sceneStack[this.sceneStack.length - 1];
    }

    public reset(): void {
        this.sceneStack = [];
        this.sceneParams = {};
    }
}
