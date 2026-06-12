import { _decorator, Component, director, find } from 'cc';
import { SceneBuilder } from './SceneBuilder';
import { loadAllConfigs } from '../config/GameConfigs';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
const { ccclass } = _decorator;

@ccclass('GameSceneLoader')
export class GameSceneLoader extends Component {
    onLoad() {
        console.log('[GameSceneLoader] Loading game scene...');

        if (!ConfigManager.getInstance().isLoaded()) {
            try {
                loadAllConfigs();
                const levels = ConfigManager.getInstance().getListConfig(ConfigKeys.LEVELS);
                const ingredients = ConfigManager.getInstance().getListConfig(ConfigKeys.INGREDIENTS);
                const suppliers = ConfigManager.getInstance().getListConfig(ConfigKeys.SUPPLIERS);
                console.log(`[GameSceneLoader] 配置加载成功: ${levels.length}关卡, ${ingredients.length}原料, ${suppliers.length}供应商`);
            } catch (e) {
                console.error('[GameSceneLoader] 配置加载失败:', e);
            }
        }

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
