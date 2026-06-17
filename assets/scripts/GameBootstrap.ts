import { _decorator, Component, Node, Game, game, view } from 'cc';
import { GameManager } from './GameManager';
import { SceneManager } from './SceneManager';
import { TutorialManager } from './TutorialManager';
const { ccclass } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    private static _bootstrapped: boolean = false;

    onLoad() {
        if (GameBootstrap._bootstrapped) {
            this.destroy();
            return;
        }
        GameBootstrap._bootstrapped = true;

        console.log('Game Bootstrap - 养老护理入住评估游戏启动');

        this.initManagers();
        this.setupResolution();
        this.setupGameEvents();

        const gm = GameManager.instance;
        console.log('Settings loaded:', gm.settings);
        console.log('Tutorial completed:', gm.tutorialCompleted);

        if (TutorialManager.shouldShowTutorial()) {
            console.log('First time playing - will show tutorial');
        }
    }

    start() {
        console.log('Game started successfully');
    }

    initManagers(): void {
        const gameManagerNode = new Node('GameManager');
        gameManagerNode.addComponent(GameManager);
        this.node.addChild(gameManagerNode);
    }

    setupResolution(): void {
        const designWidth = 750;
        const designHeight = 1334;

        view.setDesignResolutionSize(
            designWidth,
            designHeight,
            2
        );

        console.log('Design resolution set:', designWidth, 'x', designHeight);
    }

    setupGameEvents(): void {
        game.on(Game.EVENT_HIDE, this.onGameHide, this);
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
    }

    onGameHide(): void {
        console.log('Game hidden');
    }

    onGameShow(): void {
        console.log('Game shown');
    }

    onDestroy() {
        game.off(Game.EVENT_HIDE, this.onGameHide, this);
        game.off(Game.EVENT_SHOW, this.onGameShow, this);
    }
}
