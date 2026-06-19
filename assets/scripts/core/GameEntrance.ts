import { _decorator, Component, Node, director, resources, JsonAsset, find } from 'cc';
import { ConfigManager } from '../config/ILevelConfig';
import { AnalyticsTracker } from '../managers/AnalyticsTracker';
import { DifficultyManager } from '../managers/DifficultyManager';
import { AchievementManager, Achievement } from '../managers/AchievementManager';
import { LevelSceneController } from './LevelSceneController';

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

        const achievementMgr = AchievementManager.getInstance();

        const defaultAchievements: Achievement[] = [
            {
                id: "first_clear",
                name: "初次完成",
                description: "完成第一个关卡",
                condition: { type: "total_complete", threshold: 1 },
                isUnlocked: false,
                unlockedAt: null,
            },
            {
                id: "perfect_accuracy",
                name: "完美诊断",
                description: "100%准确率完成关卡",
                condition: { type: "accuracy", threshold: 1.0 },
                isUnlocked: false,
                unlockedAt: null,
            },
            {
                id: "speed_demon",
                name: "闪电技师",
                description: "120秒内完成关卡",
                condition: { type: "speed", threshold: 120 },
                isUnlocked: false,
                unlockedAt: null,
            },
            {
                id: "streak_5",
                name: "诊断能手",
                description: "连续正确诊断5次",
                condition: { type: "streak", threshold: 5 },
                isUnlocked: false,
                unlockedAt: null,
            },
            {
                id: "no_rework",
                name: "零返修",
                description: "完成关卡且返修率为0",
                condition: { type: "no_rework", threshold: 0 },
                isUnlocked: false,
                unlockedAt: null,
            },
        ];

        for (const achievement of defaultAchievements) {
            achievementMgr.registerAchievement(achievement);
        }

        this.node.emit('game-ready');

        const canvasNode = find('Canvas');
        const levelController = canvasNode?.getComponent(LevelSceneController);
        if (canvasNode === this.node && levelController && configMgr.isLoaded) {
            levelController.startLevel('level_01');
        } else {
            console.log('[GameEntrance] LevelSceneController not found on Canvas node or config not loaded, skipping auto start');
        }
    }
}
