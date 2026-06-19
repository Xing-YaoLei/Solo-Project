import { _decorator, Component, Node, director, resources, JsonAsset } from 'cc';
import { ConfigManager } from '../config/ILevelConfig';
import { AnalyticsTracker } from '../managers/AnalyticsTracker';
import { DifficultyManager } from '../managers/DifficultyManager';
import { AchievementManager } from '../managers/AchievementManager';

const { ccclass, property } = _decorator;

@ccclass('GameEntrance')
export class GameEntrance extends Component {

    @property
    startSceneName: string = 'main';

    async onLoad(): Promise<void> {
        const configMgr = ConfigManager.getInstance();
        if (!configMgr.isLoaded) {
            await configMgr.loadAllConfigs();
        }

        AnalyticsTracker.getInstance();

        const diffMgr = DifficultyManager.getInstance();
        diffMgr.loadCurve(diffMgr.getDefaultCurve());

        AchievementManager.getInstance();

        this.node.emit('game-ready');
    }
}
