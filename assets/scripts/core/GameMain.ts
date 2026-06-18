import { _decorator, Component, Node, find } from 'cc';
import { GameSceneController } from './GameSceneController';

const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Node)
    canvas: Node | null = null;

    private _controller: GameSceneController | null = null;

    onLoad(): void {
        const canvasNode = this.canvas || find('Canvas');
        this._controller = new GameSceneController(canvasNode);
        this._controller.init();
    }

    update(dt: number): void {
        if (this._controller) {
            this._controller.update(dt);
        }
    }

    onDestroy(): void {
        if (this._controller) {
            this._controller.destroy();
        }
    }
}
