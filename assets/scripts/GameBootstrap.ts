import { _decorator, Component, director, game } from 'cc';
import { MainSceneController } from './controllers/MainSceneController';

const { ccclass } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    static instance: GameBootstrap | null = null;

    onLoad() {
        if (GameBootstrap.instance) {
            this.destroy();
            return;
        }
        GameBootstrap.instance = this;

        game.addPersistRootNode(this.node);

        this.initGame();
    }

    private initGame() {
        console.log('本地跑腿经营模拟游戏启动');

        director.preloadScene('Main', (completedCount, totalCount, item) => {
        }, (error) => {
            if (error) {
                console.error('预加载场景失败:', error);
                this.loadMainScene();
            } else {
                console.log('场景预加载完成');
                this.loadMainScene();
            }
        });
    }

    private loadMainScene() {
        director.loadScene('Main', (error, scene) => {
            if (error) {
                console.error('加载主场景失败:', error);
            } else {
                console.log('主场景加载成功');
                this.initControllers(scene);
            }
        });
    }

    private initControllers(scene: any) {
        const canvas = scene.getChildByName('Canvas');
        if (canvas) {
            let mainController = canvas.getComponent(MainSceneController);
            if (!mainController) {
                mainController = canvas.addComponent(MainSceneController);
            }
            console.log('主控制器初始化完成');
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
