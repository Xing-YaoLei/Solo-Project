import { _decorator, Component, Node, director, game, Label, find } from 'cc';
import { GameManager } from './core/GameManager';
import { ToastManager } from './utils/ToastManager';
import { GameSaveManager } from './data/GameSaveManager';
import { MainMenuScene } from './components/MainMenuScene';
import { LevelSelectScene } from './components/LevelSelectScene';
import { GamePlayScene } from './components/GamePlayScene';
const { ccclass } = _decorator;

const SCENE_SCRIPT_MAP: Record<string, new (...args: any[]) => Component> = {
    'MainMenu': MainMenuScene,
    'LevelSelect': LevelSelectScene,
    'GamePlay': GamePlayScene,
};

@ccclass('GameBootStrap')
export class GameBootStrap extends Component {
    private static _instance: GameBootStrap | null = null;

    public static get instance(): GameBootStrap {
        return GameBootStrap._instance!;
    }

    public static hasInstance(): boolean {
        return GameBootStrap._instance !== null;
    }

    public static ensureInitialized(): void {
        if (GameBootStrap._instance) return;

        const existingNode = find('GameBootStrap');
        if (existingNode && existingNode.getComponent(GameBootStrap)) {
            return;
        }

        const bootNode = new Node('GameBootStrap');
        bootNode.addComponent(GameBootStrap);
        game.addPersistRootNode(bootNode);
    }

    onLoad() {
        if (GameBootStrap._instance && GameBootStrap._instance !== this) {
            this.node.destroy();
            return;
        }
        GameBootStrap._instance = this;
        game.addPersistRootNode(this.node);
        this.ensureGameManager();
        this.ensureToastManager();
        GameSaveManager.getInstance();
        director.on(director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLaunched, this);
    }

    onDestroy() {
        if (GameBootStrap._instance === this) {
            GameBootStrap._instance = null;
        }
    }

    start() {
        this.attachSceneScript();
    }

    private onSceneLaunched(): void {
        this.scheduleOnce(() => {
            this.attachSceneScript();
        }, 0);
    }

    private attachSceneScript(): void {
        const scene = director.getScene();
        if (!scene) return;

        const sceneName = scene.name;
        const ScriptClass = SCENE_SCRIPT_MAP[sceneName];
        if (!ScriptClass) return;

        const canvas = scene.getChildByName('Canvas');
        if (!canvas) return;

        let ctrlNode = canvas.getChildByName(sceneName + 'Scene');
        if (!ctrlNode) {
            ctrlNode = canvas.getChildByName(sceneName);
        }

        const targetNode = ctrlNode || canvas;

        if (targetNode.getComponent(ScriptClass)) return;

        targetNode.addComponent(ScriptClass);
    }

    private ensureGameManager(): void {
        if (GameManager.hasInstance()) return;
        const node = new Node('GameManager');
        node.addComponent(GameManager);
        this.node.addChild(node);
    }

    private ensureToastManager(): void {
        if (ToastManager.instance) return;
        const node = new Node('ToastManager');
        const container = new Node('ToastContainer');
        const lblNode = new Node('ToastLabel');
        container.addChild(lblNode);
        node.addChild(container);

        const tm = node.addComponent(ToastManager) as any;
        tm.toastContainer = container;
        tm.toastLabel = lblNode;
        lblNode.addComponent(Label);
        container.active = false;

        this.node.addChild(node);
    }
}
