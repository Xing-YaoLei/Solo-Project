import { _decorator, Component, director, game, Game, Node, Scene } from 'cc';
import { MainSceneController } from './controllers/MainSceneController';

const { ccclass } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    static instance: GameBootstrap | null = null;

    onLoad() {
        if (GameBootstrap.instance) {
            this.node.destroy();
            return;
        }
        GameBootstrap.instance = this;

        game.addPersistRootNode(this.node);

        this.initGame();
    }

    private initGame() {
        console.log('[GameBootstrap] 本地跑腿经营模拟游戏启动');

        const scene = director.getScene();
        if (scene) {
            this.initControllers(scene);
        } else {
            director.loadScene('Main', (error: Error | null) => {
                if (error) {
                    console.error('[GameBootstrap] 加载主场景失败:', error);
                } else {
                    const loadedScene = director.getScene();
                    if (loadedScene) {
                        this.initControllers(loadedScene);
                    }
                }
            });
        }
    }

    private initControllers(scene: Scene) {
        console.log('[GameBootstrap] 场景已加载:', scene.name);

        const canvas = scene.getChildByName('Canvas');
        if (canvas) {
            let mainController = canvas.getComponent(MainSceneController);
            if (!mainController) {
                mainController = canvas.addComponent(MainSceneController);
            }
            console.log('[GameBootstrap] 主控制器初始化完成');
        }
    }

    restartGame() {
        director.loadScene('Main');
    }

    onDestroy() {
        if (GameBootstrap.instance === this) {
            GameBootstrap.instance = null;
        }
    }
}
