import { _decorator, Component, Node, Label, Button, UITransform, instantiate, Prefab } from 'cc';
import { SceneManager } from '../core/SceneManager';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';
import { LevelLoader } from '../services/LevelLoader';
import { GameFlowController } from '../services/GameFlowController';
import type { LevelConfig, TaskConfig } from '../data/LevelConfig';
import { GameMode } from '../data/enums/GameMode';
import { TaskAction } from '../data/enums/TaskAction';
import type { TaskResult } from '../data/GameState';
import { TaskPanel } from '../components/TaskPanel';
import { InfoPanel, InfoPanelType } from '../components/InfoPanel';
import { ActionBar } from '../components/ActionBar';
import { TiledMapManager } from '../tiled/TiledMapManager';

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
    @property(TaskPanel)
    taskPanel: TaskPanel | null = null;

    @property(InfoPanel)
    infoPanel: InfoPanel | null = null;

    @property(ActionBar)
    actionBar: ActionBar | null = null;

    @property(TiledMapManager)
    tiledMapManager: TiledMapManager | null = null;

    @property(Node)
    prescriptionButton: Node | null = null;

    @property(Node)
    replenishmentButton: Node | null = null;

    @property(Node)
    insuranceButton: Node | null = null;

    @property(Node)
    pausePanel: Node | null = null;

    private currentLevel: LevelConfig | null = null;
    private currentMode: GameMode = GameMode.FORMAL_TRAINING;
    private currentTask: TaskConfig | null = null;

    async onLoad() {
        const params = SceneManager.instance.getParams();
        const levelId = params.levelId as string;
        this.currentMode = params.mode as GameMode;

        this.currentLevel = await LevelLoader.instance.getLevelById(levelId);
        if (!this.currentLevel) {
            console.error(`Level ${levelId} not found`);
            await SceneManager.instance.goBack();
            return;
        }

        GameFlowController.instance.startLevel(this.currentLevel, this.currentMode);

        EventBus.instance.on(GameEventType.LEVEL_COMPLETED, this.onLevelCompleted, this);
        EventBus.instance.on(GameEventType.PAUSE, this.onPause, this);
        EventBus.instance.on(GameEventType.RESUME, this.onResume, this);
    }

    start() {
        if (!this.currentLevel) return;

        this.setupInfoButtons();
        this.setupActionBar();
        this.loadCurrentTask();

        if (this.tiledMapManager) {
            this.tiledMapManager.loadMap('pharmacy');
            this.tiledMapManager.onAreaClicked = (area: string) => {
                this.onMapAreaClicked(area);
            };
        }
    }

    private setupInfoButtons(): void {
        const buttons = [
            { node: this.prescriptionButton, type: 'prescription' as InfoPanelType },
            { node: this.replenishmentButton, type: 'replenishment' as InfoPanelType },
            { node: this.insuranceButton, type: 'insurance' as InfoPanelType }
        ];

        buttons.forEach(config => {
            if (config.node) {
                config.node.on(Node.EventType.TOUCH_END, () => {
                    this.showInfoPanel(config.type);
                }, this);
            }
        });
    }

    private setupActionBar(): void {
        if (!this.actionBar) return;

        this.actionBar.setCallback((action: TaskAction, result: TaskResult) => {
            this.onActionSubmitted(action, result);
        });
    }

    private loadCurrentTask(): void {
        this.currentTask = GameFlowController.instance.getCurrentTask();
        const state = GameFlowController.instance.getState();

        if (!this.currentTask || !state.currentLevel) return;

        if (this.taskPanel) {
            this.taskPanel.setTask(
                this.currentTask,
                state.currentTaskIndex,
                state.currentLevel.tasks.length
            );
        }

        if (this.infoPanel) {
            this.infoPanel.setTask(this.currentTask, this.currentLevel.prescriptionBlur);
        }

        if (this.tiledMapManager) {
            this.tiledMapManager.highlightTaskArea(state.currentTaskIndex);
        }

        this.highlightActiveButton(null);

        if (this.actionBar) {
            this.actionBar.reset();
        }
    }

    private showInfoPanel(type: InfoPanelType): void {
        if (this.infoPanel) {
            this.infoPanel.showPanel(type);
        }
        this.highlightActiveButton(type);
    }

    private highlightActiveButton(activeType: InfoPanelType | null): void {
        const buttons = [
            { node: this.prescriptionButton, type: 'prescription' },
            { node: this.replenishmentButton, type: 'replenishment' },
            { node: this.insuranceButton, type: 'insurance' }
        ];

        buttons.forEach(config => {
            if (config.node) {
                config.node.opacity = config.type === activeType ? 255 : 150;
            }
        });
    }

    private onMapAreaClicked(area: string): void {
        const areaToType: Record<string, InfoPanelType> = {
            'prescription_area': 'prescription',
            'replenishment_area': 'replenishment',
            'insurance_area': 'insurance'
        };

        const type = areaToType[area];
        if (type) {
            this.showInfoPanel(type);
        }
    }

    private onActionSubmitted(action: TaskAction, result: TaskResult): void {
        this.scheduleOnce(() => {
            const hasMore = GameFlowController.instance.nextTask();
            if (hasMore) {
                this.loadCurrentTask();
            }
        }, 0.5);
    }

    private onPause(): void {
        if (this.pausePanel) {
            this.pausePanel.active = true;
        }
    }

    private onResume(): void {
        if (this.pausePanel) {
            this.pausePanel.active = false;
        }
    }

    private async onLevelCompleted(data: any): Promise<void> {
        await SceneManager.instance.loadScene('Result', data);
    }

    public onResumeButtonClick(): void {
        GameFlowController.instance.resumeGame();
    }

    public async onQuitButtonClick(): Promise<void> {
        GameFlowController.instance.reset();
        await SceneManager.instance.goBack();
    }

    onDestroy() {
        EventBus.instance.off(GameEventType.LEVEL_COMPLETED, this.onLevelCompleted, this);
        EventBus.instance.off(GameEventType.PAUSE, this.onPause, this);
        EventBus.instance.off(GameEventType.RESUME, this.onResume, this);

        if (this.prescriptionButton) {
            this.prescriptionButton.off(Node.EventType.TOUCH_END);
        }
        if (this.replenishmentButton) {
            this.replenishmentButton.off(Node.EventType.TOUCH_END);
        }
        if (this.insuranceButton) {
            this.insuranceButton.off(Node.EventType.TOUCH_END);
        }

        GameFlowController.instance.reset();
    }
}
