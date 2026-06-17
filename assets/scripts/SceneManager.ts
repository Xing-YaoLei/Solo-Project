import { _decorator, Component, director, game } from 'cc';
import { GameManager } from './GameManager';
const { ccclass } = _decorator;

export enum SceneName {
    MainMenu = 'MainMenu',
    LevelSelect = 'LevelSelect',
    Game = 'Game',
    Review = 'Review',
    Settings = 'Settings',
}

@ccclass('SceneManager')
export class SceneManager extends Component {
    private static _instance: SceneManager | null = null;

    public static get instance(): SceneManager {
        if (!this._instance) {
            this._instance = new SceneManager();
        }
        return this._instance;
    }

    private _isTransitioning: boolean = false;
    private _currentScene: SceneName = SceneName.MainMenu;

    constructor() {
        super();
    }

    get currentScene(): SceneName {
        return this._currentScene;
    }

    get isTransitioning(): boolean {
        return this._isTransitioning;
    }

    loadScene(sceneName: SceneName, onComplete?: () => void, onProgress?: (progress: number) => void): void {
        if (this._isTransitioning) return;

        this._isTransitioning = true;

        GameManager.instance.playSound('click');

        director.loadScene(
            sceneName,
            (err) => {
                this._isTransitioning = false;
                if (err) {
                    console.error('Failed to load scene:', sceneName, err);
                    return;
                }
                this._currentScene = sceneName;
                if (onComplete) {
                    onComplete();
                }
            },
            (completedCount: number, totalCount: number, item: any) => {
                if (onProgress && totalCount > 0) {
                    onProgress(completedCount / totalCount);
                }
            }
        );
    }

    loadMainMenu(): void {
        this.loadScene(SceneName.MainMenu);
    }

    loadLevelSelect(): void {
        this.loadScene(SceneName.LevelSelect);
    }

    loadGame(): void {
        this.loadScene(SceneName.Game);
    }

    loadReview(): void {
        this.loadScene(SceneName.Review);
    }

    quickRestart(): void {
        this.loadScene(SceneName.Game);
    }
}
