import { _decorator, Component, Node, director, Canvas, view, UITransform, game, Game } from 'cc';
import { App } from './App';
import { ResourceGenerator } from './utils/ResourceGenerator';
import { GameManager } from './GameManager';
const { ccclass } = _decorator;

@ccclass('Launcher')
export class Launcher extends Component {
    onLoad() {
        console.log('[Launcher] Game starting...');

        game.on(Game.EVENT_GAME_INITED, this.onGameInited, this);

        if (game.isInited) {
            this.onGameInited();
        }
    }

    onGameInited() {
        console.log('[Launcher] Game initialized');

        ResourceGenerator.preloadAll();
        GameManager.instance;

        view.setDesignResolutionSize(750, 1334, 2);

        const canvasNode = this.createCanvas();
        director.getScene()!.addChild(canvasNode);

        const appNode = new Node('App');
        appNode.addComponent(App);
        canvasNode.addChild(appNode);

        console.log('[Launcher] App started successfully');
    }

    createCanvas(): Node {
        let canvasNode = director.getScene()!.getChildByName('Canvas');
        if (canvasNode) return canvasNode;

        canvasNode = new Node('Canvas');
        canvasNode.addComponent(Canvas);
        const transform = canvasNode.addComponent(UITransform);
        transform.setContentSize(750, 1334);
        canvasNode.setPosition(0, 0, 0);

        return canvasNode;
    }

    onDestroy() {
        game.off(Game.EVENT_GAME_INITED, this.onGameInited, this);
    }
}
