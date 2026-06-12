import { _decorator, Component, director, Scene, Node, find, game, sys } from 'cc';
import { SceneBuilder } from './utils/SceneBuilder';
import { loadAllConfigs } from './config/GameConfigs';
import { ConfigManager, ConfigKeys } from './core/ConfigManager';
import { EventManager, GameEvents } from './core/EventManager';
import { GameMain } from './scenes/GameMain';
import { MainMenu } from './ui/MainMenu';
const { ccclass } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
    public static _bootstrapped: boolean = false;
    public static _bootstrapAttempts: number = 0;

    onLoad() {
        this.doBootstrap();
    }

    start() {
        this.doBootstrap();
    }

    lateUpdate() {
        if (!Bootstrap._bootstrapped && Bootstrap._bootstrapAttempts < 10) {
            Bootstrap._bootstrapAttempts++;
            this.scheduleOnce(() => this.doBootstrap(), 0.1 * Bootstrap._bootstrapAttempts);
        }
    }

    private doBootstrap(): void {
        if (Bootstrap._bootstrapped) return;

        console.log(`[Bootstrap] ============ 第${Bootstrap._bootstrapAttempts + 1}次启动尝试 ============`);
        const scene = director.getScene();
        if (!scene) {
            console.warn('[Bootstrap] 没有活动场景，稍后重试');
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

        const canvas = find('Canvas', scene);
        const hasGameMain = canvas?.getComponentInChildren(GameMain);
        const hasMainMenu = canvas?.getComponentInChildren(MainMenu);
        const hasOurComponents = hasGameMain || hasMainMenu;

        if (hasOurComponents) {
            console.log('[Bootstrap] 场景已有业务组件，跳过构建');
            Bootstrap._bootstrapped = true;
            return;
        }

        console.log('[Bootstrap] 场景为空白壳，开始动态构建主菜单...');
        this.buildMainMenu(scene);
        Bootstrap._bootstrapped = true;
    }

    private buildMainMenu(scene: Scene): void {
        const existingCanvas = find('Canvas', scene);
        if (existingCanvas && existingCanvas.active) {
            console.log('[Bootstrap] 隐藏旧 Canvas:', existingCanvas.name);
            existingCanvas.active = false;
        }

        console.log('[Bootstrap] 调用 SceneBuilder.buildMainMenuScene...');
        SceneBuilder.buildMainMenuScene(scene, (startLevelId?: string) => {
            console.log(`[Bootstrap] 进入游戏场景，关卡: ${startLevelId || 'level_1'}`);
            const s = director.getScene();
            if (s) {
                const oldCanvas = find('Canvas', s);
                if (oldCanvas) {
                    console.log('[Bootstrap] 销毁旧 Canvas 准备构建游戏场景');
                    oldCanvas.active = false;
                }
                SceneBuilder.buildGameScene(s, startLevelId || 'level_1');
            }
        });

        this.scheduleOnce(() => {
            EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
                message: '欢迎来到咖啡供应链模拟',
                type: 'info'
            });
        }, 0.5);
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
    setTimeout(() => {
        try {
            bootstrapInstantiate();
        } catch (e) {
            console.error('[Bootstrap] 实例化失败:', e);
        }
    }, 100);
});

if (typeof window !== 'undefined') {
    (window as any).__coffeeBootstrap = bootstrapInstantiate;
}

export default Bootstrap;
