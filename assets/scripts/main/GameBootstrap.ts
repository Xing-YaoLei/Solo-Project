import { _decorator, Component, Node, find, log, warn } from 'cc';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { TrainingRecordManager } from '../core/TrainingRecordManager';
import { UIController } from '../ui/UIController';
import { HUDController } from '../ui/HUDController';
import { TutorialController } from '../ui/TutorialController';
import { SceneController } from '../scene/SceneController';

const { ccclass, property } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {

    @property(GameManager)
    gameManager: GameManager | null = null;

    @property(UIController)
    uiController: UIController | null = null;

    @property(HUDController)
    hudController: HUDController | null = null;

    @property(TutorialController)
    tutorialController: TutorialController | null = null;

    @property(SceneController)
    sceneController: SceneController | null = null;

    private isInitialized: boolean = false;

    start(): void {
        this.resolveReferences();
        this.initializeGame();
    }

    private resolveReferences(): void {
        if (!this.gameManager) {
            const gmNode = find('GameManager');
            if (gmNode) this.gameManager = gmNode.getComponent(GameManager);
        }
        if (!this.uiController) {
            const uiNode = find('UIController');
            if (uiNode) this.uiController = uiNode.getComponent(UIController);
        }
        if (!this.hudController) {
            const hudNode = find('HUDController');
            if (hudNode) this.hudController = hudNode.getComponent(HUDController);
        }
        if (!this.tutorialController) {
            const tutNode = find('TutorialController');
            if (tutNode) this.tutorialController = tutNode.getComponent(TutorialController);
        }
        if (!this.sceneController) {
            const scNode = find('SceneController');
            if (scNode) this.sceneController = scNode.getComponent(SceneController);
        }
    }

    private initializeGame(): void {
        if (this.isInitialized) return;

        log('[GameBootstrap] 开始初始化游戏...');

        const configReady = ConfigManager.instance.getIsLoaded();
        if (!configReady) {
            ConfigManager.instance.preloadAll((success) => {
                if (success) {
                    this.onConfigLoaded();
                } else {
                    warn('[GameBootstrap] 配置加载失败，部分功能可能不可用');
                    this.onConfigLoaded();
                }
            });
        } else {
            this.onConfigLoaded();
        }
    }

    private onConfigLoaded(): void {
        this.isInitialized = true;

        const profile = SaveManager.instance.getPlayerProfile();
        log(`[GameBootstrap] 玩家: ${profile.playerName} (Lv.${profile.level}), 累计训练: ${profile.totalTrainingCount}次`);

        if (this.gameManager) {
            this.gameManager.setPhase('MENU');
        }

        if (this.uiController) {
            this.uiController.showLevelSelect();
        }

        if (this.tutorialController) {
            this.tutorialController.triggerTutorialsByCondition('FIRST_LAUNCH');
        }

        this.setupCompletionListeners();

        log('[GameBootstrap] 游戏初始化完成');
    }

    private setupCompletionListeners(): void {
        if (!this.gameManager) return;

        this.gameManager.eventTarget.on('action_selected', (data: any) => {
            const option = data.option;
            if (option && this.tutorialController) {
                const profile = SaveManager.instance.getPlayerProfile();
                if (profile.totalTrainingCount === 0) {
                    setTimeout(() => {
                        this.tutorialController?.triggerFirstActionTutorial();
                    }, 1500);
                }
            }
        }, this);

        this.gameManager.eventTarget.on('session_completed', (data: any) => {
            if (this.tutorialController) {
                this.tutorialController.triggerFirstLevelCompleteTutorial();
            }

            const session = data.session;
            if (session && TrainingRecordManager.instance.shouldUnlockComplexLogs(session.prescriptionId)) {
                setTimeout(() => {
                    this.tutorialController?.triggerComplexLogTutorial();
                }, 2000);
            }
        }, this);
    }

    public quickStartLevel(levelId: string): boolean {
        if (!this.isInitialized) {
            warn('[GameBootstrap] 游戏未初始化完成');
            return false;
        }
        return this.gameManager?.startLevel(levelId) || false;
    }

    public showTrainingSummary(): void {
        const summary = TrainingRecordManager.instance.generateTrainingSummary();
        log(`[GameBootstrap] 训练总结:`, summary);
        log(`  - 总训练次数: ${summary.totalSessions}`);
        log(`  - 总体准确率: ${(summary.overallAccuracy * 100).toFixed(1)}%`);
        log(`  - 平均分: ${summary.averageScore.toFixed(1)}`);
        log(`  - 医保拒付累计: ${summary.insuranceRejectionTotal}次`);
        if (summary.recommendedFocusAreas.length > 0) {
            log(`  - 建议重点提升: ${summary.recommendedFocusAreas.join('、')}`);
        }
    }

    public resetPlayerData(): void {
        SaveManager.instance.resetAllData();
        log('[GameBootstrap] 玩家数据已重置');
    }

    public exportTrainingData(): string {
        const replays = SaveManager.instance.getAllReplaySummaries();
        const fullReplays = replays.map(r => SaveManager.instance.loadReplaySession(r.sessionId));
        return JSON.stringify(fullReplays, null, 2);
    }

    public getLevelUnlockProgress(): Record<string, boolean> {
        const levels = ConfigManager.instance.getAllLevels();
        const progress: Record<string, boolean> = {};
        levels.forEach(l => {
            progress[l.id] = SaveManager.instance.isLevelUnlocked(l.id);
        });
        return progress;
    }
}
