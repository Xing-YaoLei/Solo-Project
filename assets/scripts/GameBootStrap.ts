import { _decorator, Component, Node, director, game } from 'cc';
import { SceneManager, SceneName } from './utils/SceneManager';
import { GameManager } from './core/GameManager';
import { GameSaveManager } from './data/GameSaveManager';
const { ccclass, property } = _decorator;

@ccclass('GameBootStrap')
export class GameBootStrap extends Component {
    @property(Node)
    gameManagerPrefab: any = null;

    @property(Node)
    sceneManagerPrefab: any = null;

    onLoad() {
        game.addPersistRootNode(this.node);

        this.initManagers();
    }

    start() {
        this.showMainMenu();
    }

    private initManagers(): void {
        let gameMgrNode = new Node('GameManager');
        gameMgrNode.addComponent(GameManager);
        this.node.addChild(gameMgrNode);

        let sceneMgrNode = new Node('SceneManager');
        sceneMgrNode.addComponent(SceneManager);
        this.node.addChild(sceneMgrNode);

        GameSaveManager.getInstance();
    }

    private showMainMenu(): void {
        director.loadScene(SceneName.MAIN_MENU, () => {
            console.log('Main menu scene loaded');
        });
    }
}
