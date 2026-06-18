const { ccclass, property } = (typeof cc !== 'undefined' ? cc : { ccclass: () => (c: any) => c, property: () => () => {} });
import { GameSceneController } from './GameSceneController';

@ccclass('GameMain')
export class GameMain {
  @property(cc.Node)
  canvas: cc.Node | null = null;

  private _controller: GameSceneController | null = null;

  onLoad(): void {
    console.log('GameMain onLoad');
    this._controller = new GameSceneController(this.canvas);
    this._controller.init();
  }

  start(): void {
    console.log('GameMain start');
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
