import { _decorator, Component, director, find } from 'cc';
import { SceneBuilder } from './SceneBuilder';
const { ccclass } = _decorator;

@ccclass('GameSceneLoader')
export class GameSceneLoader extends Component {
    onLoad() {
        console.log('[GameSceneLoader] Loading game scene...');
        const scene = director.getScene();
        if (!scene) {
            console.error('[GameSceneLoader] No active scene');
            return;
        }

        const oldCanvas = find('Canvas', scene);
        if (oldCanvas) {
            oldCanvas.active = false;
        }

        SceneBuilder.buildGameScene(scene);
        console.log('[GameSceneLoader] Game scene built successfully');
    }
}
