import { _decorator, Component, director, Scene } from 'cc';
const { ccclass } = _decorator;

export enum SceneName {
    MAIN_MENU = 'MainMenu',
    LEVEL_SELECT = 'LevelSelect',
    GAME_PLAY = 'GamePlay',
    RESULT = 'Result'
}

@ccclass('SceneManager')
export class SceneManager extends Component {
    private static _instance: SceneManager | null = null;

    public static get instance(): SceneManager {
        return SceneManager._instance!;
    }

    private currentScene: SceneName = SceneName.MAIN_MENU;
    private isTransitioning: boolean = false;

    onLoad() {
        if (SceneManager._instance && SceneManager._instance !== this) {
            this.node.destroy();
            return;
        }
        SceneManager._instance = this;
    }

    onDestroy() {
        if (SceneManager._instance === this) {
            SceneManager._instance = null;
        }
    }

    public goToScene(sceneName: SceneName, onLaunched?: () => void): void {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        this.currentScene = sceneName;

        director.loadScene(sceneName, () => {
            this.isTransitioning = false;
            if (onLaunched) {
                onLaunched();
            }
        });
    }

    public getCurrentScene(): SceneName {
        return this.currentScene;
    }

    public goToMainMenu(): void {
        this.goToScene(SceneName.MAIN_MENU);
    }

    public goToLevelSelect(): void {
        this.goToScene(SceneName.LEVEL_SELECT);
    }

    public goToGamePlay(): void {
        this.goToScene(SceneName.GAME_PLAY);
    }

    public goToResult(): void {
        this.goToScene(SceneName.RESULT);
    }
}
