import { _decorator, Component, director, Scene, Node, find, game } from 'cc';
import { SceneBuilder } from './utils/SceneBuilder';
import { loadAllConfigs } from './config/GameConfigs';
import { ConfigManager, ConfigKeys } from './core/ConfigManager';
import { EventManager, GameEvents } from './core/EventManager';
const { ccclass } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
    public static _bootstrapped: boolean = false;

    onLoad() {
        this.doBootstrap();
    }

    start() {
        this.doBootstrap();
    }

    private doBootstrap(): void {
        if (Bootstrap._bootstrapped) return;
        Bootstrap._bootstrapped = true;

        console.log('[Bootstrap] ============== 启动咖啡供应链游戏 ==============');
        const scene = director.getScene();
        if (!scene) {
            console.error('[Bootstrap] 没有活动场景');
            return;
        }

        if (!ConfigManager.getInstance().isLoaded()) {
            try {
                loadAllConfigs();
                const levels = ConfigManager.getInstance().getListConfig(ConfigKeys.LEVELS);
                const ingredients = ConfigManager.getInstance().getListConfig(ConfigKeys.INGREDIENTS);
                const suppliers = ConfigManager.getInstance().getListConfig(ConfigKeys.SUPPLIERS);
                console.log(`[Bootstrap] 配置加载成功: ${levels.length}关卡, ${ingredients.length}原料, ${suppliers.length}供应商`);
            } catch (e) {
                console.error('[Bootstrap] 配置加载失败:', e);
                return;
            }
        }

        const existingMainMenu = find('Canvas/MainMenuRoot', scene);
        if (!existingMainMenu) {
            this.buildMainMenu(scene);
        }
    }

    private buildMainMenu(scene: Scene): void {
        const existingCanvas = find('Canvas', scene);
        if (existingCanvas && existingCanvas.active) {
            existingCanvas.active = false;
        }

        console.log('[Bootstrap] 开始构建主菜单场景...');
        SceneBuilder.buildMainMenuScene(scene, (startLevelId?: string) => {
            console.log(`[Bootstrap] 进入游戏场景${startLevelId ? '，关卡:' + startLevelId : ''}`);
            const s = director.getScene();
            if (s) {
                const canvas = find('Canvas', s);
                if (canvas) canvas.active = false;
                SceneBuilder.buildGameScene(s, startLevelId || 'level_1');
            }
        });

        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: '欢迎来到咖啡供应链模拟',
            type: 'info'
        });
    }
}

export function bootstrapInstantiate(): Bootstrap {
    const scene = director.getScene();
    const existing = find('Bootstrap', scene);
    if (existing) {
        let comp = existing.getComponent('Bootstrap') as Bootstrap | null;
        if (!comp) comp = existing.addComponent(Bootstrap);
        return comp;
    }
    const bootNode = new Node('Bootstrap');
    scene?.addChild(bootNode);
    return bootNode.addComponent(Bootstrap);
}

game.onPostBaseInitDelegate.add(() => {
    console.log('[Bootstrap] game.onPostBaseInitDelegate 触发');
    setTimeout(() => bootstrapInstantiate(), 100);
});

export default Bootstrap;
